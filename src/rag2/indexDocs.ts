// src/indexDocs.ts
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { embeddings } from "./embedding";
export async function buildVectorStore() {
  const loader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/",
    { selector: "p" }
  );  // scrape all <p> tags :contentReference[oaicite:2]{index=2}
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const chunks = await splitter.splitDocuments(docs);

  const vectorStore = new MemoryVectorStore(embeddings);
  await vectorStore.addDocuments(chunks);
  return vectorStore;
}
