import OpenAI from "openai";
import geminiClient from "./geminiClient.js";
let openaiClient;

export default {
    name: "summarize",
    description: "Summarise the given text into 3-6 bullets",
    run: async (text) => {
        if (!text) return "No text provided to summarize.";
        try {
            const prompt = `Summarize text below into 5 concise bullet points:\n\n${text}\n\nBullets:`;
            // Prefer Gemini if key present
            if (process.env.GEMINI_API_KEY) {
                const out = await geminiClient.generate({
                    apiKey: process.env.GEMINI_API_KEY,
                    model: process.env.GEMINI_MODEL ,
                    prompt: [{ role: "user", content: prompt }],
                    max_output_tokens: 400,
                    temperature: 0.1,
                });
                return (out || "").trim();
            }
            if (!openaiClient) {
                openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            }
            const response = await openaiClient.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-4",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 400,
                temperature: 0.1,
            });
            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error("Error during summarization:", error.message);
            return "Summarization failed due to an API error.";
        }
    }
};