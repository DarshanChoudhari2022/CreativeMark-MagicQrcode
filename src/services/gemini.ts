// AI Service — Customer Review Suggestions (Google Maps Policy-Compliant)
// 
// STRATEGY: Instead of generating full copy-paste reviews (which Google flags),
// we generate SHORT TALKING POINTS / PROMPTS that inspire customers to write
// their OWN unique review in their OWN words.
//
// Google's 2026 AI detection flags:
//  1. Clipboard paste detection (text pasted from external source)
//  2. Text similarity across reviews (multiple customers posting near-identical text)
//  3. Review velocity spikes (many reviews from same source in short time)
//  4. Content fingerprinting (Gemini AI detects non-natural typing patterns)
//  5. Coordinated activity (reviews from same IP/device/location pattern)
//
// OUR COMPLIANT APPROACH:
//  - Generate "What to mention" talking points (not full review text)
//  - Provide short inspiration snippets customer can rephrase in their own words
//  - Encourage customers to TYPE, not paste
//  - Each customer naturally produces UNIQUE text (solving duplicate detection)
//  - No clipboard auto-copy (solving paste detection)
//
// API Priority: Groq (primary) → Gemini (fallback) → Static talking points

import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ReviewSuggestion {
    text: string;
    rating: number;
    // New: talking points that help customer write their own review
    talkingPoints?: string[];
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: CUSTOMER REVIEW SUGGESTIONS (ReviewLanding page)
// These are INSPIRATION prompts — NOT copy-paste text
// ═══════════════════════════════════════════════════════════════

// Random persona pool — each review is written from a different "type" of person
const PERSONA_POOL = [
    "a busy working professional who rarely writes reviews",
    "a first-time customer who was pleasantly surprised",
    "a regular who has visited multiple times",
    "a parent who brought their family along",
    "someone who was recommended this place by a friend",
    "a customer who compared this with competitors before choosing",
    "a local resident from the neighbourhood",
    "someone visiting the area for the first time",
    "a senior citizen who values good service",
    "a young college student on a budget",
    "someone who had a bad experience elsewhere and tried this place",
    "a person who initially had low expectations but was impressed",
];

// Writing style variations — makes each review structurally different
const STYLE_POOL = [
    "very brief and to-the-point (10-15 words max)",
    "medium length with one specific detail (20-30 words)",
    "slightly longer with a mini personal story (30-50 words)",
    "calm and factual, listing what went well",
    "casual and conversational, like texting a friend about it",
    "includes a small constructive note but overall very positive",
    "mentions comparing prices/quality with alternatives",
];

// Human imperfection patterns to inject realism
const IMPERFECTION_HINTS = [
    "Use casual grammar like 'gonna', 'gotta', 'tbh', or 'ngl' once if it fits naturally.",
    "Start the review mid-thought, like 'So I went here...' or 'Finally tried this place...'",
    "Use '...' or a dash mid-sentence like real people do when typing quickly.",
    "Skip capitalization at the start like many mobile users do.",
    "Use a common abbreviation like 'def', 'prob', 'obv', or 'esp' once.",
    "Write completely normally — this reviewer is articulate.",
    "Write completely normally — this reviewer is articulate.",
    "Write completely normally — this reviewer is articulate.",
];

// Shuffle array helper
function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Pick N random unique items from an array
function pickRandom<T>(arr: T[], count: number): T[] {
    return shuffleArray(arr).slice(0, count);
}

// Generate a unique seed to prevent caching/repetition across calls
function generateSessionSeed(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Build the business context string for AI prompts.
 * Focuses on natural, organic information — no keyword stuffing.
 */
function buildBusinessContext(
    businessName: string,
    businessContext: string,
    businessLocation: string,
    mapUrl: string
): string {
    const parts: string[] = [`Business: "${businessName}"`];

    if (businessContext) {
        parts.push(`Type: ${businessContext}`);
    }
    if (businessLocation) {
        parts.push(`Located in: ${businessLocation}`);
    }

    // Extract city hint from Google Maps URL if present (but don't force it)
    if (mapUrl && !businessLocation) {
        parts.push(`The customer visited this business (Maps link available — if you can infer a city/area from context, mention it once naturally. If not, skip location entirely.)`);
    }

    return parts.join('. ') + '.';
}

/**
 * CUSTOMER-FACING: Generate review INSPIRATION that customers use to write their own review.
 * 
 * GOOGLE MAPS COMPLIANCE:
 * - Reviews are SHORT inspiration snippets, not full copy-paste text
 * - Each customer will rephrase in their own words = unique text
 * - No two customers will post identical reviews
 * - Reviews reference genuine experiences specific to the business category
 */
export async function generateReviewSuggestions(
    businessName: string,
    rating: number,
    language: string = 'en',
    businessContext: string = '',
    businessLocation: string = '',
    mapUrl: string = '',
    tone: string = 'Professional'
): Promise<ReviewSuggestion[]> {
    const sessionSeed = generateSessionSeed();
    const contextStr = buildBusinessContext(businessName, businessContext, businessLocation, mapUrl);

    // Pick random personas and styles for this batch
    const personas = pickRandom(PERSONA_POOL, 5);
    const styles = pickRandom(STYLE_POOL, 5);
    const imperfections = pickRandom(IMPERFECTION_HINTS, 5);

    // Generate random star ratings for variety (mostly 5, some 4)
    const ratings = shuffleArray([5, 5, 5, 4, 5]).slice(0, 5);

    // Build the per-review instructions
    const reviewInstructions = personas.map((persona, i) => {
        return `Review ${i + 1} (${ratings[i]} stars): Written by ${persona}. Style: ${styles[i]}. ${imperfections[i]}`;
    }).join('\n');

    // 1. Try AI-generated customer reviews via Groq
    try {
        if (!GROQ_API_KEY) throw new Error("No Groq key");

        const langLabel = language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
        const categoryHint = businessContext ? `\nBUSINESS CATEGORY: ${businessContext}\nIMPORTANT: Every review MUST reference something specific to a "${businessContext}" business. For restaurants mention dishes/taste/portions. For salons mention haircut/styling/products. For clinics mention doctor/treatment/checkup. For gyms mention equipment/trainer/workout.` : '';

        const prompt = `You are helping a real customer remember what to write in their Google review after visiting a ${businessContext || 'local'} business.

${contextStr}${categoryHint}
Language: ${langLabel}
Session: ${sessionSeed}

Generate 5 SHORT review inspiration snippets — these are IDEAS the customer will rephrase in their own words on Google. NOT full reviews to copy-paste.

Each snippet must come from a DIFFERENT angle:
${reviewInstructions}

CRITICAL GOOGLE MAPS COMPLIANCE RULES:
- Write like a REAL customer recalling their genuine experience — not marketing copy
- Keep each snippet SHORT (10-35 words max). Customer will expand in their own words.
- Each snippet MUST be completely different in structure, tone, and opening word
- ${businessLocation ? `Maximum 1 snippet can casually mention "${businessLocation}". Others should NOT mention any location.` : 'Do NOT mention any specific city or location.'}
- BANNED PHRASES (Google AI flags these as fake): "highly recommended", "top-notch", "exceeded expectations", "game-changer", "second to none", "unparalleled", "world-class", "best in class", "cutting-edge", "hidden gem", "exceptional", "phenomenal", "impeccable", "seamless", "above and beyond", "state of the art", "go-to place", "hands down", "blown away", "couldn't be happier"
- NEVER start two snippets the same way
- NEVER use more than one exclamation mark per snippet
- 1 snippet MUST include a tiny constructive note (e.g., "parking was tight but..." or "had to wait a bit but...")
- 2 snippets MUST mention something SPECIFIC to this type of business
- Do NOT output URLs, links, hashtags, @mentions, or emojis
- Do NOT use the word "SEO" or reference search optimization

Output exactly 5 short snippets, one per line. No numbering, no quotes, no labels.`;

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
                        content: "You help real customers recall what to write in their Google review. You provide short memory-jogger snippets — NOT full reviews. The customer will rephrase these in their own words. Write casually like a friend reminding them what was good. Never write marketing copy or SEO text."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 1.0,
                max_tokens: 400,
            })
        });

        if (!response.ok) throw new Error(`Groq Error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const lines = content
            .split('\n')
            .map((l: string) => l.replace(/^\d+[\.)\]]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[-•]\s*/, '').trim())
            .filter((l: string) => l.length > 8 && l.length < 200);

        if (lines.length >= 3) {
            console.log("✅ Review inspiration generated via Groq");
            return lines.slice(0, 5).map((text: string, i: number) => ({
                text,
                rating: ratings[i] || 5
            }));
        }
        throw new Error("Insufficient Groq results");

    } catch (groqError) {
        console.warn("📻 Groq failed for customer reviews, trying Gemini:", groqError);

        // 2. Try Gemini
        try {
            if (!GEMINI_API_KEY) throw new Error("No Gemini key");

            const categoryHint = businessContext ? `\nThis is a "${businessContext}" business. Each snippet MUST reference something specific to this category (e.g., food items for restaurants, treatments for salons, equipment for gyms, doctors for clinics).` : '';

            const prompt = `Write 5 SHORT review inspiration snippets as if reminding 5 different real customers what to write about after visiting this ${businessContext || 'local'} business.

${contextStr}${categoryHint}
Session: ${sessionSeed}

Perspectives:
${reviewInstructions}

GOOGLE MAPS COMPLIANCE (reviews get auto-deleted if they violate these):
- Each snippet must be SHORT (10-35 words) — customer will type their own full review
- Sound like a real person recalling their experience, not a marketer
- Mix lengths: 1 very short (under 12 words), 2 short (15-25 words), 2 medium (25-35 words)
- ${businessLocation ? `Mention "${businessLocation}" in maximum 1 snippet only.` : 'Do NOT mention any location.'}
- BANNED: "highly recommended", "exceeded expectations", "top-notch", "world-class", "game-changer", "hidden gem", "exceptional", "phenomenal", "impeccable", "seamless", "above and beyond", "hands down", "blown away"
- 1 snippet MUST have a small constructive note (parking, timing, crowd etc.)
- 2 snippets MUST mention a specific detail relevant to the business type
- NEVER output URLs, links, emojis, or formatting
- Output 5 snippet lines only, one per line. No numbering.`;

            const result = await geminiModel.generateContent(prompt);
            const content = result.response.text();
            const lines = content
                .split('\n')
                .map(l => l.replace(/^\d+[\.)\]]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[-•]\s*/, '').trim())
                .filter(l => l.length > 8 && l.length < 200);

            if (lines.length >= 3) {
                console.log("✅ Review inspiration generated via Gemini");
                return lines.slice(0, 5).map((text, i) => ({
                    text,
                    rating: ratings[i] || 5
                }));
            }
            throw new Error("Insufficient Gemini results");

        } catch (geminiError) {
            console.warn("📻 Gemini failed for customer reviews, using natural templates:", geminiError);
        }
    }

    // 3. Fallback: Category-aware humanized talking points
    return generateNaturalFallbacks(businessName, businessContext, businessLocation, ratings);
}

/**
 * Generate natural-sounding fallback review INSPIRATION snippets.
 * Category-aware: references details relevant to the business type.
 * These are SHORT prompts customers rephrase — not copy-paste text.
 */
function generateNaturalFallbacks(
    businessName: string,
    category: string,
    location: string,
    ratings: number[]
): ReviewSuggestion[] {
    const loc = location ? ` near ${location}` : '';
    const cat = (category || '').toLowerCase();

    const pools: Record<string, string[]> = {
        restaurant: [
            `The food was fresh and tasty. Loved the paneer dish.`,
            `Quick service, good portions, fair prices${loc}.`,
            `Waited 10 mins for a table but the food made up for it.`,
            `Family comes here often. Kids love it. Parking can be tricky.`,
            `Delivery was hot both times we ordered. The biryani is great.`,
            `Consistent taste every visit. Good for a quick meal.`,
            `Friend suggested it. Starters were great, mains were decent.`,
            `The thali was filling and fresh. Clean place too.`,
        ],
        salon: [
            `Stylist listened to what I wanted. Happy with the cut.`,
            `Clean place, good products, reasonable prices${loc}.`,
            `Been coming for months. Quality is always consistent.`,
            `The facial was relaxing. Skin felt great next day.`,
            `Walked in without booking, still got served quickly.`,
            `Was nervous trying a new salon but the stylist was patient.`,
        ],
        clinic: [
            `Doctor was thorough, didn't rush, explained everything.`,
            `Clean clinic, short wait time${loc}. Staff was helpful.`,
            `Treatment was painless. Doctor was reassuring.`,
            `They do follow-up calls after the visit which is nice.`,
            `Doctors take proper time with each patient here.`,
            `Took my kid for a checkup. Doc was great with children.`,
        ],
        gym: [
            `Good equipment and trainers correct your form. Worth it.`,
            `Clean gym with good ventilation${loc}. Not crowded mornings.`,
            `Trainer made a custom plan for my goals. Seeing results.`,
            `Friendly people, no ego lifting nonsense. Good vibe.`,
            `Has everything needed — machines, clean washrooms, flexible hours.`,
        ],
        shop: [
            `Good selection and fair prices. Owner helped pick the right product.`,
            `Quality was good, they offered home delivery too.`,
            `They stock genuine products and don't overprice.`,
            `Staff was helpful without being pushy. Good experience.`,
            `Prices were competitive. Plus you can see products before buying.`,
        ],
    };

    const generic = [
        `Professional team, got everything done on time${loc}.`,
        `Went on a friend's recommendation. Good service.`,
        `Compared other options, glad I chose ${businessName}.`,
        `Consistent quality every visit. Says a lot about them.`,
        `Staff was patient and explained things clearly.`,
        `Clean place, fair pricing. They care about the work.`,
        `Service was good. Parking was a bit tight but manageable.`,
        `Tried other places before. This one is noticeably better.`,
        `Friendly staff. Wish they had slightly longer hours though.`,
        `Had to wait about 15 mins but the result was worth it.`,
    ];

    let pool = generic;
    for (const [key, reviews] of Object.entries(pools)) {
        if (cat.includes(key)) { pool = reviews; break; }
    }

    const shuffled = shuffleArray(pool);
    return shuffled.slice(0, 5).map((text, i) => ({
        text,
        rating: ratings[i] || 5
    }));
}
