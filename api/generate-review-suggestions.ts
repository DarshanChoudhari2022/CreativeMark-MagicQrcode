import type { IncomingMessage, ServerResponse } from "node:http";
import {
  buildGroqReviewRequest,
  getGeminiReviewModel,
  getGroqReviewModel,
} from "../src/services/aiProviderConfig";

const MAX_PROMPT_LENGTH = 8000;

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
  res.end(JSON.stringify(payload));
}

async function responseError(provider: string, response: Response): Promise<Error> {
  const text = await response.text().catch(() => "");
  return new Error(`${provider} Error: ${response.status}${text ? ` - ${text.slice(0, 300)}` : ""}`);
}

async function generateWithGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildGroqReviewRequest({ model: getGroqReviewModel(process.env), prompt })),
  });

  if (!response.ok) throw await responseError("Groq", response);

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function generateWithGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = getGeminiReviewModel(process.env);
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 350,
        },
      }),
    }
  );

  if (!response.ok) throw await responseError("Gemini", response);

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      sendJson(res, 400, { error: "Prompt is required" });
      return;
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      sendJson(res, 413, { error: "Prompt is too long" });
      return;
    }

    try {
      const content = await generateWithGroq(prompt);
      sendJson(res, 200, { content, provider: "groq" });
      return;
    } catch (groqError) {
      console.warn("Groq review helper failed, trying Gemini:", groqError);
    }

    const content = await generateWithGemini(prompt);
    sendJson(res, 200, { content, provider: "gemini" });
  } catch (error) {
    console.warn("Review helper failed:", error);
    sendJson(res, 502, {
      error: error instanceof Error ? error.message : "Failed to generate review suggestions",
    });
  }
}
