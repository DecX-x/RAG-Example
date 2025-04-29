import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "dotenv"

// Load environment variables from .env file
config();
const llm_key = process.env.MODELSTUDIO_API_KEY;

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-v3",
  apiKey: llm_key,
  configuration: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  }
});

export default embeddings;