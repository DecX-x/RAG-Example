import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { buildVectorStore } from "./indexDocs";
import { makeGraph } from "./graph";
import { HumanMessage, AIMessageChunk, AIMessage } from "@langchain/core/messages"; // Import AIMessageChunk and AIMessage
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

    // Run the graph using the stream method with "updates" mode
    const stream = await graph.stream(
      { messages: conversationMessages },
      { streamMode: "updates" }
    );

    let accumulatedContent = "";
    let firstChunk = true;
    let gotResponse = false;

    // Iterate through the stream chunks.
    for await (const chunk of stream) {
      // console.log("Stream Chunk:", JSON.stringify(chunk, null, 2)); // Optional: Log chunks for debugging

      // Check keys in the chunk, assuming one key corresponds to the node output
      const nodeName = Object.keys(chunk)[0];
      if (nodeName) {
        const nodeOutput = chunk[nodeName];
        // Check if the node output contains messages
        if (nodeOutput && Array.isArray(nodeOutput.messages)) {
          const lastMessage = nodeOutput.messages.at(-1);
          // Check if the last message is an AIMessageChunk (streaming response)
          if (lastMessage && lastMessage.constructor.name === "AIMessageChunk") {
            const messageChunk = lastMessage as AIMessageChunk;
            if (messageChunk.content) {
              gotResponse = true;
              // Print prefix only for the first chunk of the response
              if (firstChunk) {
                process.stdout.write("\x1b[32mAssistant:\x1b[0m ");
                firstChunk = false;
              }
              // Print the content chunk without a newline
              process.stdout.write(messageChunk.content as string);
              // Accumulate the content
              accumulatedContent += messageChunk.content;
            }
          }
        }
      }
    }

    // After the stream finishes
    if (gotResponse) {
      process.stdout.write("\n\n"); // Add newlines after the complete response
      // Add the fully accumulated AI response to the conversation history
      conversationMessages.push(new AIMessage(accumulatedContent));
    } else {
      console.log("\x1b[31mError: Stream finished, but no AI response chunks were received.\x1b[0m\n");
      // Optionally clear or reset conversationMessages if the graph failed
      conversationMessages.pop(); // Remove the last human message if the graph failed
    }
  }
  rl.close();
}

main().catch(console.error);
