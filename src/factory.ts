import { ChatOllama } from "@langchain/ollama";
import { ChatOpenAI } from "@langchain/openai";

export function createChatModel() {
    const mode = process.env.MODEL_MODE ?? "local";

    if (mode === "local") {
        return new ChatOllama({
            model: process.env.OLLAMA_MODEL ?? "gemma3",
            baseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
            temperature: 0.7,
        });
    }

    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required when MODEL_MODE=remote");
    }

    return new ChatOpenAI({
        model: process.env.REMOTE_MODEL ?? "gpt-4.1-mini",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.7,
    });
}