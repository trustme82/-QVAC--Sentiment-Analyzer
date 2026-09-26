#!/usr/bin/env node
// QVAC Sentiment Analyzer — GUI mode.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadModel, unloadModel, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";
import { analyzeSentiment } from "./logic.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 29515;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function serveStatic(res) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, "index.html"));
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

async function main() {
  console.log("- Loading language model on-device...");
  const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 });
  console.log("- Model ready.");

  const server = http.createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/") return serveStatic(res);

    if (req.method === "POST" && req.url === "/api/sentiment") {
      try {
        const { text } = await readBody(req);
        if (!text || !text.trim()) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Please paste some text first" }));
          return;
        }
        const result = await analyzeSentiment(modelId, text.trim());
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  });

  server.listen(PORT, () => {
    console.log(`- QVAC Sentiment Analyzer GUI ready at http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log("\n- Shutting down...");
    server.close();
    await unloadModel({ modelId });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("x", error);
  process.exit(1);
});
