import type { IncomingMessage, ServerResponse } from "node:http";

const MAX_PROMPT_LENGTH = 8000;
const DEFAULT_GROQ_REVIEW_MODEL = "qwen/qwen3.8-27b";
const DEFAULT_GEMINI_REVIEW_MODEL = "gemini-3.6-flash";
const DEFAULT_HUGGINGFACE_REVIEW_MODEL = "openai/gpt-oss-120b:fastest";

function uniqueSeed(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}-${crypto.randomUUID()}`;
}

const UNIQUENESS_INSTRUCTION =
  "\n\nIMPORTANT: This is a brand-new request. You MUST produce completely original text that has never appeared in any previous response. Vary your vocabulary, sentence structure, opening words, and topic angle. Do NOT reuse any phrasing from prior outputs.";

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) return {};

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.end(JSON.stringify(payload));
}

async function providerError(provider: string, response: Response): Promise<Error> {
  const text = await response.text().catch(() => "");
  return new Error(`${provider} Error: ${response.status}${text ? ` - ${text.slice(0, 300)}` : ""}`);
}

function groqRequest(prompt: string) {
  return {
    model: process.env.GROQ_MODEL || DEFAULT_GROQ_REVIEW_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You help customers draft honest, editable Google review ideas based only on their real experience. Never invent menu items, incentives, employee names, or promotional claims. Every response must use completely fresh wording — never repeat phrases from earlier outputs.",
      },
      { role: "user", content: prompt + UNIQUENESS_INSTRUCTION },
    ],
    temperature: 0.95,
    max_tokens: 450,
    top_p: 0.95,
  };
}

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured — skipping");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(groqRequest(prompt)),
  });

  if (!response.ok) throw await providerError("Groq", response);

  const data = await response.json();
  const content = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || "").trim();
  if (!content) throw new Error("Groq returned empty content");
  return content;
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured — skipping");

  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_REVIEW_MODEL;
  const enrichedPrompt = `${prompt}\nUniqueness token: ${uniqueSeed()}${UNIQUENESS_INSTRUCTION}`;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enrichedPrompt }] }],
        generationConfig: {
          temperature: 0.95,
          topP: 0.95,
          topK: 50,
          maxOutputTokens: 450,
        },
      }),
    }
  );

  if (!response.ok) throw await providerError("Gemini", response);

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  if (!content.trim()) throw new Error("Gemini returned empty content");
  return content;
}

async function generateWithHuggingFace(prompt: string): Promise<string> {
  const apiKey = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error("HF_TOKEN is not configured — skipping");

  const model = process.env.HF_MODEL || process.env.HUGGINGFACE_MODEL || DEFAULT_HUGGINGFACE_REVIEW_MODEL;
  const enrichedPrompt = `${prompt}\nUniqueness token: ${uniqueSeed()}${UNIQUENESS_INSTRUCTION}`;
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Create honest, editable Google review ideas. Do not invent facts, staff names, offers, prices, or promotional claims. Every response must use completely fresh, never-before-used wording. Output only the requested review lines.",
        },
        { role: "user", content: enrichedPrompt },
      ],
      temperature: 0.95,
      max_tokens: 800,
      top_p: 0.95,
    }),
  });

  if (!response.ok) throw await providerError("Hugging Face", response);

  const data = await response.json();
  const content = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || "").trim();
  if (!content) throw new Error("Hugging Face returned empty content");
  return content;
}

function localReviewIdeas(): string {
  return [
    "Good overall experience. The place felt clean, and the service was handled smoothly during my visit.",
    "The team was helpful and explained things clearly without rushing the process.",
    "Visited recently and had a comfortable experience. Staff behaviour was polite and everything was managed properly.",
    "Nice visit overall. The service felt organized, and the place was easy to deal with.",
    "Everything went smoothly during my visit. I would consider coming back based on the overall experience.",
  ].join("\n");
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const requestId = typeof body.requestId === "string" ? body.requestId.trim() : crypto.randomUUID();

    if (!prompt) {
      sendJson(res, 400, { error: "Prompt is required" });
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      sendJson(res, 413, { error: "Prompt is too long" });
      return;
    }

    const errors: string[] = [];
    const providers = [
      { name: "groq", run: generateWithGroq },
      { name: "gemini", run: generateWithGemini },
      { name: "huggingface", run: generateWithHuggingFace },
    ];

    for (const provider of providers) {
      try {
        const content = await provider.run(`${prompt}\nFresh request id: ${requestId}\nTimestamp: ${Date.now()}`);
        sendJson(res, 200, { content, provider: provider.name, requestId });
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : `${provider.name} failed`;
        console.warn(`${provider.name} review helper failed:`, message);
        errors.push(message);
      }
    }

    sendJson(res, 200, {
      content: localReviewIdeas(),
      provider: "local",
      details: errors,
    });
  } catch (error) {
    console.warn("Review helper failed before provider call:", error);
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Failed to generate review suggestions",
    });
  }
}
