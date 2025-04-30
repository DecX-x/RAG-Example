// src/llm.ts
import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
config();

export const llm = new ChatOpenAI({
  model: "qwen-turbo-latest",
  apiKey: process.env.MODELSTUDIO_API_KEY,
  temperature: 0.7,
  configuration: { baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1" },
  streaming: true,
});
