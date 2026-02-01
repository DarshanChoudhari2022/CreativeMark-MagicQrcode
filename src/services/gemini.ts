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
const STATIC_REVIEWS: Record<string, { positive: string[], neutral: string[] }> = {
    en: {
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
            "Fantastic! Exceeded all my expectations. I will definitely be a returning customer."
        ],
        neutral: [
            "It was a decent experience. There are some areas for improvement, but overall it was okay.",
            "Good service, but the wait times were a bit longer than expected. Acceptable for the price.",
            "Not bad, but I've had better experiences elsewhere. Worth a try if you're in the area.",
            "Average experience. The staff was friendly, but the service could have been faster.",
            "It was fine. Nothing to write home about, but it did the job."
        ]
    },
    /* 
    mr: {
        positive: [
            "खूप छान अनुभव आला! सेवा उत्कृष्ट होती आणि कर्मचारी अतिशय मदतनीस होते. सर्वांना शिफारस करतो!",
            "पाच स्टार! मी गुणवत्तेने आणि कामाच्या अचूकतेने खूप प्रभावित झालो आहे. नक्कीच पुन्हा येईन.",
            "पैसे वसूल अनुभव! वातावरण खूपच स्वागतार्ह होते आणि सर्व काही माझ्या अपेक्षेपेक्षा चांगले होते.",
            "एक उत्तम ठिकाण! मला हे ठिकाण सापडल्याचा आनंद आहे. टीमने मला पूर्णपणे समाधानी करण्यासाठी खूप प्रयत्न केले.",
            "अतिशय व्यावसायिक आणि विश्वसनीय सेवा. मी माझ्या सर्व मित्र आणि कुटुंबाला याची शिफारस केली आहे.",
            "उत्कृष्ट गुणवत्ता आणि सेवा. इथला अनुभव खूपच सुखद होता.",
            "खूपच अभिमानास्पद काम! कामाची गुणवत्ता आणि कर्मचारी यांची वागणूक खूपच चांगली आहे.",
            "परिसरातील सर्वोत्तम सेवा! आम्ही नक्कीच पुन्हा भेट देऊ आणि इतरांनाही सांगू.",
            "अतिशय जलद आणि कार्यक्षम सेवा. कामात खूपच चोखपणा आहे.",
            "मनापासून धन्यवाद! तुमची सेवा पाहून खूप आनंद झाला. नक्कीच पाच स्टार देणार."
        ],
        neutral: [
            "अनुभव बरा होता. सुधारणेला वाव आहे, पण एकंदरीत ठीक होते.",
            "चांगली सेवा, पण प्रतीक्षेचा वेळ अपेक्षेपेक्षा जास्त होता. किंमतीनुसार ठीक आहे.",
            "वाईट नाही, पण इतर ठिकाणी मला चांगले अनुभव आले आहेत. परिसरात असाल तर एकदा भेट द्यायला हरकत नाही.",
            "सरासरी अनुभव. कर्मचारी चांगले आहेत पण सेवा थोडी जलद हवी होती.",
            "काम झाले, पण जसं अपेक्षित होतं तसं उत्कृष्ट नव्हतं. ठीकठाक म्हणता येईल."
        ]
    }
    */
};

const STATIC_REPLIES: Record<string, string[]> = {
    en: [
        "Thank you so much for your kind words! We look forward to seeing you again soon.",
        "We appreciate your feedback and are glad you had a good experience!",
        "Thank you for sharing your thoughts. We hope to serve you again!",
        "Thank you for your review! We're happy to hear you enjoyed your visit.",
        "We're thrilled to hear you had a great experience! Thanks for choosing us."
    ],
    /*
    mr: [
        "तुमच्या प्रेमळ शब्दांबद्दल मनापासून धन्यवाद! आम्ही तुम्हाला पुन्हा सेवा देण्यासाठी उत्सुक आहोत.",
        "आम्ही तुमच्या अभिप्रायाची प्रशंसा करतो आणि तुम्हाला चांगला अनुभव आला याचा आम्हाला आनंद आहे!",
        "तुमचे विचार मांडल्याबद्दल धन्यवाद. आम्हाला पुन्हा तुमची सेवा करायला आवडेल!",
        "रिव्ह्यू दिल्याबद्दल धन्यवाद! तुम्हाला आमची सेवा आवडली हे ऐकून आम्हाला आनंद झाला.",
        "तुम्हाला उत्तम अनुभव आला हे ऐकून आम्हाला खूप आनंद झाला! आमची निवड केल्याबद्दल धन्यवाद."
    ]
    */
};

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

function getStaticReviews(rating: number, language: string = 'en'): ReviewSuggestion[] {
    console.log(`⚠️ Using Static Fallback Data (${language})`);
    const langSet = STATIC_REVIEWS[language] || STATIC_REVIEWS['en'];
    const source = rating >= 4 ? langSet.positive : langSet.neutral;

    // Shuffle and pick 3
    const shuffled = [...source].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(text => ({ text, rating }));
}

// --- SHARED HELPERS ---
const LANGUAGE_MAP: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    // mr: 'Marathi', // Commented out Marathi as requested
};




// --- MAIN FUNCTIONS ---

export async function generateReviewSuggestions(
    businessName: string,
    rating: number,
    language: string = 'en',
    businessContext: string = '',
    tone: string = 'Professional'
): Promise<ReviewSuggestion[]> {

    // Randomize the prompt slightly to prevent caching and deterministic repetition
    const variations = [
        "Focus on the friendly staff.",
        "Highlight the speed of service.",
        "Mention the great atmosphere.",
        "Emphasize the value for money.",
        "Focus on the overall quality.",
        "Make them sound very enthusiastic!",
        "Keep them short and sweet.",
        "Focus on professionalism."
    ];
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    const uniqueSessionId = Math.random().toString(36).substring(7);

    const prompt = `Generate 3 unique, SEO-optimized, authentic Google review suggestions for "${businessName}" (Session: ${uniqueSessionId}).

Business Context: ${businessContext || 'General business'}
Rating: ${rating} stars
Tone: ${tone}
Language: ${LANGUAGE_MAP[language] || 'English'}
Variation Goal: ${randomVariation}

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
                temperature: 0.9,
                max_tokens: 300,
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || '[]';
        const suggestions = parseReviewResponse(text, rating);

        return suggestions;

    } catch (groqError) {
        console.warn("🔻 Groq failed, switching to Gemini:", groqError);

        // 2. Try Gemini
        try {
            const suggestions = await generateGeminiReviews(prompt, rating);
            return suggestions;
        } catch (geminiError) {

            // 3. Try Hugging Face
            try {
                console.log("⚠️ Falling back to Hugging Face...");
                return await generateHFReviews(businessName, rating, language, businessContext, tone);
            } catch (hfError) {
                console.error("❌ All AI APIs failed. Using static fallback.", hfError);

                // 4. Static Fallback
                return getStaticReviews(rating, language);
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
        const reply = data.choices?.[0]?.message?.content;

        return reply || (STATIC_REPLIES[language] || STATIC_REPLIES['en'])[0];

    } catch (groqError) {
        console.warn("Groq Auto-reply failed:", groqError);

        // 2. Try Gemini
        try {
            const result = await geminiModel.generateContent(prompt);
            const reply = result.response.text();

            return reply;
        } catch (geminiError) {

            // 3. Try Hugging Face
            try {
                console.log("⚠️ Falling back to Hugging Face for auto-reply...");
                return await generateHFReply(reviewText, rating, businessName, language);
            } catch (hfError) {

                // 4. Static Fallback
                console.error("❌ All Auto-reply APIs failed. Using static fallback.", hfError);
                const langReplies = STATIC_REPLIES[language] || STATIC_REPLIES['en'];
                return langReplies[Math.floor(Math.random() * langReplies.length)];
            }
        }
    }
}
