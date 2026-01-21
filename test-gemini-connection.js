
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAhOlgF-SsLI79v_W3L4b1nyVG19oImNA0";

const genAI = new GoogleGenerativeAI(API_KEY);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = "Explain how AI works in 10 words.";

        console.log("Testing Gemini API connection...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:", text);
    } catch (error) {
        console.error("API Test Failed:", error);
    }
}

run();
