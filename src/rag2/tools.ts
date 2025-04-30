// src/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export function makeRetrieveTool(vectorStore: MemoryVectorStore) {
  const retrieveSchema = z.object({ query: z.string() });
  return tool(
    async ({ query }) => {
      const results = await vectorStore.similaritySearch(query, 2);
      const serialized = results
        .map(doc => `Source: ${doc.metadata.source}\n${doc.pageContent}`)
        .join("\n\n");
      return [serialized, results];
    },
    {
      name: "retrieve",
      description: "Retrieve top-2 relevant document chunks for a query.",
      schema: retrieveSchema,
      responseFormat: "content_and_artifact",
    }
  );
}
