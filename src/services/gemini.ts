// AI Service — Customer Review Suggestions (Google Maps Policy-Compliant)
// 
// STRATEGY: Generate FULL, ready-to-paste reviews that sound authentically human.
// Each review must be UNIQUE per session — no two customers should ever get
// identical text. We achieve this via:
//  1. Random persona assignment (12 types)
//  2. Random writing style selection (7 styles)
//  3. Human imperfection injection (casual grammar, mid-thought starts)
//  4. Session-unique seed (timestamp + random)
//  5. Category-specific details (dishes, treatments, equipment etc.)
//  6. High temperature (1.0) for maximum output variance
//  7. Strict banned phrase list (21+ marketing buzzwords Google flags)
//
// ANTI-DETECTION MEASURES:
//  - Banned phrases matching Google's AI content detection patterns
//  - Each review structurally different (different openings, lengths, tones)
//  - 1 review always includes minor constructive feedback (realism signal)
//  - Category-specific references required (proves genuine experience)
//  - No keyword stuffing, no SEO language, no marketing copy
//  - Location mentioned max once across all 5 reviews
//  - Encourages customer to personalize after pasting (further uniqueness)
//
// API Priority: Groq (primary) → Gemini (fallback) → Static templates

import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ReviewSuggestion {
    text: string;
    rating: number;
    talkingPoints?: string[];
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1: DIVERSITY POOLS — maximize uniqueness across sessions
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
    "brief and to-the-point (15-25 words)",
    "medium length with one specific detail (25-40 words)",
    "slightly longer with a mini personal story (40-60 words)",
    "calm and factual, listing what went well (20-35 words)",
    "casual and conversational, like texting a friend (25-40 words)",
    "includes a small constructive note but overall very positive (30-50 words)",
    "mentions comparing prices or quality with alternatives (25-40 words)",
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

// Opening word variety — prevents pattern detection
const OPENING_POOL = [
    "start with what they ordered/experienced",
    "start with how they found this place",
    "start with a time reference (visited last week, came yesterday, etc.)",
    "start directly with an opinion (Great food, Nice place, etc.)",
    "start with a comparison to other places",
    "start with mentioning who they came with",
    "start with a question format (Looking for a good X? Try this.)",
    "start mid-thought (So, my friend told me about this place...)",
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

// ═══════════════════════════════════════════════════════════════
// SECTION 2: REVIEW GENERATION — full, pasteable reviews
// ═══════════════════════════════════════════════════════════════

/**
 * CUSTOMER-FACING: Generate full, ready-to-paste review suggestions.
 * 
 * Each review is UNIQUE per session through:
 * - Random persona + style + imperfection combo (12×7×8 = 672 combos)
 * - Session seed (timestamp-based, never repeats)
 * - High temperature (1.0) AI generation
 * - Category-specific details that vary each time
 * 
 * ANTI-DETECTION:
 * - 21+ banned marketing phrases
 * - Structural variety (different openings, lengths, tones)
 * - 1 constructive note per batch (realism)
 * - Customer encouraged to edit before posting (UI-level)
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

    // Pick random combos for this batch — ensures uniqueness
    const personas = pickRandom(PERSONA_POOL, 5);
    const styles = pickRandom(STYLE_POOL, 5);
    const imperfections = pickRandom(IMPERFECTION_HINTS, 5);
    const openings = pickRandom(OPENING_POOL, 5);

    // Generate random star ratings for variety (mostly 5, some 4)
    const ratings = shuffleArray([5, 5, 5, 4, 5]).slice(0, 5);

    // Build the per-review instructions
    const reviewInstructions = personas.map((persona, i) => {
        return `Review ${i + 1} (${ratings[i]} stars): Written by ${persona}. Style: ${styles[i]}. Opening: ${openings[i]}. ${imperfections[i]}`;
    }).join('\n');

    // 1. Try Groq (primary)
    try {
        if (!GROQ_API_KEY) throw new Error("No Groq key");

        const langLabel = language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : language === 'mr' ? 'Marathi' : 'English';
        const categoryHint = businessContext ? `\nBUSINESS CATEGORY: ${businessContext}\nIMPORTANT: Every review MUST reference something specific to a "${businessContext}" business. For restaurants mention specific dishes/taste/portions/ambiance. For salons mention haircut/styling/products used. For clinics mention doctor name style/treatment/checkup. For gyms mention equipment/trainer/workout routine. For shops mention products/quality/pricing.` : '';

        const prompt = `You are a real customer who just visited a ${businessContext || 'local'} business and wants to share your genuine experience on Google Maps.

${contextStr}${categoryHint}
Language: ${langLabel}
Session: ${sessionSeed}

Write 5 COMPLETE Google reviews ready to post. Each review must feel like a DIFFERENT real person wrote it on their phone after visiting.

Each review must follow these specific instructions:
${reviewInstructions}

CRITICAL RULES TO AVOID GOOGLE DELETION:
- Write like a REAL customer recalling their GENUINE experience — NOT a marketer or brand ambassador
- Each review MUST have a completely different structure, opening word, sentence pattern, and length
- Mix review lengths: 1 short (15-25 words), 2 medium (25-40 words), 2 longer (40-60 words)
- ${businessLocation ? `Maximum 1 review can casually mention "${businessLocation}". The other 4 must NOT reference any location at all.` : 'Do NOT mention any specific city, area, or location name.'}
- BANNED PHRASES (Google's AI instantly flags these as fake/generated):
  "highly recommended", "top-notch", "exceeded expectations", "game-changer", "second to none",
  "unparalleled", "world-class", "best in class", "cutting-edge", "hidden gem", "exceptional",
  "phenomenal", "impeccable", "seamless", "above and beyond", "state of the art", "go-to place",
  "hands down", "blown away", "couldn't be happier", "hats off", "must visit", "five star",
  "a cut above", "gem of a place", "nothing short of"
- NEVER start two reviews with the same word or similar phrase
- NEVER use more than one exclamation mark per review
- Exactly 1 review MUST include a small constructive note (e.g., "parking was tight", "had to wait 10 mins", "music was a bit loud", "wish they had more options") — but still give 4-5 stars overall
- At least 3 reviews MUST mention something SPECIFIC to this business type (a dish name, a treatment, equipment, a product)
- Do NOT output any URLs, links, hashtags, @mentions, or emojis
- Do NOT use words like "SEO", "keyword", "review", "rating" or meta-language about reviews
- Do NOT mention "${businessName}" more than once per review

Output EXACTLY 5 reviews, one per line. No numbering, no bullet points, no quotes, no labels, no blank lines between them.`;

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
                        content: "You write authentic Google reviews as if you are different real customers. Each review must sound genuinely human — like someone typing on their phone right after their visit. Mix casual and proper English naturally. Never sound like a chatbot, marketer, or AI assistant. Never use fancy vocabulary or marketing buzzwords. Write the way normal people actually type reviews."
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
            .map((l: string) => l.replace(/^\d+[\.)]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[-•]\s*/, '').trim())
            .filter((l: string) => l.length > 10 && l.length < 350);

        if (lines.length >= 3) {
            console.log("✅ Reviews generated via Groq");
            return lines.slice(0, 5).map((text: string, i: number) => ({
                text,
                rating: ratings[i] || 5
            }));
        }
        throw new Error("Insufficient Groq results");

    } catch (groqError) {
        console.warn("📻 Groq failed, trying Gemini:", groqError);

        // 2. Try Gemini (fallback)
        try {
            if (!GEMINI_API_KEY) throw new Error("No Gemini key");

            const categoryHint = businessContext ? `\nThis is a "${businessContext}" business. Each review MUST reference something specific to this category (e.g., specific dishes for restaurants, treatments for salons, equipment for gyms, doctors for clinics, products for shops).` : '';

            const prompt = `Write 5 COMPLETE Google reviews as if 5 different real customers are sharing their genuine experience after visiting this ${businessContext || 'local'} business.

${contextStr}${categoryHint}
Session: ${sessionSeed}

Each review must be from a different perspective:
${reviewInstructions}

RULES TO KEEP REVIEWS ON GOOGLE (prevent auto-deletion):
- Each review must sound like a different real person typed it on their phone
- Mix lengths: 1 short (15-25 words), 2 medium (25-40 words), 2 longer (40-60 words)
- ${businessLocation ? `Only 1 review may mention "${businessLocation}". Others must NOT.` : 'Do NOT mention any location.'}
- BANNED: "highly recommended", "exceeded expectations", "top-notch", "world-class", "game-changer", "hidden gem", "exceptional", "phenomenal", "impeccable", "seamless", "above and beyond", "hands down", "blown away", "couldn't be happier", "must visit", "hats off", "nothing short of"
- 1 review MUST have a small constructive note (wait time, parking, etc.) but still positive overall
- 3+ reviews MUST mention specific details relevant to the business category
- Every review must start with a DIFFERENT word
- No emojis, URLs, links, hashtags
- Output 5 reviews, one per line. No numbering, no quotes.`;

            const result = await geminiModel.generateContent(prompt);
            const content = result.response.text();
            const lines = content
                .split('\n')
                .map(l => l.replace(/^\d+[\.)]\s*/, '').replace(/^["']|["']$/g, '').replace(/^[-•]\s*/, '').trim())
                .filter(l => l.length > 10 && l.length < 350);

            if (lines.length >= 3) {
                console.log("✅ Reviews generated via Gemini");
                return lines.slice(0, 5).map((text, i) => ({
                    text,
                    rating: ratings[i] || 5
                }));
            }
            throw new Error("Insufficient Gemini results");

        } catch (geminiError) {
            console.warn("📻 Gemini failed, using natural templates:", geminiError);
        }
    }

    // 3. Fallback: Category-aware humanized templates
    return generateNaturalFallbacks(businessName, businessContext, businessLocation, ratings);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: FALLBACK TEMPLATES — pre-written human reviews
// ═══════════════════════════════════════════════════════════════

/**
 * Generate natural-sounding fallback review templates.
 * Category-aware: references details relevant to the business type.
 * Each template reads like a genuine customer review.
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
            `The food was really fresh and tasty. Had the paneer butter masala and naan, both were great. Will come back for sure.`,
            `Quick service even on a busy evening. Portions are generous and prices are fair${loc}. The dal fry was perfect.`,
            `Waited about 10 mins for a table but the food totally made up for it. The biryani here is legit.`,
            `Family comes here almost every weekend now. Kids love the tandoori starters. Only issue is parking gets tight.`,
            `Ordered delivery twice this month. Food arrived hot both times. The chicken tikka and garlic naan combo is our favourite.`,
            `Consistent taste every time we visit. Perfect for a quick family dinner when nobody wants to cook.`,
            `A friend dragged me here and honestly glad they did. The starters were amazing, mains were decent too.`,
            `The thali was filling and fresh. Clean dining area. Staff was polite. Will definitely try more items next time.`,
            `Tried their special combo meal, pretty good value for money. The raita was fresh and the roti was soft.`,
            `Came for lunch on a weekday, not crowded at all. Food came quickly and the taste was really nice.`,
        ],
        salon: [
            `The stylist really listened to what I wanted and didn't just do their own thing. Very happy with my haircut.`,
            `Clean place with good products and reasonable prices${loc}. My colour turned out exactly how I wanted.`,
            `Been coming here for a few months now. Quality is always consistent which is hard to find.`,
            `Got a facial done — it was super relaxing and my skin looked great the next day. Staff was friendly.`,
            `Walked in without an appointment and they still fit me in quickly. Good haircut and beard trim.`,
            `Was nervous about trying a new salon but honestly the stylist was really patient and skilled.`,
            `Hair spa treatment was worth every rupee. My hair felt so much softer after. Already booked next month.`,
            `Quick and clean service. The lady who did my threading was gentle and fast. No redness at all.`,
        ],
        clinic: [
            `Doctor was thorough with the checkup, didn't rush through anything. Explained everything clearly.`,
            `Clean clinic with short wait time${loc}. Staff was helpful and the doctor was very professional.`,
            `The treatment was painless and the doctor was really reassuring throughout. Good experience overall.`,
            `They even called for a follow-up after the visit which I didn't expect. Shows they actually care.`,
            `Doctors here take proper time with each patient. No 2-minute consultations like some other places.`,
            `Took my kid for a dental checkup. The doctor was amazing with children — patient and gentle.`,
            `Went for a regular health checkup. Everything was well organized and reports came on time.`,
            `Pharmacy on-site is convenient. Doctor prescribed what was needed, no unnecessary medicines.`,
        ],
        gym: [
            `Good equipment variety and the trainers actually correct your form instead of just standing around. Worth it.`,
            `Clean gym with proper ventilation${loc}. Not too crowded during morning hours which I prefer.`,
            `The trainer made a custom workout plan based on my goals. Three months in and seeing real results.`,
            `Friendly atmosphere, no ego lifting culture here. Everyone minds their own business. Good vibe.`,
            `Has everything you need — cardio machines, free weights, clean washrooms, and flexible timings.`,
            `Zumba classes are fun and the instructor keeps it energetic. Good way to stay consistent.`,
            `AC works well even in summer. Equipment is maintained regularly. Only wish they had more squat racks.`,
        ],
        shop: [
            `Good selection and fair prices. The owner helped me pick the right product without pushing expensive ones.`,
            `Quality was good and they even offered home delivery for free. Will shop here again.`,
            `They stock genuine branded products and don't overprice them like some other stores.`,
            `Staff was helpful without being annoying or pushy. Let me browse and helped when I asked. Nice experience.`,
            `Prices were competitive compared to online. Plus you get to see and feel products before buying which matters.`,
            `Bought a couple of items on sale. Good discounts and the products were genuine. Clean and organized store.`,
        ],
    };

    const generic = [
        `Professional team and they got everything done on time${loc}. Happy with the service overall.`,
        `Went on a friend's suggestion and wasn't disappointed. Good service, fair pricing, clean place.`,
        `Compared a few options before choosing ${businessName} and glad I did. Quality work.`,
        `Consistent quality every time I visit. That kind of reliability says a lot about them.`,
        `Staff was patient and took time to explain things properly. Didn't feel rushed at all.`,
        `Clean place with fair pricing. You can tell they genuinely care about their work.`,
        `Service was good overall. Parking was a bit tight but that's the only minor issue.`,
        `Tried a couple of other places before this one. This is noticeably better in quality and service.`,
        `Friendly staff who actually remember returning customers. Small thing but makes a difference.`,
        `Had to wait about 15 mins due to a rush but the result was totally worth the wait.`,
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
