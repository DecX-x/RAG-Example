import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { buildVectorStore } from "./indexDocs";
import { makeGraph } from "./graph";
// Import AIMessage along with HumanMessage
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages"; // Import BaseMessage type

async function main() {
  const rl = readline.createInterface({ input, output });
  console.log("Building index…");
  const vectorStore = await buildVectorStore();

  console.log("Initializing RAG graph…");
  const graph = await makeGraph(vectorStore);

  console.log("Chat RAG CLI ready. Type your question, or ‘exit’ to quit.");
  let conversationMessages: BaseMessage[] = []; // Initialize conversation history

  while (true) {
    const question = await rl.question("> ");
    if (!question || question.toLowerCase() === "exit") break;

    // Add human message to history
    conversationMessages.push(new HumanMessage(question));

    // Run the graph using the stream method with "messages" mode
    const stream = await graph.stream(
      { messages: conversationMessages },
      // Use streamMode: "messages"
      { streamMode: "messages" }
    );

    let finalAiMessage: AIMessage | null = null;
    let gotResponse = false;

    // Iterate through the stream chunks (which might be messages or node outputs).
    for await (const chunk of stream) {
      console.log("Stream Chunk/Message:", JSON.stringify(chunk, null, 2)); // Log chunks/messages for debugging

      let potentialAiMessage: AIMessage | null = null;

      // Scenario 1: The chunk itself is the AIMessage (ideal for streamMode: "messages")
      if (chunk && chunk.constructor?.name === "AIMessage") {
        potentialAiMessage = chunk as AIMessage;
      }
      // Scenario 2: The chunk is an object representing node output(s)
      else if (typeof chunk === 'object' && chunk !== null) {
        // Check keys in the chunk, assuming one key corresponds to the node output
        const nodeNames = Object.keys(chunk);
        for (const nodeName of nodeNames) {
          const nodeOutput = chunk[nodeName];
          // Check if the node output contains messages
          if (nodeOutput && Array.isArray(nodeOutput.messages)) {
            const lastMessage = nodeOutput.messages.at(-1);
            // Check if the last message is an AIMessage
            // (Even if trace showed AIMessageChunk, let's check for AIMessage first in "messages" mode)
            if (lastMessage && lastMessage.constructor?.name === "AIMessage") {
               potentialAiMessage = lastMessage as AIMessage;
               break; // Found it in this node's output
            }
             // Fallback: Check if it's an AIMessageChunk (if trace was accurate)
             else if (lastMessage && lastMessage.constructor?.name === "AIMessageChunk" && lastMessage.content) {
                 // Treat the chunk's content as the full message in this mode
                 potentialAiMessage = new AIMessage({ content: lastMessage.content as string });
                 break; // Found it in this node's output
             }
          }
           // Check if the node output *is* the AIMessage directly
           else if (nodeOutput && nodeOutput.constructor?.name === "AIMessage") {
               potentialAiMessage = nodeOutput as AIMessage;
               break; // Found it in this node's output
           }
        }
      }

      // Process if we found an AI message in this chunk
      if (potentialAiMessage && potentialAiMessage.content) {
          gotResponse = true;
          // Print the complete AI message content
          process.stdout.write("\x1b[32mAssistant:\x1b[0m " + potentialAiMessage.content + "\n\n");
          // Store the last received AI message
          finalAiMessage = potentialAiMessage;
          // In messages mode, we typically expect only one final AIMessage,
          // but we'll let the loop continue just in case the graph yields more.
      }
    }

    // After the stream finishes
    if (gotResponse && finalAiMessage) {
      // Add the final AI message to the conversation history
      // (It might already be the last one if the stream yields messages in order,
      // but explicitly adding the last seen AIMessage is safer)
      // Ensure we don't add duplicates if the history was somehow updated within the stream
      if (conversationMessages.at(-1)?.id !== finalAiMessage.id) {
         conversationMessages.push(finalAiMessage);
      }
    } else {
      console.log("\x1b[31mError: Stream finished, but no AI response messages were received.\x1b[0m\n");
      // Optionally clear or reset conversationMessages if the graph failed
      conversationMessages.pop(); // Remove the last human message if the graph failed
    }
  }
  rl.close();
}

main().catch(console.error);
