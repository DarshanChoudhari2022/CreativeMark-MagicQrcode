import fs from "fs";
import path from "path";

// ── Load environment variables from .env.local ──
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const env = {};
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = { ...process.env, ...loadEnv() };

const samplePrompt = `Create 5 short editable Google review ideas for a customer who genuinely visited this business.

Business: Bhairavee Restaurant
Category/context: Indian restaurant & fine dining
Customer selected rating: 5/5
Rating tone: 5-star: clearly positive and satisfied, but natural and not exaggerated.
Language: English

Compliance rules:
- Keep each idea between 12 and 35 words.
- Every line must use a different opening, sentence structure, topic angle, and wording.
- Output exactly 5 lines. No numbering, bullets, quotes, labels, or extra explanation.`;

// ── 1. Groq (Fastest & Active) ──
async function testGroq() {
  const apiKey = env.GROQ_API_KEY;
  const model = env.GROQ_MODEL || "qwen/qwen3.8-27b";
  console.log(`\n🟣 [1/3] Testing Groq (Model: ${model})...`);

  if (!apiKey) {
    console.log("   ⚠️ SKIPPED: No GROQ_API_KEY found in .env.local");
    return { ok: false, skipped: true, reason: "No key configured" };
  }

  try {
    const t0 = Date.now();
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: "You help customers draft honest Google review ideas. Every response must use completely fresh wording.",
          },
          { role: "user", content: `${samplePrompt}\nSeed: ${Date.now()}-${Math.random()}` },
        ],
        temperature: 0.95,
        max_tokens: 450,
      }),
    });

    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const text = await res.text();
      console.log(`   ❌ FAILED (${res.status}): ${text.slice(0, 250)}`);
      return { ok: false, error: text };
    }

    const data = await res.json();
    const content = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || "").trim();
    if (!content) {
      console.log("   ❌ FAILED: Groq returned empty content");
      return { ok: false, error: "Empty content" };
    }

    console.log(`   ✅ SUCCESS! (Response in ${elapsed}ms) Sample output:`);
    const lines = content.split("\n").filter((l) => l.trim().length > 10);
    lines.slice(0, 3).forEach((line, i) => console.log(`      ${i + 1}. ${line.trim()}`));
    return { ok: true, output: content, provider: "groq" };
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// ── 2. Google Gemini ──
async function testGemini() {
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || "gemini-3.6-flash";
  console.log(`\n🟡 [2/3] Testing Google Gemini (Model: ${model})...`);

  if (!apiKey) {
    console.log("   ⚠️ SKIPPED: No GEMINI_API_KEY found in .env.local");
    return { ok: false, skipped: true, reason: "No key" };
  }

  try {
    const t0 = Date.now();
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${samplePrompt}\nSeed: ${Date.now()}-${Math.random()}` }] }],
          generationConfig: {
            temperature: 0.95,
            maxOutputTokens: 450,
          },
        }),
      }
    );

    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const text = await res.text();
      console.log(`   ❌ FAILED (${res.status}): ${text.slice(0, 250)}`);
      return { ok: false, error: text };
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!content.trim()) {
      console.log("   ❌ FAILED: Gemini returned empty content");
      return { ok: false, error: "Empty content" };
    }

    console.log(`   ✅ SUCCESS! (Response in ${elapsed}ms) Sample output:`);
    const lines = content.split("\n").filter((l) => l.trim().length > 10);
    lines.slice(0, 3).forEach((line, i) => console.log(`      ${i + 1}. ${line.trim()}`));
    return { ok: true, output: content, provider: "gemini" };
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// ── 3. Hugging Face ──
async function testHuggingFace() {
  const token = env.HF_TOKEN || env.HUGGINGFACE_API_KEY;
  const model = env.HF_MODEL || "openai/gpt-oss-120b:fastest";
  console.log(`\n🔵 [3/3] Testing Hugging Face (Model: ${model})...`);

  if (!token) {
    console.log("   ⚠️ SKIPPED: No HF_TOKEN found in .env.local");
    return { ok: false, skipped: true, reason: "No key" };
  }

  try {
    const t0 = Date.now();
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Create honest, editable Google review ideas. Do not invent facts. Every response must use completely fresh wording. Output only the requested review lines.",
          },
          { role: "user", content: `${samplePrompt}\nSeed: ${Date.now()}-${Math.random()}` },
        ],
        temperature: 0.95,
        max_tokens: 800,
      }),
    });

    const elapsed = Date.now() - t0;
    if (!res.ok) {
      const text = await res.text();
      console.log(`   ❌ FAILED (${res.status}): ${text.slice(0, 250)}`);
      return { ok: false, error: text };
    }

    const data = await res.json();
    const content = (data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning || "").trim();
    if (!content) {
      console.log("   ❌ FAILED: Model returned empty text");
      return { ok: false, error: "Empty content" };
    }

    console.log(`   ✅ SUCCESS! (Response in ${elapsed}ms) Sample output:`);
    const lines = content.split("\n").filter((l) => l.trim().length > 10);
    lines.slice(0, 3).forEach((line, i) => console.log(`      ${i + 1}. ${line.trim()}`));
    return { ok: true, output: content, provider: "huggingface" };
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
    return { ok: false, error: err.message };
  }
}

// ── Uniqueness Verification Across Consecutive Generations ──
async function testUniqueness() {
  console.log("\n🔄 Testing Uniqueness Across 2 Consecutive Generations (using active Groq engine)...");
  const apiKey = env.GROQ_API_KEY;
  const model = env.GROQ_MODEL || "qwen/qwen3.8-27b";

  const fetchReviews = async (round) => {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Create 5 honest review ideas. Exactly 5 lines without numbering." },
          { role: "user", content: `${samplePrompt}\nRound: ${round}, Seed: ${Date.now()}-${Math.random()}` },
        ],
        temperature: 0.95,
        max_tokens: 450,
      }),
    });
    const data = await res.json();
    return (data.choices?.[0]?.message?.content || "").trim();
  };

  const r1 = await fetchReviews(1);
  const r2 = await fetchReviews(2);

  const cleanLines = (text) =>
    text
      .split("\n")
      .map((l) => l.replace(/^\d+[.)]\s*/, "").trim())
      .filter((l) => l.length > 15);

  const lines1 = cleanLines(r1);
  const lines2 = cleanLines(r2);

  const overlap = lines1.filter((l) => lines2.includes(l));
  const isUnique = overlap.length === 0 && r1 !== r2;

  if (isUnique) {
    console.log("   ✅ UNIQUENESS VERIFIED: Round 1 and Round 2 produced 100% distinct reviews!");
    console.log(`      Round 1 sample: "${lines1[0]}"`);
    console.log(`      Round 2 sample: "${lines2[0]}"`);
  } else {
    console.log(`   ⚠️ Found ${overlap.length} overlapping lines.`);
  }
  return isUnique;
}

// ── Main Execution ──
console.log("════════════════════════════════════════════════════");
console.log("  AI Multi-Provider Connectivity & Uniqueness Test  ");
console.log("════════════════════════════════════════════════════");

const results = {};
results.Groq = await testGroq();
results.Gemini = await testGemini();
results.HuggingFace = await testHuggingFace();

let uniquenessOk = false;
if (results.Groq.ok) {
  uniquenessOk = await testUniqueness();
}

console.log("\n════════════════════════════════════════════════════");
console.log("  Summary Status");
console.log("════════════════════════════════════════════════════");
for (const [name, res] of Object.entries(results)) {
  if (res.ok) {
    console.log(`  ✅ ${name.padEnd(14)}: Working`);
  } else if (res.skipped) {
    console.log(`  ⚠️ ${name.padEnd(14)}: Skipped (${res.reason})`);
  } else {
    console.log(`  ❌ ${name.padEnd(14)}: Failed / Inactive`);
  }
}
if (results.Groq.ok) {
  console.log(`  ${uniquenessOk ? "✅" : "⚠️"} ${"Uniqueness".padEnd(14)}: ${uniquenessOk ? "Passed (100% distinct reviews)" : "Check overlap"}`);
}
console.log("════════════════════════════════════════════════════\n");
