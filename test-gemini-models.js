
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAhOlgF-SsLI79v_W3L4b1nyVG19oImNA0";

const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro", "gemini-1.0-pro"];

    for (const modelName of models) {
        console.log(`Testing model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = "Hi";
            const result = await model.generateContent(prompt);
            const response = await result.response;
            console.log(`SUCCESS with ${modelName}:`, response.text());
            return; // Exit after first success
        } catch (error) {
            console.error(`FAILED ${modelName}:`, error.message);
        }
    }
}

run();
