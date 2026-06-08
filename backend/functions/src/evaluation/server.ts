/* eslint-disable */
import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { analyzeToolImage } from "../gemini";
import { matchDetections } from "./evaluate";
import type { Detection, Tool } from "../shared/types";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const PORT = 3001;
const EVAL_DIR = __dirname;
const IMAGES_DIR = path.join(EVAL_DIR, "images");
const GROUND_TRUTH_FILE = path.join(EVAL_DIR, "ground_truth.json");
const EVAL_RESULTS_FILE = path.join(EVAL_DIR, "eval_results.json");

// Helper to parse JSON request body
function parseJsonBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}

// Single image evaluation helper
async function evaluateSingleImage(file: string, groundTruthData: Record<string, Detection[]>, results: Record<string, any>) {
  const filePath = path.join(IMAGES_DIR, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file ${file} not found.`);
  }

  const gtDetections = groundTruthData[file];
  if (!gtDetections) {
    throw new Error(`No ground truth found for ${file}.`);
  }

  const buffer = fs.readFileSync(filePath);
  const mimeType = file.endsWith(".png") ? "image/png" : "image/jpeg";
  const base64Image = buffer.toString("base64");

  console.log(`[API] Running Find Mode for ${file}...`);
  const findModePredictions = await analyzeToolImage(base64Image, mimeType, [], []);
  const findModeMetrics = matchDetections(findModePredictions, gtDetections);
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(`[API] Running Match Mode for ${file}...`);
  const expectedTools: Tool[] = gtDetections.map((gt, idx) => ({
    toolId: gt.toolId || `gt_${idx}`,
    drawerId: "drawer_eval",
    toolInfo: gt.toolInfo,
  }));
  const matchModePredictions = await analyzeToolImage(base64Image, mimeType, expectedTools, []);
  const matchModeMetrics = matchDetections(matchModePredictions, gtDetections);

  results[file] = {
    completed: true,
    groundTruthCount: gtDetections.length,
    findMode: {
      predictionsCount: findModePredictions.length,
      metrics: findModeMetrics,
      predictions: findModePredictions,
    },
    matchMode: {
      predictionsCount: matchModePredictions.length,
      metrics: matchModeMetrics,
      predictions: matchModePredictions,
    },
  };

  fs.writeFileSync(EVAL_RESULTS_FILE, JSON.stringify(results, null, 2));
  return results[file];
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for safety
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || "", `http://localhost:${PORT}`);

  // API Route: GET /api/data
  if (url.pathname === "/api/data" && req.method === "GET") {
    try {
      // 1. Get images list
      let images: string[] = [];
      if (fs.existsSync(IMAGES_DIR)) {
        images = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".jpeg"));
      }

      // 2. Load ground truth
      let groundTruth: Record<string, Detection[]> = {};
      if (fs.existsSync(GROUND_TRUTH_FILE)) {
        groundTruth = JSON.parse(fs.readFileSync(GROUND_TRUTH_FILE, "utf8"));
      }

      // 3. Load eval results
      let evalResults: Record<string, any> = {};
      if (fs.existsSync(EVAL_RESULTS_FILE)) {
        evalResults = JSON.parse(fs.readFileSync(EVAL_RESULTS_FILE, "utf8"));
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ images, groundTruth, evalResults }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API Route: POST /api/save-ground-truth
  if (url.pathname === "/api/save-ground-truth" && req.method === "POST") {
    try {
      const { imageName, detections } = await parseJsonBody(req);
      if (!imageName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "imageName is required" }));
        return;
      }

      let groundTruth: Record<string, Detection[]> = {};
      if (fs.existsSync(GROUND_TRUTH_FILE)) {
        groundTruth = JSON.parse(fs.readFileSync(GROUND_TRUTH_FILE, "utf8"));
      }

      // Overwrite or create key for this image
      groundTruth[imageName] = detections || [];

      fs.writeFileSync(GROUND_TRUTH_FILE, JSON.stringify(groundTruth, null, 2));

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API Route: POST /api/evaluate
  if (url.pathname === "/api/evaluate" && req.method === "POST") {
    try {
      const { imageName, all } = await parseJsonBody(req);

      if (!fs.existsSync(GROUND_TRUTH_FILE)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No ground_truth.json found. Create ground truth first!" }));
        return;
      }

      const groundTruthData = JSON.parse(fs.readFileSync(GROUND_TRUTH_FILE, "utf8"));
      
      let results: Record<string, any> = {};
      if (fs.existsSync(EVAL_RESULTS_FILE)) {
        results = JSON.parse(fs.readFileSync(EVAL_RESULTS_FILE, "utf8"));
      }

      if (all) {
        console.log("[API] Starting complete evaluation from scratch for all images...");
        const files = Object.keys(groundTruthData);
        const evalResults: Record<string, any> = {};

        for (const file of files) {
          try {
            await evaluateSingleImage(file, groundTruthData, evalResults);
            // Delay to avoid hitting rate limits
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (err: any) {
            console.error(`[API] Error evaluating ${file}:`, err.message);
          }
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, results: evalResults }));
      } else {
        if (!imageName) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "imageName is required if not evaluating all" }));
          return;
        }

        console.log(`[API] Running evaluation for single image: ${imageName}...`);
        const result = await evaluateSingleImage(imageName, groundTruthData, results);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, result }));
      }
    } catch (err: any) {
      console.error("[API] Evaluation error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // STATIC FILE SERVING
  let filePath = path.join(EVAL_DIR, url.pathname === "/" ? "viewer.html" : url.pathname);

  // Normalize path to prevent directory traversal
  const relative = path.relative(EVAL_DIR, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    let contentType = "text/plain";
    if (ext === ".html") contentType = "text/html";
    else if (ext === ".json") contentType = "application/json";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".css") contentType = "text/css";
    else if (ext === ".js") contentType = "application/javascript";

    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  ToolSight Evaluation Server running!`);
  console.log(`  Access the Web Editor at: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
