type EnvLike = Record<string, string | boolean | undefined>;

export const DEFAULT_GEMINI_REVIEW_MODEL = "gemini-3.7-flash";
export const DEFAULT_GROQ_REVIEW_MODEL = "openai/gpt-oss-20b";
export const REVIEW_API_ENDPOINT = "/api/generate-review-suggestions";

export function getGeminiReviewModel(env: EnvLike): string {
  return String(env.GEMINI_MODEL || env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_REVIEW_MODEL);
}

export function getGroqReviewModel(env: EnvLike): string {
  return String(env.GROQ_MODEL || env.VITE_GROQ_MODEL || DEFAULT_GROQ_REVIEW_MODEL);
}

interface GroqReviewRequestOptions {
  model: string;
  prompt: string;
}

export function buildGroqReviewRequest({ model, prompt }: GroqReviewRequestOptions) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "You help customers draft honest, editable Google review ideas based only on their real experience. Never invent menu items, incentives, employee names, or promotional claims. Avoid repetitive wording and produce unique phrasing for every request.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.75,
    max_tokens: 350,
  };
}
