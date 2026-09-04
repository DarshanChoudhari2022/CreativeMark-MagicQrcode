import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

const outDir = ".tmp-ai-provider-config";
const apiSource = readFileSync("api/generate-review-suggestions.ts", "utf8");

assert.equal(
  apiSource.includes("../src/"),
  false,
  "Vercel API routes must be self-contained and must not import frontend src modules"
);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/services/aiProviderConfig.ts",
    "api/generate-review-suggestions.ts",
    "--target",
    "ES2022",
    "--module",
    "ES2022",
    "--moduleResolution",
    "bundler",
    "--outDir",
    outDir,
    "--skipLibCheck",
  ],
  { stdio: "inherit" }
);

const config = await import(pathToFileURL(`${process.cwd()}/${outDir}/src/services/aiProviderConfig.js`).href);

assert.equal(config.REVIEW_API_ENDPOINT, "/api/generate-review-suggestions");
assert.equal(config.getGeminiReviewModel({}), "gemini-3.7-flash");
assert.equal(
  config.getGeminiReviewModel({ VITE_GEMINI_MODEL: "gemini-3.8-flash" }),
  "gemini-3.8-flash"
);
assert.equal(config.getGroqReviewModel({}), "openai/gpt-oss-20b");
assert.equal(config.getHuggingFaceReviewModel({}), "openai/gpt-oss-120b:fastest");

const request = config.buildGroqReviewRequest({
  model: "openai/gpt-oss-20b",
  prompt: "Create review ideas",
});

assert.equal(request.model, "openai/gpt-oss-20b");
assert.equal(request.messages.length, 2);
assert.equal(request.messages[0].role, "system");
assert.equal(request.messages[1].content, "Create review ideas");
assert.equal(request.temperature, 0.75);
assert.equal(request.max_tokens, 350);

rmSync(outDir, { recursive: true, force: true });
