// src/llm.ts
import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
config();
const apiKey = process.env.DEEPINFRA_API_KEY;

export const llm = new ChatOpenAI({
  model: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
  apiKey: apiKey,
  temperature: 0.7,
  configuration: {
    baseURL: "https://api.deepinfra.com/v1/openai"
  }
});
