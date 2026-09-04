import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";

const outDir = ".tmp-ai-provider-config";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
    "src/services/aiProviderConfig.ts",
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

const config = await import(pathToFileURL(`${process.cwd()}/${outDir}/aiProviderConfig.js`).href);

assert.equal(config.getGeminiReviewModel({}), "gemini-3.7-flash");
assert.equal(
  config.getGeminiReviewModel({ VITE_GEMINI_MODEL: "gemini-3.8-flash" }),
  "gemini-3.8-flash"
);
assert.equal(config.getGroqReviewModel({}), "llama-3.1-8b-instant");

const request = config.buildGroqReviewRequest({
  model: "llama-3.1-8b-instant",
  prompt: "Create review ideas",
});

assert.equal(request.model, "llama-3.1-8b-instant");
assert.equal(request.messages.length, 2);
assert.equal(request.messages[0].role, "system");
assert.equal(request.messages[1].content, "Create review ideas");
assert.equal(request.temperature, 0.75);
assert.equal(request.max_tokens, 350);

rmSync(outDir, { recursive: true, force: true });
