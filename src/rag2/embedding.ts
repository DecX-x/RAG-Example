// src/embeddings.ts
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "dotenv";
config();

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-v3",
  apiKey: process.env.MODELSTUDIO_API_KEY,
  configuration: { baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1" },
  batchSize: 8,
});
