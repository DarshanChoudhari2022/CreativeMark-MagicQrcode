// Using Groq (Free Tier, Fast LLaMA) - https://console.groq.com
// Fallback 1: Google Gemini (Free Tier, Flash)
// Fallback 2: Hugging Face (Free Tier, Llama 3)
// Fallback 3: Static Hardcoded Responses (Offline Safety Net)

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateReviewSuggestions as generateHFReviews, generateAutoReply as generateHFReply } from './huggingface';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// Use gemini-flash-latest for better limits/availability than 1.5-flash
const geminiModel = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export interface ReviewSuggestion {
    text: string;
    rating: number;
}

// --- STATIC FALLBACKS ---
const STATIC_REVIEWS = {
    positive: [
        "Absolutely amazing experience! The service was top-notch and the staff was incredibly friendly. Highly recommend!",
        "Five stars all the way! I was thoroughly impressed with the quality and attention to detail. Will definitely be coming back.",
        "Great value for money. The atmosphere was welcoming and everything exceeded my expectations.",
        "A hidden gem! So glad I found this place. The team went above and beyond to ensure I was satisfied.",
        "Exceptional quality and service. I’ve recommended this to all my friends and family.",
        "Truly outstanding! The attention to detail is evident in everything they do. Keep up the great work!",
        "Wonderful experience from start to finish. Professional, efficient, and very reasonably priced.",
        "I was blown away by how good the service was. Definitely one of the best experiences I've had in a long time.",
        "Simply the best! I wouldn't trust anyone else. They truly care about their customers.",
        "Fantastic! Exceeded all my expectations. I will definitely be a returning customer.",
        "Top-class service! The staff is knowledgeable and very helpful. A pleasure to deal with.",
        "I'm a regular customer for a reason. Consistently great service and high-quality results every time.",
        "Absolutely delighted with the outcome. Professional, reliable, and friendly. What more could you ask for?",
        "10/10 would recommend! The entire process was smooth and hassle-free. Very happy customer.",
        "Incredible! They really know their stuff. I felt valued and well taken care of throughout.",
        "Superb! The team is passionate and dedicated. It really shows in the quality of their work.",
        "Excellent! Fast, friendly, and efficient. I couldn't be happier with the service I received.",
        "A wonderful local business. Support them! You won't be disappointed.",
        "Brilliant! Everything was perfect. I can't find a single fault. Highly recommended.",
        "Impressive level of professionalism. They delivered exactly what was promised, and on time.",
        "Great vibes and even better service. A truly enjoyable experience.",
        "The best in town! I've tried others, but none compare to the quality and service here.",
        "Remarkable service! They made everything so easy for me. I'm very grateful.",
        "Outstanding! I was treated like a VIP. A truly memorable experience.",
        "Perfect! Exactly what I was looking for. I will be back for sure.",
        "Highly professional and reliable. I have complete trust in their services.",
        "A breath of fresh air! Honest, transparent, and high-quality service.",
        "Superior quality! You can tell they take pride in what they do.",
        "Simply amazing! I'm so happy with the results. Thank you!",
        "First-class experience! I would highly recommend them to anyone looking for quality."
    ],
    neutral: [
        "It was a decent experience. There are some areas for improvement, but overall it was okay.",
        "Good service, but the wait times were a bit longer than expected. Acceptable for the price.",
        "Not bad, but I've had better experiences elsewhere. Worth a try if you're in the area.",
        "Average experience. The staff was friendly, but the service could have been faster.",
        "It was fine. Nothing to write home about, but it did the job.",
        "A bit hit or miss. Some aspects were great, others could use some work.",
        "Reasonable service for the price. I might come back, but I'll probably try other places too.",
        "Okay, but not great. I expected a bit more given the reviews.",
        "Standard experience. No major complaints, but nothing really stood out either.",
        "It was alright. The staff seemed a bit disorganized, but they were polite.",
        "Fair service. Good enough if you're in a pinch, but there are better options out there.",
        "Mixed feelings. The quality was good, but the customer service was lacking.",
        "Satisfactory. It met my basic needs, but didn't exceed expectations.",
        "Middle of the road. Not terrible, but not amazing either.",
        "Decent enough. I probably wouldn't go out of my way to come back, but it was fine.",
        "Could be better. There is definitely room for improvement in terms of efficiency.",
        "Just okay. I've had better service at similar places for the same price.",
        "Not my favorite, but it was acceptable. I might give them another chance.",
        "Mediocre experience. Neither good nor bad, just average.",
        "It served its purpose. Nothing special, but effective enough."
    ]
};

const STATIC_REPLIES = [
    "Thank you so much for your kind words! We look forward to seeing you again soon.",
    "We appreciate your feedback and are glad you had a good experience!",
    "Thank you for sharing your thoughts. We hope to serve you again!",
    "Thank you for your review! We're happy to hear you enjoyed your visit.",
    "We're thrilled to hear you had a great experience! Thanks for choosing us.",
    "Thanks for the 5 stars! We appreciate your support.",
    "We're so glad you enjoyed our service. Hope to see you back soon!",
    "Thank you for taking the time to leave us a review. It means a lot to our team.",
    "We appreciate your business and your feedback. Thank you!",
    "Thanks for the positive vibes! We're happy to have met your expectations."
];

// --- HELPER FUNCTIONS ---

async function generateGeminiReviews(prompt: string, rating: number): Promise<ReviewSuggestion[]> {
    try {
        console.log("⚠️ Falling back to Gemini API...");
        const result = await geminiModel.generateContent(prompt + " \n\nReturn strictly a JSON array of strings. Example: [\"Review 1\", \"Review 2\"]");
        const response = await result.response;
        const text = response.text();

        return parseReviewResponse(text, rating);
    } catch (error) {
        console.warn("❌ Gemini Fallback Failed:", error);
        throw error; // Propagate to next fallback
    }
}

function parseReviewResponse(text: string, rating: number): ReviewSuggestion[] {
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    let suggestions: string[] = [];
    try {
        suggestions = JSON.parse(cleanedText);
    } catch {
        const match = cleanedText.match(/\[[\s\S]*?\]/);
        if (match) {
            try { suggestions = JSON.parse(match[0]); } catch { }
        }
    }

    if (!suggestions.length) {
        suggestions = text.split('\n')
            .map(l => l.replace(/^[-*\d.]+\s*/, '').replace(/^"|"$/g, '').trim())
            .filter(l => l.length > 10 && !l.includes('['));
    }

    return suggestions.slice(0, 3).map(s => ({
        text: typeof s === 'string' ? s : String(s),
        rating
    }));
}

function getStaticReviews(rating: number): ReviewSuggestion[] {
    console.log("⚠️ Using Static Fallback Data");
    const source = rating >= 4 ? STATIC_REVIEWS.positive : STATIC_REVIEWS.neutral;

    // Shuffle and pick 3
    const shuffled = [...source].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(text => ({ text, rating }));
}

// --- MAIN FUNCTIONS ---

export async function generateReviewSuggestions(
    businessName: string,
    rating: number,
    language: string = 'en',
    businessContext: string = '',
    tone: string = 'Professional'
): Promise<ReviewSuggestion[]> {

    const languageMap: Record<string, string> = {
        en: 'English',
        hi: 'Hindi',
        mr: 'Marathi',
    };

    const prompt = `Generate 3 SEO-optimized, authentic Google review suggestions for "${businessName}".

Business Context: ${businessContext || 'General business'}
Rating: ${rating} stars
Tone: ${tone}
Language: ${languageMap[language] || 'English'}

Instructions:
- Include relevant keywords from the business context
- Keep each review 15-30 words, natural sounding
- Return ONLY a JSON array of strings, no other text
- Example format: ["Review 1 text", "Review 2 text", "Review 3 text"]`;

    // 1. Try Groq
    try {
        if (!GROQ_API_KEY) throw new Error("Groq Key Missing");

        console.log("🚀 Fetching reviews from Groq API...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are a review generation assistant. Output only valid JSON arrays." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 300,
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '[]';
        return parseReviewResponse(text, rating);

    } catch (groqError) {
        console.warn("🔻 Groq failed, switching to Gemini:", groqError);

        // 2. Try Gemini
        try {
            return await generateGeminiReviews(prompt, rating);
        } catch (geminiError) {

            // 3. Try Hugging Face
            try {
                console.log("⚠️ Falling back to Hugging Face...");
                return await generateHFReviews(businessName, rating, language, businessContext, tone);
            } catch (hfError) {
                console.error("❌ All AI APIs failed. Using static fallback.", hfError);

                // 4. Static Fallback
                return getStaticReviews(rating);
            }
        }
    }
}

export async function generateAutoReply(
    reviewText: string,
    rating: number,
    businessName: string,
    language: string = 'en'
): Promise<string> {
    const prompt = `Write a short, professional response to this ${rating}-star review for ${businessName}: "${reviewText}". Keep it warm and under 40 words.`;

    // 1. Try Groq
    try {
        if (!GROQ_API_KEY) throw new Error("Groq Key Missing");

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 100,
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || STATIC_REPLIES[0];

    } catch (groqError) {
        console.warn("Groq Auto-reply failed:", groqError);

        // 2. Try Gemini
        try {
            const result = await geminiModel.generateContent(prompt);
            return result.response.text();
        } catch (geminiError) {

            // 3. Try Hugging Face
            try {
                console.log("⚠️ Falling back to Hugging Face for auto-reply...");
                return await generateHFReply(reviewText, rating, businessName, language);
            } catch (hfError) {

                // 4. Static Fallback
                console.error("❌ All Auto-reply APIs failed. Using static fallback.", hfError);
                return STATIC_REPLIES[Math.floor(Math.random() * STATIC_REPLIES.length)];
            }
        }
    }
}
