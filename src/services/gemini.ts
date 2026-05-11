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

        const prompt = `You are generating 5 sample Google review texts that a real customer might write after a good experience.

${contextStr}
Language: ${language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English'}
Session: ${sessionSeed}

Each review must be written from a DIFFERENT perspective:
${reviewInstructions}

CRITICAL RULES FOR NATURAL REVIEWS:
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

            const prompt = `Write 5 authentic Google reviews as if 5 different real customers typed them on their phones after visiting this business.

${contextStr}
Session: ${sessionSeed}

Perspectives:
${reviewInstructions}

Rules:
- Each review must sound completely different from the others (different length, tone, opening)
- Write like real people, not like AI or marketing. Include casual language where appropriate.
- Vary lengths: mix of short (10-15 words), medium (20-35 words), and one longer review (40-60 words)
- ${businessLocation ? `Mention "${businessLocation}" casually in maximum 1-2 reviews only.` : 'Skip mentioning any location.'}
- NEVER use: "highly recommended", "exceeded expectations", "top-notch", "world-class", "game-changer"
- 1 review should include a tiny constructive note (but overall positive)
- Include 1-2 specific details (staff name, wait time, specific service used, price observation)
- NEVER output URLs or links
- Output 5 review lines only, one per line. No numbering or formatting.`;

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

    // 3. Fallback: Natural-sounding static templates (rewritten to sound human)
    return generateNaturalFallbacks(businessName, businessLocation, ratings);
}

/**
 * Generate natural-sounding fallback reviews when AI APIs are unavailable.
 * These are designed to sound like real human reviews, not marketing copy.
 */
function generateNaturalFallbacks(
    businessName: string,
    location: string,
    ratings: number[]
): ReviewSuggestion[] {
    const loc = location ? ` near ${location}` : '';

    // Large pool of natural-sounding templates with varied styles
    const allTemplates = [
        // Short and sweet (10-20 words)
        `Really happy with the service. Clean place, quick work, fair price. Will be back for sure.`,
        `Good experience overall. The staff was friendly and got things done fast.`,
        `Visited for the first time and wasn't disappointed at all. Solid work.`,
        `Pretty good${loc}. Went with a friend's recommendation and it was worth it.`,
        `They know what they're doing here. No complaints from my side.`,
        `Decent place, decent pricing. Nothing fancy but gets the job done well.`,

        // Medium with specific details (20-35 words)
        `${businessName} was a pleasant surprise. I was skeptical at first but the team really took care of everything professionally. Would go again.`,
        `Went here last week${loc} and had a great experience. The person who helped me was really patient and explained everything clearly.`,
        `Third time coming here and the quality has been consistent every single time. That says a lot about how they run things.`,
        `A friend dragged me here saying it was the best${loc}. Honestly, she wasn't wrong. The attention to detail is impressive.`,
        `Compared this with a couple of other options before deciding. Glad I chose ${businessName} â€” definitely better value.`,

        // Longer with mini stories (35-60 words)
        `I was looking for something reliable${loc} and stumbled upon ${businessName}. From the moment I walked in, the vibe was just... comfortable? The staff didn't pressure me at all, answered all my questions, and the final result was exactly what I wanted. Really refreshing experience.`,
        `So I finally tried ${businessName} after seeing good reviews online. Not gonna lie, I had high expectations and they actually delivered. The only thing I'd say is parking can be a bit tricky, but the service more than makes up for it.`,
        `Had tried two other places before coming here and the difference is night and day. The team at ${businessName} actually listens to what you want instead of just pushing their own thing. Pricing was reasonable too.`,

        // With constructive notes (authentic feel)
        `Good service and friendly staff. Only wish they had slightly longer working hours â€” I had to rush to get there before closing. But the work itself? No complaints.`,
        `${businessName} does solid work${loc}. The wait was about 20 minutes which felt a bit long, but the end result made it worth it. Will probably book ahead next time.`,
    ];

    const shuffled = shuffleArray(allTemplates);
    return shuffled.slice(0, 5).map((text, i) => ({
        text,
        rating: ratings[i] || 5
    }));
}
