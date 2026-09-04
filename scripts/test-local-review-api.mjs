import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";

const outDir = ".tmp-local-api";

function loadLocalEnv() {
  const env = readFileSync(".env.local", "utf8");

  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

rmSync(outDir, { recursive: true, force: true });
loadLocalEnv();

execFileSync(
  process.execPath,
  [
    "node_modules/typescript/bin/tsc",
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

const { default: handler } = await import(`../${outDir}/generate-review-suggestions.js`);
const server = createServer((req, res) => handler(req, res));
const results = [];

await new Promise((resolve) => server.listen(5055, "127.0.0.1", resolve));

async function callReviewApi() {
  const response = await fetch("http://127.0.0.1:5055/api/generate-review-suggestions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt:
        "Create 5 short unique Google review ideas for Dynamic Fitness Gym. Output exactly 5 lines. No numbering.",
      requestId: crypto.randomUUID(),
    }),
  });
  const data = await response.json();
  const firstLine = String(data.content || "").split(/\n/)[0].trim();
  results.push({ provider: data.provider, firstLine });

  console.log(
    JSON.stringify(
      {
        status: response.status,
        provider: data.provider,
        firstLine,
        hasProviderErrors: Array.isArray(data.details),
      },
      null,
      2
    )
  );

  if (!response.ok) {
    throw new Error(`Review API returned HTTP ${response.status}`);
  }
}

try {
  await callReviewApi();
  await callReviewApi();
} finally {
  await new Promise((resolve) => server.close(resolve));
  rmSync(outDir, { recursive: true, force: true });
}

if (results.some((result) => result.provider === "local")) {
  throw new Error("Expected AI provider output, but API returned local fallback");
}

const uniqueFirstLines = new Set(results.map((result) => result.firstLine.toLowerCase()));
if (uniqueFirstLines.size !== results.length) {
  throw new Error("Expected refreshed AI review ideas to differ between requests");
}
