// src/graph.ts
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
  } from "@langchain/core/messages";
  import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
  import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
  import { llm } from "./llm";
  import { makeRetrieveTool } from "./tools";
  
  export async function makeGraph(vectorStore) {
    const retrieve = makeRetrieveTool(vectorStore);
  
    // Node 1: Decide whether to call retrieve or respond directly
    async function queryOrRespond(state: typeof MessagesAnnotation.State) {
      const llmWithTools = llm.bindTools([retrieve]);
      const resp = await llmWithTools.invoke(state.messages);
      return { messages: [resp] };
    }
  
    // Node 2: Execute the retrieve tool
    const toolsNode = new ToolNode([retrieve]);
  
    // Node 3: Generate final answer using retrieved context
    async function generate(state: typeof MessagesAnnotation.State) {
      // Collect only the latest ToolMessages
      const toolMsgs = state.messages.filter(m => m instanceof ToolMessage);
      const docsContent = toolMsgs.map(m => m.content).join("\n\n");
  
      const systemPrompt =
        "You are an assistant. Use the retrieved context to answer concisely in max 3 sentences.\n\n" +
        docsContent;
      const userAndPrev = state.messages.filter(
        m =>
          m instanceof HumanMessage ||
          m instanceof SystemMessage ||
          (m instanceof AIMessage && m.tool_calls.length === 0)
      );
      const prompt = [new SystemMessage(systemPrompt), ...userAndPrev];
      const resp = await llm.invoke(prompt);
      return { messages: [resp] };
    }
  
    // Assemble graph
    const builder = new StateGraph(MessagesAnnotation)
      .addNode("queryOrRespond", queryOrRespond)
      .addNode("tools", toolsNode)
      .addNode("generate", generate)
      .addEdge("__start__", "queryOrRespond")
      .addConditionalEdges("queryOrRespond", toolsCondition, {
        __end__: "__end__",
        tools: "tools",
      })
      .addEdge("tools", "generate")
      .addEdge("generate", "__end__");
  
    return builder.compile();
  }
  