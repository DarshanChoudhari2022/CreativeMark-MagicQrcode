// AI Service — Two distinct functions:
// 1. generateReviewSuggestions() — Customer-facing: AI-crafted review TEXT that customers can copy & post
// 2. generateAutoReply() — Owner-facing: AI-assisted OWNER REPLIES to real customer reviews
//
// API Priority: Groq (primary) → Gemini (fallback) → Hugging Face (fallback) → Static templates

import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateAutoReply as generateHFReply } from './huggingface';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ReviewSuggestion {
    text: string;
    rating: number;
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: CUSTOMER REVIEW SUGGESTIONS (ReviewLanding page)
// These are SEO-rich review lines that CUSTOMERS select and post
// ═══════════════════════════════════════════════════════════════

// Category-specific review templates that customers would naturally write
const CUSTOMER_REVIEW_TEMPLATES: Record<string, string[]> = {
    'service': [
        "Outstanding service quality! The team was professional, thorough, and attentive to every detail. Highly recommended!",
        "Really impressed with the level of service. Quick turnaround, friendly staff, and excellent results. Will definitely come back!",
        "Top-quality service from start to finish. They truly care about their customers and it shows in every interaction.",
        "Professional and efficient service. The team went above expectations and delivered exceptional work. Five stars!",
        "Excellent service experience! The staff was knowledgeable, helpful, and made the entire process seamless.",
    ],
    'staff': [
        "The staff here is incredibly friendly and professional. They made me feel welcome from the moment I walked in. Great experience!",
        "Amazing team! Everyone was so helpful and knowledgeable. They took the time to answer all my questions patiently.",
        "Wonderful staff — courteous, efficient, and genuinely caring. It's rare to find such dedicated professionals. Highly recommend!",
        "The team members are fantastic! Very attentive and skilled. They really know their craft and deliver quality work.",
        "Friendly and professional staff. They go out of their way to make sure you're satisfied. Truly a great team!",
    ],
    'ambiance': [
        "Beautiful place with a great atmosphere! Clean, well-maintained, and very welcoming. Perfect experience every time.",
        "Love the ambiance here! Modern, clean, and comfortable. It's clear they put thought into creating a great environment.",
        "The place looks fantastic — neat, well-organized, and inviting. Really adds to the overall great experience!",
        "Great vibe and very clean. The attention to detail in how the place is maintained is impressive. Will visit again!",
        "Wonderful atmosphere — bright, clean, and calming. Makes you feel right at home. Highly recommended!",
    ],
    'value': [
        "Excellent value for money! High quality work at very reasonable prices. You won't find a better deal in town.",
        "Great pricing for the quality offered. I was pleasantly surprised by how much value I got. Totally worth it!",
        "Very affordable and the quality is outstanding. Best value I've found. Will definitely recommend to friends and family.",
        "Fair pricing with premium quality. No hidden charges or surprises. Transparent and honest service — highly recommend!",
        "Incredible value — the quality of work far exceeded my expectations for the price. Really impressed!",
    ],
    'overall': [
        "Absolutely fantastic experience! Everything from start to finish was perfect. Would highly recommend to everyone!",
        "One of the best experiences I've had. Professional, friendly, and great results. Definitely coming back!",
        "Excellent all around — great service, wonderful staff, and amazing results. This place deserves all the five-star reviews!",
        "Highly recommend this place! They deliver on every promise. Consistent quality and great customer care.",
        "Had a wonderful experience. Everything was top-quality and the team is fantastic. Will definitely be a regular!",
    ],
};

// Business-specific keyword injections for SEO
interface BusinessSEO {
    keywords: string[];
    locationHint: string;
    serviceType: string;
    naturalPhrases: string[];
    customPromptRule?: string;
}

const BUSINESS_SEO_MAP: Record<string, BusinessSEO> = {
    "creative mark": {
        keywords: ["Pune", "branding", "advertising"],
        locationHint: "in Pune",
        serviceType: "advertising and branding",
        naturalPhrases: [
            "best advertising agency in Pune",
            "creative branding solutions in Pune",
            "top marketing agency in Pune",
        ],
    },
    "creative mark advertising": {
        keywords: ["Pune", "branding", "advertising"],
        locationHint: "in Pune",
        serviceType: "advertising and branding",
        naturalPhrases: [
            "best advertising agency in Pune",
            "creative branding solutions in Pune",
            "top marketing agency in Pune",
        ],
    },
    "poonawala travels": {
        keywords: ["Mumbai to Pune", "Nagpur", "Maharashtra", "taxi", "outstation cab service"],
        locationHint: "for Mumbai-Pune and outstation trips across Maharashtra",
        serviceType: "taxi and travel",
        naturalPhrases: [
            "best cab service Mumbai to Pune",
            "reliable taxi for Mumbai-Pune route",
            "great outstation cab service in Maharashtra",
            "comfortable travel experience",
            "excellent cab service for Maharashtra travel",
        ],
        customPromptRule: "CRITICAL EXACT REQUIREMENT: You MUST generate exactly 5 reviews following this breakdown:\n- 3 generic reviews focusing on the safe travel experience, experienced drivers, and good condition cars.\n- 2 location-specific reviews mentioning travel specifically from Mumbai to Pune, Pune to Mumbai, or other outstation routes across Maharashtra.",
    },
    "poonawala cab service": {
        keywords: ["Mumbai to Pune", "Nagpur", "Maharashtra", "taxi", "outstation cab service"],
        locationHint: "for Mumbai-Pune and outstation trips across Maharashtra",
        serviceType: "taxi and travel",
        naturalPhrases: [
            "best cab service Mumbai to Pune",
            "reliable taxi for Mumbai-Pune route",
            "great outstation cab service in Maharashtra",
            "comfortable travel experience",
            "excellent cab service for Maharashtra travel",
        ],
        customPromptRule: "CRITICAL EXACT REQUIREMENT: You MUST generate exactly 5 reviews following this breakdown:\n- 3 generic reviews focusing on the safe travel experience, experienced drivers, and good condition cars.\n- 2 location-specific reviews mentioning travel specifically from Mumbai to Pune, Pune to Mumbai, or other outstation routes across Maharashtra.",
    },
};

function getBusinessSEO(businessName: string): BusinessSEO | null {
    const lower = businessName.toLowerCase();
    for (const [key, value] of Object.entries(BUSINESS_SEO_MAP)) {
        if (lower.includes(key)) return value;
    }
    return null;
}

// Shuffle array helper
function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * CUSTOMER-FACING: Generate review suggestions that customers can copy & post on Google.
 * These are SEO-rich, natural-sounding customer reviews (NOT owner replies).
 */
export async function generateReviewSuggestions(
    businessName: string,
    rating: number,
    language: string = 'en',
    businessContext: string = '',
    tone: string = 'Professional'
): Promise<ReviewSuggestion[]> {
    const seo = getBusinessSEO(businessName);

    // Determine category from business context
    let category = 'overall';
    const contextLower = (businessContext || '').toLowerCase();
    if (contextLower.includes('service')) category = 'service';
    else if (contextLower.includes('staff') || contextLower.includes('behavior')) category = 'staff';
    else if (contextLower.includes('ambiance') || contextLower.includes('atmosphere')) category = 'ambiance';
    else if (contextLower.includes('value') || contextLower.includes('money')) category = 'value';

    // 1. Try AI-generated customer reviews via Groq
    try {
        if (!GROQ_API_KEY) throw new Error("No Groq key");

        const seoContext = seo
            ? `Business: "${businessName}" (${seo.serviceType} ${seo.locationHint}).\n${seo.customPromptRule || `Naturally include ONE of: ${seo.naturalPhrases.join(', ')}.`}`
            : `Business Name: "${businessName}".\n${businessContext ? `Business Type / Industry: "${businessContext}". CRITICAL: You must generate reviews specific to this exact business type.` : ''}`;

        const prompt = `Generate 5 unique, authentic-sounding Google review texts for a ${rating}-star review of a business.

${seoContext}
Review focus: ${category}
Language: ${language}

STRICT RULES:
- Write AS A CUSTOMER, not as the business owner
- Each review should be 15-30 words
- Sound natural and genuine, like a real person wrote it
- Include specific positive details about ${category}
- Each review must be different in structure and wording
- Do NOT include phrases like "drive real results", "exceed expectations", "game-changer"
- Do NOT mention "digital marketing" unless the business is specifically about that
- Use exclamation marks naturally, not excessively
- Do NOT start every review with the same word

Output exactly 5 review lines, one per line. No numbering, no quotes, no other text.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that writes authentic, natural-sounding Google review texts from a customer's perspective. Output only the review text lines."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.9,
                max_tokens: 400,
            })
        });

        if (!response.ok) throw new Error(`Groq Error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const lines = content.split('\n').map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim()).filter((l: string) => l.length > 10 && l.length < 200);

        if (lines.length >= 3) {
            console.log("✅ Customer review suggestions generated via Groq");
            return lines.slice(0, 5).map((text: string) => ({ text, rating }));
        }
        throw new Error("Insufficient Groq results");

    } catch (groqError) {
        console.warn("🔻 Groq failed for customer reviews, trying Gemini:", groqError);

        // 2. Try Gemini
        try {
            if (!GEMINI_API_KEY) throw new Error("No Gemini key");

            const seoContext = seo
                ? `Business: "${businessName}" (${seo.serviceType} ${seo.locationHint}).\n${seo.customPromptRule || ''}`
                : `Business Name: "${businessName}".\n${businessContext ? `Business Type: "${businessContext}". CRITICAL: Generate reviews for this exact type.` : ''}`;

            const prompt = `Write 5 short, authentic Google review texts as a happy customer of this business.
${seoContext}
Category focus: ${category}. Rating: ${rating} stars.
Each review: 15-30 words, natural tone, specific details.
Output only the 5 review lines, one per line.`;

            const result = await geminiModel.generateContent(prompt);
            const content = result.response.text();
            const lines = content.split('\n').map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim()).filter(l => l.length > 10 && l.length < 200);

            if (lines.length >= 3) {
                console.log("✅ Customer review suggestions generated via Gemini");
                return lines.slice(0, 5).map(text => ({ text, rating }));
            }
            throw new Error("Insufficient Gemini results");

        } catch (geminiError) {
            console.warn("🔻 Gemini failed for customer reviews, using templates:", geminiError);
        }
    }

    // 3. Fallback: Use static customer review templates
    const templates = CUSTOMER_REVIEW_TEMPLATES[category] || CUSTOMER_REVIEW_TEMPLATES['overall'];
    const shuffled = shuffleArray(templates);

    // Inject business name/SEO naturally into some templates
    const suggestions = shuffled.slice(0, 5).map(text => {
        let enhancedText = text;
        if (seo && Math.random() > 0.5) {
            // Append a natural SEO phrase to some reviews
            const seoPhrases = [
                ` Truly the ${seo.naturalPhrases[Math.floor(Math.random() * seo.naturalPhrases.length)]}!`,
                ` Great experience ${seo.locationHint}.`,
            ];
            enhancedText += seoPhrases[Math.floor(Math.random() * seoPhrases.length)];
        }
        return { text: enhancedText, rating };
    });

    console.log("📋 Customer review suggestions generated from templates");
    return suggestions;
}


// ═══════════════════════════════════════════════════════════════
// SECTION 2: OWNER AUTO-REPLY (Reviews.tsx management page)
// These are AI-assisted OWNER RESPONSES to real customer reviews
// ═══════════════════════════════════════════════════════════════

// --- BANNED PHRASES for owner replies ---
const BANNED_PHRASES = [
    "drive real results",
    "exceed expectations",
    "game-changer",
    "exceptional service quality",
    "creative mark advertising",
    "digital marketing",
    "go above and beyond",
    "cutting-edge",
    "revolutionary",
    "best in class",
    "second to none",
    "unparalleled",
    "world-class",
    "top-notch",
];

// --- OWNER RESPONSE VARIATION SYSTEM ---
let lastResponseIndex = -1;
let lastOpeningIndex = -1;

const OWNER_OPENINGS = [
    "Thank you for",
    "We appreciate",
    "Thanks for",
    "We're grateful for",
    "Much appreciated —",
    "We value",
    "It means a lot —",
    "How kind of you —",
    "We're glad to hear",
    "We truly appreciate",
];

const OWNER_CLOSINGS = [
    "We look forward to serving you again.",
    "Hope to see you again soon.",
    "Your support means a lot to our team.",
    "We're here whenever you need us.",
    "Thank you for being a valued customer.",
    "Wishing you all the best.",
    "Feel free to reach out anytime.",
    "We're always happy to help.",
];

// Business-specific context for owner responses
interface OwnerBusinessContext {
    keywords: string[];
    locationHint: string;
    serviceType: string;
}

const OWNER_BUSINESS_MAP: Record<string, OwnerBusinessContext> = {
    "creative mark": {
        keywords: ["Pune", "branding", "advertising services"],
        locationHint: "Pune-based",
        serviceType: "digital marketing",
    },
    "creative mark advertising": {
        keywords: ["Pune", "branding", "advertising services"],
        locationHint: "Pune-based",
        serviceType: "digital marketing",
    },
    "poonawala travels": {
        keywords: ["Mumbai to Pune", "Nagpur", "Maharashtra", "taxi service", "outstation cab rental"],
        locationHint: "Mumbai-Pune route and all over Maharashtra",
        serviceType: "taxi and outstation travel",
    },
    "poonawala cab service": {
        keywords: ["Mumbai to Pune", "Nagpur", "Maharashtra", "taxi service", "outstation cab rental"],
        locationHint: "Mumbai-Pune route and all over Maharashtra",
        serviceType: "taxi and outstation travel",
    },
};

function getOwnerBusinessContext(businessName: string): OwnerBusinessContext | null {
    const lower = businessName.toLowerCase();
    for (const [key, value] of Object.entries(OWNER_BUSINESS_MAP)) {
        if (lower.includes(key)) return value;
    }
    return null;
}

interface OwnerResponseTemplate {
    generate: (params: {
        reviewDetail: string;
        benefitMentioned: string;
        businessName: string;
        serviceHighlight: string;
        businessCtx: OwnerBusinessContext | null;
    }) => string;
}

const OWNER_RESPONSE_TEMPLATES: OwnerResponseTemplate[] = [
    {
        generate: ({ reviewDetail, benefitMentioned, businessName, businessCtx }) => {
            const opening = getNextOwnerOpening();
            const locationStr = businessCtx ? `our ${businessCtx.locationHint} ` : "";
            return `${opening} ${reviewDetail}. We're pleased that ${benefitMentioned}. ${businessName} remains committed to ${locationStr}quality service.`;
        },
    },
    {
        generate: ({ reviewDetail, businessName, serviceHighlight, businessCtx }) => {
            const opening = getNextOwnerOpening();
            const keyword = businessCtx ? ` in ${businessCtx.keywords[0]}` : "";
            return `${opening} your kind words about ${serviceHighlight}. Our team's commitment to professional and reliable service${keyword} is what drives us at ${businessName}.`;
        },
    },
    {
        generate: ({ businessName, businessCtx }) => {
            const opening = getNextOwnerOpening();
            const serviceType = businessCtx?.serviceType || "quality service";
            const closing = getNextOwnerClosing();
            return `${opening} choosing ${businessName} for ${serviceType}. ${closing}`;
        },
    },
    {
        generate: ({ reviewDetail, businessName, businessCtx }) => {
            const opening = getNextOwnerOpening();
            const keyword = businessCtx ? ` Our ${businessCtx.locationHint} team` : " Our team";
            return `${opening} ${reviewDetail}.${keyword} at ${businessName} works hard to deliver a positive experience every time. ${getNextOwnerClosing()}`;
        },
    },
    {
        generate: ({ businessName, benefitMentioned, businessCtx }) => {
            const opening = getNextOwnerOpening();
            const serviceType = businessCtx?.serviceType || "our services";
            return `${opening} trusting ${businessName} with ${serviceType}. Glad to know ${benefitMentioned}. ${getNextOwnerClosing()}`;
        },
    },
];

function getNextOwnerOpening(): string {
    let idx: number;
    do {
        idx = Math.floor(Math.random() * OWNER_OPENINGS.length);
    } while (idx === lastOpeningIndex);
    lastOpeningIndex = idx;
    return OWNER_OPENINGS[idx];
}

function getNextOwnerClosing(): string {
    return OWNER_CLOSINGS[Math.floor(Math.random() * OWNER_CLOSINGS.length)];
}

function getNextOwnerTemplate(): OwnerResponseTemplate {
    let idx: number;
    do {
        idx = Math.floor(Math.random() * OWNER_RESPONSE_TEMPLATES.length);
    } while (idx === lastResponseIndex);
    lastResponseIndex = idx;
    return OWNER_RESPONSE_TEMPLATES[idx];
}

function sanitizeResponse(text: string): string {
    let cleaned = text;
    for (const phrase of BANNED_PHRASES) {
        const regex = new RegExp(phrase, 'gi');
        cleaned = cleaned.replace(regex, '');
    }
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\s\./g, '.').replace(/\s,/g, ',').trim();
    cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
    return cleaned;
}

function extractReviewDetails(reviewText: string): { detail: string; benefit: string; highlight: string } {
    const sentences = reviewText.split(/[.!?]+/).filter(s => s.trim().length > 3);
    const firstSentence = sentences[0]?.trim() || 'your feedback';

    const positiveWords = ['great', 'excellent', 'good', 'fast', 'quick', 'helpful', 'professional', 'friendly', 'amazing', 'wonderful', 'clean', 'nice'];
    let benefit = 'you had a positive experience';
    let highlight = 'our service';

    for (const word of positiveWords) {
        if (reviewText.toLowerCase().includes(word)) {
            benefit = `you found our service ${word}`;
            highlight = `our ${word} service`;
            break;
        }
    }

    return {
        detail: firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence,
        benefit,
        highlight,
    };
}

/**
 * OWNER-FACING: Generate AI-assisted owner response to a real customer review.
 * Each call produces a DIFFERENT response using the variation system.
 */
export async function generateAutoReply(
    reviewText: string,
    rating: number,
    businessName: string,
    language: string = 'en'
): Promise<string> {
    const businessCtx = getOwnerBusinessContext(businessName);
    const { detail, benefit, highlight } = extractReviewDetails(reviewText);

    const uniqueSessionId = Math.random().toString(36).substring(7);
    const sentimentLabel = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';

    const locationContext = businessCtx
        ? `Business location: ${businessCtx.locationHint}. Service type: ${businessCtx.serviceType}. Use ONE of these naturally: ${businessCtx.keywords.join(', ')}.`
        : '';

    const prompt = `You are the owner of "${businessName}". Write a SHORT professional owner reply to this ${rating}-star customer review.

Customer review: "${reviewText}"
Sentiment: ${sentimentLabel}
Session: ${uniqueSessionId}
${locationContext}

STRICT RULES:
- Maximum 35 words
- DO NOT use these phrases: "drive real results", "exceed expectations", "game-changer", "exceptional service quality"
- Maximum 1 service keyword per response
- Be warm and genuine, not corporate
- Vary sentence structure — mix short and medium sentences
- DO NOT start with "Dear" — use casual professional tone
- Output ONLY the reply text, no quotes, no formatting`;

    // 1. Try Groq
    try {
        if (!GROQ_API_KEY) throw new Error("Groq Key Missing");

        console.log("🚀 Generating owner response via Groq...");
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a business owner writing short, genuine replies to customer reviews. Never generate fake reviews. Output only the reply text."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 0.95,
                max_tokens: 100,
            })
        });

        if (!response.ok) throw new Error(`Groq API Error: ${response.status}`);

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content;

        if (reply) {
            return sanitizeResponse(reply);
        }
        throw new Error("Empty Groq response");

    } catch (groqError) {
        console.warn("🔻 Groq failed, switching to Gemini:", groqError);

        // 2. Try Gemini
        try {
            const result = await geminiModel.generateContent(prompt);
            const reply = result.response.text();
            return sanitizeResponse(reply);
        } catch (geminiError) {

            // 3. Try Hugging Face
            try {
                console.log("⚠️ Falling back to Hugging Face for owner response...");
                const hfReply = await generateHFReply(reviewText, rating, businessName, language);
                return sanitizeResponse(hfReply);
            } catch (hfError) {

                // 4. Dynamic template fallback
                console.error("❌ All AI APIs failed. Using template variation fallback.", hfError);
                const template = getNextOwnerTemplate();
                const fallbackReply = template.generate({
                    reviewDetail: detail,
                    benefitMentioned: benefit,
                    businessName,
                    serviceHighlight: highlight,
                    businessCtx,
                });
                return sanitizeResponse(fallbackReply);
            }
        }
    }
}
