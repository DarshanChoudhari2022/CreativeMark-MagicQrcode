// AI Service â€” Customer Review Suggestions
// generateReviewSuggestions() â€” Customer-facing: AI-crafted review TEXT that customers can copy & post
//
// API Priority: Groq (primary) â†’ Gemini (fallback) â†’ Static templates
//
// ANTI-DETECTION STRATEGY:
// - Reviews mimic real human writing patterns (varied length, casual grammar, personal stories)
// - No keyword stuffing â€” location/service mentioned organically like a real customer would
// - Each call generates completely unique reviews using random persona + style seeds
// - Reviews vary between 15-80 words (real reviews have huge length variance)
// - Some reviews have minor imperfections (informal grammar, abbreviations) for authenticity

import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ReviewSuggestion {
    text: string;
    rating: number;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SECTION 1: CUSTOMER REVIEW SUGGESTIONS (ReviewLanding page)
// These are natural-sounding review lines that CUSTOMERS select and post
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Random persona pool â€” each review is written from a different "type" of person
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

// Writing style variations â€” makes each review structurally different
const STYLE_POOL = [
    "very brief and to-the-point (10-15 words max)",
    "medium length with one specific detail (20-30 words)",
    "slightly longer with a mini personal story (30-50 words)",
    "enthusiastic and emoji-friendly with 1-2 emojis naturally placed",
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
    "Write completely normally â€” this reviewer is articulate.",
    "Write completely normally â€” this reviewer is articulate.",
    "Write completely normally â€” this reviewer is articulate.",
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
 * Focuses on natural, organic information â€” no keyword stuffing.
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
        parts.push(`The customer visited this business (Maps link available â€” if you can infer a city/area from context, mention it once naturally. If not, skip location entirely.)`);
    }

    return parts.join('. ') + '.';
}

/**
 * CUSTOMER-FACING: Generate review suggestions that customers can copy & post on Google.
 * Each call produces completely unique, human-sounding reviews using random personas and styles.
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
        const categoryHint = businessContext ? `\nBUSINESS CATEGORY: ${businessContext}\nIMPORTANT: Every review MUST reference something specific to a "${businessContext}" business. For restaurants mention dishes/taste/portions. For salons mention haircut/styling/products. For clinics mention doctor/treatment. For gyms mention equipment/trainer.` : '';

        const prompt = `You are generating 5 sample Google review texts that a real customer might write after visiting a ${businessContext || 'local'} business.

${contextStr}${categoryHint}
Language: ${langLabel}
Session: ${sessionSeed}

Each review must be written from a DIFFERENT perspective:
${reviewInstructions}

CRITICAL ANTI-DETECTION RULES (Google flags AI reviews):
- Write exactly as a REAL customer would type on their phone â€” not like marketing copy
- Each review MUST be completely different in structure, tone, length, and opening word
- Vary lengths naturally: some reviews are 10 words, some are 50+ words. Real people write differently.
- ${businessLocation ? `Only 1-2 reviews should casually mention "${businessLocation}" â€” the way a real person would (e.g., "this place near [area]" or just mentioning the locality once). The other reviews should NOT mention any location at all.` : 'Do NOT mention any specific city or location â€” the customer is just reviewing the experience.'}
- NEVER use these phrases: "highly recommended", "top-notch", "exceeded expectations", "game-changer", "second to none", "unparalleled", "world-class", "best in class", "cutting-edge"
- NEVER start multiple reviews the same way
- NEVER use more than one exclamation mark per review
- Some reviews should mention something SPECIFIC (a person's name like "Rahul at the counter", a specific service/product, waiting time, pricing observation, comparison with alternatives)
- 1-2 reviews can have a tiny constructive note (e.g., "parking was tricky but..." or "wish they had more options but...") â€” this makes reviews look dramatically more real
- Do NOT output any URLs, links, hashtags, or @mentions
- Do NOT use the word "SEO" or reference search optimization in any way

Output exactly 5 reviews, one per line. No numbering, no quotes, no labels, no extra text. Just the 5 review lines.`;

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
                        content: "You write authentic Google reviews from a real customer's perspective. You mimic how real humans type on phones â€” casual, genuine, sometimes imperfect. You never write marketing copy or SEO-optimized text. Output only the review lines, nothing else."
                    },
                    { role: "user", content: prompt }
                ],
                temperature: 1.0,
                max_tokens: 600,
            })
        });

        if (!response.ok) throw new Error(`Groq Error: ${response.status}`);

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const lines = content
            .split('\n')
            .map((l: string) => l.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[-â€¢]\s*/, '').trim())
            .filter((l: string) => l.length > 8 && l.length < 300);

        if (lines.length >= 3) {
            console.log("âœ… Natural review suggestions generated via Groq");
            return lines.slice(0, 5).map((text: string, i: number) => ({
                text,
                rating: ratings[i] || 5
            }));
        }
        throw new Error("Insufficient Groq results");

    } catch (groqError) {
        console.warn("ðŸ”» Groq failed for customer reviews, trying Gemini:", groqError);

        // 2. Try Gemini
        try {
            if (!GEMINI_API_KEY) throw new Error("No Gemini key");

            const categoryHint = businessContext ? `\nThis is a "${businessContext}" business. Each review MUST reference something specific to this category (e.g., food items for restaurants, treatments for salons, equipment for gyms, doctors for clinics).` : '';

            const prompt = `Write 5 authentic Google reviews as if 5 different real customers typed them on their phones after visiting this ${businessContext || 'local'} business.

${contextStr}${categoryHint}
Session: ${sessionSeed}

Perspectives:
${reviewInstructions}

Strict rules:
- Each review must sound completely different (length, tone, opening word)
- Write like real people on mobile — casual, genuine, sometimes grammatically imperfect
- Mix lengths: 1 short (under 15 words), 2 medium (20-35 words), 2 longer (40-55 words)
- ${businessLocation ? `Mention "${businessLocation}" in maximum 1 review only.` : 'Do NOT mention any location.'}
- BANNED phrases: "highly recommended", "exceeded expectations", "top-notch", "world-class", "game-changer", "hidden gem", "exceptional", "phenomenal", "impeccable", "seamless", "above and beyond"
- 1 review MUST have a small constructive note (parking, timing, menu variety etc.)
- 2 reviews MUST mention a specific detail (staff name, specific service, wait time, price)
- NEVER output URLs, links, or formatting
- Output 5 review lines only, one per line. No numbering.`;

            const result = await geminiModel.generateContent(prompt);
            const content = result.response.text();
            const lines = content
                .split('\n')
                .map(l => l.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[-â€¢]\s*/, '').trim())
                .filter(l => l.length > 8 && l.length < 300);

            if (lines.length >= 3) {
                console.log("âœ… Natural review suggestions generated via Gemini");
                return lines.slice(0, 5).map((text, i) => ({
                    text,
                    rating: ratings[i] || 5
                }));
            }
            throw new Error("Insufficient Gemini results");

        } catch (geminiError) {
            console.warn("ðŸ”» Gemini failed for customer reviews, using natural templates:", geminiError);
        }
    }

    // 3. Fallback: Category-aware humanized templates
    return generateNaturalFallbacks(businessName, businessContext, businessLocation, ratings);
}

/**
 * Generate natural-sounding fallback reviews when AI APIs are unavailable.
 * Category-aware: reviews reference details relevant to the business type.
 */
function generateNaturalFallbacks(
    businessName: string,
    category: string,
    location: string,
    ratings: number[]
): ReviewSuggestion[] {
    const loc = location ? ` near ${location}` : '';
    const cat = category.toLowerCase();

    const pools: Record<string, string[]> = {
        restaurant: [
            `Finally tried ${businessName}${loc} and the food was genuinely good. Paneer was the best I've had in a while.`,
            `Went for lunch with colleagues. Quick service, tasty food, fair prices.`,
            `Good food, clean place. Waited 10 mins for a table on Saturday but worth it.`,
            `My family comes here regularly. Kids love it, portions are generous. Parking is tight though.`,
            `Ordered delivery twice this week. Food came hot both times. The biryani is legit.`,
            `Decent spot for a quick meal${loc}. Taste is consistent every time.`,
            `Tried on a friend's suggestion. Starters were amazing, mains were okay. Will come back.`,
        ],
        salon: [
            `Got a haircut yesterday. Stylist actually listened to what I wanted. Happy with the result.`,
            `Clean salon, good products. Prices are fair for the quality${loc}.`,
            `Been coming to ${businessName} for 6 months. Consistent quality every time.`,
            `The facial was relaxing. Skin felt great the next day. Will def book again.`,
            `Walked in without appointment and they still took me. Neat work, maybe 30 mins total.`,
        ],
        clinic: [
            `Doctor was thorough with the checkup. Didn't rush, explained everything clearly.`,
            `Clean clinic, minimal wait time${loc}. Receptionist was helpful with booking.`,
            `Visited for a dental issue. Treatment was painless. Good experience overall.`,
            `Staff is genuinely caring. Follow-up calls after the visit was a nice touch.`,
            `Well-equipped place. Doctors take time with each patient, unlike rushed consultations elsewhere.`,
        ],
        gym: [
            `Joined ${businessName} two months ago. Good equipment, trainers correct your form. Worth it.`,
            `Clean gym with proper ventilation${loc}. Not crowded in the mornings.`,
            `Trainer made a custom plan based on my goals. Lost 4 kgs first month.`,
            `Best vibe of any gym I've tried. Friendly people, no ego nonsense.`,
            `Has everything I need - good machines, clean washrooms, flexible timings.`,
        ],
    };

    const generic = [
        `Really happy with ${businessName}${loc}. Team was professional, got everything done on time.`,
        `Visited first time based on a friend's rec. Wasn't disappointed. Good service.`,
        `${businessName} does solid work. Compared other options, glad I chose here.`,
        `Third time coming and quality is still consistent. Says a lot about how they run things.`,
        `The person who helped me was patient and explained everything. Will come back.`,
        `Good experience overall${loc}. Clean place, fair pricing, they care about the work.`,
        `Tried ${businessName} after seeing reviews online. They delivered. Parking was tricky but service made up for it.`,
        `Tried two other places before this. The difference is night and day. They actually listen.`,
        `Good service, friendly staff. Only wish they had longer hours - had to rush before closing.`,
        `${businessName} does solid work${loc}. Wait was about 20 mins but the result was worth it.`,
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
