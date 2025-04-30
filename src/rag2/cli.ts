// src/cli.ts
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { buildVectorStore } from "./indexDocs";
import { makeGraph } from "./graph";
import { HumanMessage } from "@langchain/core/messages";
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

    // Run the graph from start to finish with the current messages
    // Assuming the graph input schema expects an object like { messages: BaseMessage[] }
    const result = await graph.invoke({ messages: conversationMessages });

    // Update conversation history with the result from the graph
    conversationMessages = result.messages;

    const aiReply = conversationMessages.at(-1); // Get the latest message (AI reply)
    if (aiReply) {
      console.log("\x1b[32mAssistant:\x1b[0m", aiReply.content, "\n");
    } else {
      console.log("\x1b[31mError: No response from AI.\x1b[0m\n"); // Handle cases where AI might not respond
    }
  }
  rl.close();
}

main().catch(console.error);
