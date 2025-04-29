import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv"

// Load environment variables from .env file
config();
const llm_key = process.env.MODELSTUDIO_API_KEY;

const llm = new ChatOpenAI({
    model: "qwen-turbo-latest",
    apiKey: llm_key,
    temperature: 0.7,
    configuration: {
        baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        
    },
    streaming: true,
});


export default llm;