/* eslint-disable */
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import {analyzeToolImage} from "../gemini";

// Load environment variables from the functions directory
dotenv.config({path: path.resolve(__dirname, "../../.env")});

const IMAGES_DIR = path.join(__dirname, "images");
const RESULTS_FILE = path.join(__dirname, "initial_results.json");

async function main() {
  console.log("Starting generation of initial findings...");

  let results: Record<string, any> = {};
  if (fs.existsSync(RESULTS_FILE)) {
    console.log(`Loading existing results from ${RESULTS_FILE}`);
    results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf8"));
  }

  const files = fs.readdirSync(IMAGES_DIR).filter((f) => f.endsWith(".jpg") || f.endsWith(".png"));

  for (const file of files) {
    if (results[file]) {
      console.log(`Skipping ${file}, already processed.`);
      continue;
    }

    console.log(`Processing ${file}...`);
    const filePath = path.join(IMAGES_DIR, file);

    // Read file and convert to base64
    const buffer = fs.readFileSync(filePath);
    const mimeType = file.endsWith(".png") ? "image/png" : "image/jpeg";
    const base64Image = buffer.toString("base64");

    try {
      // Find mode: expectedTools is empty
      const detections = await analyzeToolImage(base64Image, mimeType, []);
      results[file] = detections;

      // Save progressively in case of rate limits
      fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));
      console.log(`Successfully processed ${file}. Found ${detections.length} tools.`);

      // Wait a bit to avoid Gemini rate limits (429)
      await new Promise((resolve) => setTimeout(resolve, 4000));
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      console.log("Stopping execution. Re-run script to continue from last successful image.");
      break;
    }
  }

  console.log("Finished processing images.");
}

main().catch(console.error);
