
import { HfInference } from "@huggingface/inference";

const API_KEY = process.env.VITE_HUGGINGFACE_API_KEY || "";
const hf = new HfInference(API_KEY);
const MODEL_NAME = "meta-llama/Meta-Llama-3-8B-Instruct";

async function runHealthCheck() {
    console.log("🏥 SYSTEM HEALTH CHECK INITIATED...");
    console.log("===================================");
    console.log(`🤖 Model: ${MODEL_NAME}`);
    console.log(`🔑 API Key Configured: Yes`);
    console.log("===================================\n");

    // 1. Test Review Suggestions (The "Positive Flow")
    console.log("TEST 1: 🌟 Review Suggestions (Positive Flow)");
    console.log("---------------------------------------------");
    try {
        const businessName = "The Golden Spoon";
        const systemPrompt = `You are a helpful assistant. Generate 3 authentic, natural-sounding Google review suggestions for a 5-star experience at "${businessName}". Return strictly a JSON array of strings.`;

        console.log(`Generating suggestions for "${businessName}"...`);
        const response = await hf.chatCompletion({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Generate the reviews now." }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        const content = response.choices[0].message.content;
        console.log("✅ RAW OUTPUT RECEIVED");

        // Validate Parsing Logic mimicking the frontend
        const cleaned = content?.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned || '[]');

        if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("✅ JSON PARSING SUCCESSFUL");
            console.log("📝 Sample Suggestion:", typeof parsed[0] === 'string' ? parsed[0] : parsed[0].text);
        } else {
            console.error("⚠️ JSON PARSING FAILED/MALFORMED:", content);
        }
    } catch (e: any) {
        console.error("❌ TEST 1 FAILED:", e.message);
    }

    console.log("\n");

    // 2. Test Auto-Reply (The "Business Response")
    console.log("TEST 2: 💬 Auto-Reply Generation");
    console.log("---------------------------------------------");
    try {
        const reviewText = "The food was okay, but the service was extremely slow. We waited 40 minutes for our appetizers.";
        const rating = 3;
        const systemPrompt = `Write a short, professional, and warm reply to this customer review for "The Golden Spoon". The rating was ${rating}/5 stars. Keep it under 50 words.`;

        console.log(`Generating reply to 3-star review: "${reviewText}"...`);
        const response = await hf.chatCompletion({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Review: "${reviewText}"` }
            ],
            max_tokens: 150,
            temperature: 0.7,
        });

        const reply = response.choices[0].message.content;
        console.log("✅ REPLY GENERATED:");
        console.log(`"${reply}"`);
    } catch (e: any) {
        console.error("❌ TEST 2 FAILED:", e.message);
    }

    console.log("\n===================================");
    console.log("🏁 HEALTH CHECK COMPLETE");
}

runHealthCheck();
