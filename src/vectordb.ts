import { MemoryVectorStore } from "langchain/vectorstores/memory";
import embeddings from "./embedding";

const vectorStore = new MemoryVectorStore(embeddings);

export { vectorStore };
