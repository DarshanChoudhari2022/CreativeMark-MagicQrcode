import { GoogleGenerativeAI } from "@google/generative-ai";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ReviewSuggestion {
  text: string;
  rating: number;
  talkingPoints?: string[];
  source?: "ai" | "fallback";
}

const BHAIRAVEE_MENU_ITEMS = [
  "Patavadi Rassa",
  "Fanas Bhaji",
  "Kaju Usal",
  "Masala Vange",
  "Shev Bhaji",
  "Matki Usal",
  "Lajit Paneer Biryani",
  "Kothimbir Biryani",
  "Chaap Biryani",
  "Ambur Biryani",
  "Sarangi Ghee Roast Chaap Biryani",
  "Malika Dum Biryani",
  "Lucknowi Dum Biryani",
  "Bhairavee Special Platter",
  "Tender Coconut Tikka",
  "Lemon Paneer Tikka",
  "Paneer Cheese Seekh Kebab",
  "Paneer Multani",
  "Chef Special Tikka Paneer",
  "Paneer Shole Kebab",
  "Paneer Rowdy Tikka",
  "Bhairavee Special Veg",
  "Tender Coconut and Broccoli Miloni",
  "Veg Seekh Kebab Masala",
  "Sag Buruta Masala",
  "Cheese Palak Kofta",
  "Paneer Ghee Roast Masala",
  "Stuffed Palak Paneer",
  "Vilayati Subzi Sagwala",
];

const GENERIC_RESTAURANT_DETAILS = [
  "taste",
  "freshness",
  "portion size",
  "service speed",
  "clean dining area",
  "family-friendly seating",
];

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function isBhairaveeRestaurant(businessName: string, businessContext: string): boolean {
  const haystack = `${businessName} ${businessContext}`.toLowerCase();
  return haystack.includes("bhairavee") || haystack.includes("bhairavi");
}

function getAllowedDetails(businessName: string, businessContext: string): string[] {
  const context = businessContext.toLowerCase();

  if (isBhairaveeRestaurant(businessName, businessContext)) {
    return BHAIRAVEE_MENU_ITEMS;
  }

  if (context.includes("restaurant") || context.includes("hotel") || context.includes("veg")) {
    return GENERIC_RESTAURANT_DETAILS;
  }

  if (context.includes("salon")) {
    return ["haircut", "styling", "facial", "cleanliness", "staff behaviour", "appointment timing"];
  }

  if (context.includes("clinic") || context.includes("doctor")) {
    return ["clear explanation", "clean clinic", "appointment timing", "staff support", "follow-up"];
  }

  if (context.includes("gym") || context.includes("fitness")) {
    return ["equipment", "trainer guidance", "cleanliness", "workout space", "timings"];
  }

  if (context.includes("pet") || context.includes("dog") || context.includes("daycare") || context.includes("resort")) {
    return ["pet care", "clean space", "staff attention", "boarding", "daycare", "safe environment"];
  }

  if (context.includes("garage") || context.includes("automotive") || context.includes("vehicle") || context.includes("bike")) {
    return ["repair work", "clear explanation", "service timing", "fair pricing", "staff support"];
  }

  if (context.includes("shop") || context.includes("store")) {
    return ["product quality", "fair pricing", "staff help", "variety", "billing"];
  }

  return ["service", "cleanliness", "staff behaviour", "pricing", "waiting time"];
}

function sanitizeSuggestion(text: string, allowedDetails: string[], isSpecificMenu: boolean): string {
  let cleaned = text
    .replace(/^\d+[\.)]\s*/, "")
    .replace(/^[-*]\s*/, "")
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/\b(highly recommended|must visit|best ever|five star|top-notch|hidden gem)\b/gi, (match) => {
    const replacements: Record<string, string> = {
      "highly recommended": "worth trying",
      "must visit": "worth a visit",
      "best ever": "really good",
      "five star": "good",
      "top-notch": "good",
      "hidden gem": "nice place",
    };
    return replacements[match.toLowerCase()] || "good";
  });

  if (isSpecificMenu) {
    const mentionsKnownItem = allowedDetails.some((item) => cleaned.toLowerCase().includes(item.toLowerCase()));
    if (!mentionsKnownItem && /\b(biryani|paneer|tikka|bhaji|usal|kofta|naan|thali|starter|main course)\b/i.test(cleaned)) {
      const safeItem = allowedDetails[Math.floor(Math.random() * allowedDetails.length)];
      cleaned = `I tried ${safeItem} here and liked the taste. ${cleaned.replace(/\b[a-z ]*(biryani|paneer|tikka|bhaji|usal|kofta|naan|thali)\b/gi, "the food")}`;
    }
  }

  return cleaned.length > 240 ? `${cleaned.slice(0, 237).trim()}...` : cleaned;
}

function parseSuggestions(content: string, allowedDetails: string[], isSpecificMenu: boolean): string[] {
  return content
    .split("\n")
    .map((line) => sanitizeSuggestion(line, allowedDetails, isSpecificMenu))
    .filter((line) => line.length >= 20 && line.length <= 260)
    .slice(0, 5);
}

function buildPrompt(
  businessName: string,
  rating: number,
  language: string,
  businessContext: string,
  businessLocation: string,
  allowedDetails: string[],
  isSpecificMenu: boolean
): string {
  const langLabel = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";
  const detailRule = isSpecificMenu
    ? `Only mention menu items from this exact menu list: ${allowedDetails.join(", ")}. Do not invent dishes, prices, offers, staff names, or facts.`
    : `Use only broad experience details from this list when useful: ${allowedDetails.join(", ")}. Do not invent product names, dish names, staff names, prices, offers, or facts.`;

  return `Create 5 short editable Google review ideas for a customer who genuinely visited this business.

Business: ${businessName}
Category/context: ${businessContext || "local business"}
Customer selected rating: ${rating}/5
${businessLocation ? `Area/city context: ${businessLocation}` : ""}
Language: ${langLabel}

Compliance rules:
- The customer must be able to edit the text into their own words before posting.
- Do not write as the business owner, marketer, employee, or paid reviewer.
- Do not ask for a specific rating or only positive content.
- Do not include incentives, discounts, rewards, pressure, staff-name requests, hashtags, URLs, or promotional claims.
- Keep each idea natural, modest, and based on a real customer experience.
- Match the selected rating honestly. For 1-3 star ratings, include neutral or constructive wording.
- Avoid SEO language and exaggerated phrases such as "highly recommended", "must visit", "top-notch", "hidden gem", "best ever", "world class", or "five star".
- Keep each idea between 12 and 35 words.
- Mix the angle: some can mention food/service/cleanliness generally, and some can mention one specific allowed detail.
- ${detailRule}

Output exactly 5 lines. No numbering, bullets, quotes, labels, or extra explanation.`;
}

export async function generateReviewSuggestions(
  businessName: string,
  rating: number,
  language: string = "en",
  businessContext: string = "",
  businessLocation: string = "",
  _mapUrl: string = "",
  _tone: string = "Natural"
): Promise<ReviewSuggestion[]> {
  const allowedDetails = getAllowedDetails(businessName, businessContext);
  const isSpecificMenu = isBhairaveeRestaurant(businessName, businessContext);
  const prompt = buildPrompt(
    businessName,
    rating,
    language,
    businessContext,
    businessLocation,
    allowedDetails,
    isSpecificMenu
  );

  try {
    if (!GROQ_API_KEY) throw new Error("No Groq key");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You help customers draft honest, editable Google review ideas based only on their real experience. Never invent menu items, incentives, employee names, or promotional claims.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.55,
        max_tokens: 350,
      }),
    });

    if (!response.ok) throw new Error(`Groq Error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const lines = parseSuggestions(content, allowedDetails, isSpecificMenu);

    if (lines.length >= 3) {
      return lines.map((text) => ({ text, rating, talkingPoints: allowedDetails.slice(0, 6), source: "ai" }));
    }
  } catch (groqError) {
    console.warn("Groq review helper failed, trying Gemini:", groqError);
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("No Gemini key");

    const result = await geminiModel.generateContent(prompt);
    const lines = parseSuggestions(result.response.text(), allowedDetails, isSpecificMenu);

    if (lines.length >= 3) {
      return lines.map((text) => ({ text, rating, talkingPoints: allowedDetails.slice(0, 6), source: "ai" }));
    }
  } catch (geminiError) {
    console.warn("Gemini review helper failed, using local review ideas:", geminiError);
  }

  return generateCompliantFallbacks(businessName, businessContext, businessLocation, rating);
}

function generateCompliantFallbacks(
  businessName: string,
  category: string,
  location: string,
  rating: number
): ReviewSuggestion[] {
  const allowedDetails = getAllowedDetails(businessName, category);
  const isSpecificMenu = isBhairaveeRestaurant(businessName, category);
  const details = shuffleArray(allowedDetails).slice(0, 6);
  const loc = location ? ` in ${location}` : "";

  const positive = isSpecificMenu
    ? shuffleArray([
        `Good food and a clean place. Service was polite, and the overall experience at ${businessName} felt comfortable.`,
        `Tried ${details[0]} here and liked the taste. The food felt fresh and the visit was pleasant overall.`,
        `${businessName} was nice for a pure veg meal. Simple, tasty food and a comfortable family-friendly atmosphere.`,
        `The ${details[1] || details[0]} was good, and the portion felt satisfying. Service was smooth during my visit.`,
        `Nice place for vegetarian food${loc}. I liked the taste, seating, and the way the staff handled the order.`,
        `Had a good meal here with family. The food was tasty, the place was clean, and the service was decent.`,
        `Tried ${details[2] || details[0]} and enjoyed the flavour. Good option when you want pure veg food.`,
        `The starters were served well and tasted fresh. ${details[3] || details[0]} stood out for me.`,
        `Comfortable place for lunch or dinner. The food was flavourful without feeling too heavy.`,
        `${details[4] || details[0]} had a nice taste, and the staff handled the order properly.`,
        `Good pure veg restaurant with decent service. I liked the food quality and overall cleanliness.`,
        `Visited for a quick meal and had a smooth experience. Food came nicely prepared and tasted good.`,
      ])
    : [
        `Good overall experience at ${businessName}. The staff were polite and the service felt smooth during my visit.`,
        `Visited ${businessName}${loc} recently. Clean place, decent service, and everything was handled properly.`,
        `The team was helpful and the visit went smoothly. I liked the way they explained things without rushing.`,
        `Nice experience overall. The place was clean, pricing felt fair, and the staff were easy to talk to.`,
        `${businessName} handled my visit well. I would come back based on the service and overall experience.`,
        `Simple and smooth experience. The staff were responsive and the place felt well maintained.`,
        `Good service and a clean setup. Everything was handled clearly from start to finish.`,
        `Visited for the first time and the experience was comfortable. Staff behaviour was polite.`,
      ];

  const lowerCategory = category.toLowerCase();
  const petCare = shuffleArray([
    `Good place for pet care. The staff seemed attentive, and the space felt clean and safe.`,
    `Left my pet here and the experience was smooth. The team handled things calmly and responsibly.`,
    `${businessName} felt comfortable for pet daycare. Clean setup, polite staff, and good overall care.`,
    `Nice experience with the pet boarding service. The place looked maintained and the staff were responsive.`,
    `My pet seemed comfortable after the visit. The team was polite and the process was simple.`,
    `Good option for daycare or boarding when you need someone reliable to look after your pet.`,
    `The staff paid attention to the pets and kept the place clean. Overall a positive experience.`,
    `Visited ${businessName}${loc} for pet care. The setup felt safe and the handling was gentle.`,
  ]);

  const automotive = shuffleArray([
    `Good service experience. The issue was explained clearly, and the work was handled properly.`,
    `Visited ${businessName}${loc} for vehicle service. Staff were polite and the process was smooth.`,
    `The repair work was done neatly, and the pricing felt fair for the service provided.`,
    `Good garage experience overall. They checked the problem properly and explained what needed to be done.`,
    `Service was completed on time, and the staff handled the vehicle carefully.`,
    `Helpful team and clear communication. The visit felt straightforward without unnecessary confusion.`,
  ]);

  const constructive = [
    `My visit to ${businessName} was okay. Some parts were good, but the waiting time or service could be improved.`,
    `Decent experience overall. The place had positives, though a few things could have been smoother during my visit.`,
    `The service was polite, but the experience felt a bit slow. It was still manageable overall.`,
    `Food and service were okay. I liked some things, but there is room to improve consistency.`,
    `Average experience for me. The staff were helpful, but I expected the visit to be a little smoother.`,
  ];

  let source = rating >= 4 ? positive : constructive;
  if (rating >= 4 && (lowerCategory.includes("pet") || lowerCategory.includes("dog") || lowerCategory.includes("daycare") || lowerCategory.includes("resort"))) {
    source = petCare;
  }
  if (rating >= 4 && (lowerCategory.includes("garage") || lowerCategory.includes("automotive") || lowerCategory.includes("vehicle") || lowerCategory.includes("bike"))) {
    source = automotive;
  }
  return source.slice(0, 5).map((text) => ({
    text,
    rating,
    talkingPoints: details,
    source: "fallback",
  }));
}
