/* eslint-disable */
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import {analyzeToolImage} from "../gemini";
import type {Detection, Tool} from "../shared/types";

// Load environment variables
dotenv.config({path: path.resolve(__dirname, "../../.env")});

const IMAGES_DIR = path.join(__dirname, "images");
const GROUND_TRUTH_FILE = path.join(__dirname, "ground_truth.json");
const EVAL_RESULTS_FILE = path.join(__dirname, "eval_results.json");

export function calculateIoU(box1: any, box2: any): number {
  if (box1.x == null || box1.y == null || box1.width == null || box1.height == null ||
      box2.x == null || box2.y == null || box2.width == null || box2.height == null) {
    return 0;
  }

  const xA = Math.max(box1.x, box2.x);
  const yA = Math.max(box1.y, box2.y);
  const xB = Math.min(box1.x + box1.width, box2.x + box2.width);
  const yB = Math.min(box1.y + box1.height, box2.y + box2.height);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;

  const unionArea = box1Area + box2Area - interArea;
  if (unionArea === 0) return 0;
  return interArea / unionArea;
}

export function matchDetections(predictions: Detection[], groundTruths: Detection[], iouThreshold = 0.5) {
  // Filter present predictions & present ground truths for physical bounding box IoU evaluations
  const activePredictions = (predictions || []).filter(p => p.status === "present" || p.status === undefined);
  const activeGroundTruths = (groundTruths || []).filter(g => g.status === "present" || g.status === undefined);

  let truePositives = 0;
  let totalIoU = 0;
  let correctNames = 0;

  const matchedGtIndices = new Set<number>();

  for (const pred of activePredictions) {
    let bestIoU = 0;
    let bestGtIndex = -1;

    for (let i = 0; i < activeGroundTruths.length; i++) {
      if (matchedGtIndices.has(i)) continue;

      const gt = activeGroundTruths[i];
      const iou = calculateIoU(pred.toolInfo, gt.toolInfo);

      if (iou > bestIoU) {
        bestIoU = iou;
        bestGtIndex = i;
      }
    }

    if (bestIoU >= iouThreshold && bestGtIndex !== -1) {
      truePositives++;
      totalIoU += bestIoU;
      matchedGtIndices.add(bestGtIndex);

      // Check if names match (case insensitive, basic inclusion check or exact match)
      const predName = (pred.toolInfo.name || "").toLowerCase();
      const gtName = (activeGroundTruths[bestGtIndex].toolInfo.name || "").toLowerCase();
      if (predName === gtName || gtName.includes(predName) || predName.includes(gtName)) {
        correctNames++;
      }
    }
  }

  const falsePositives = activePredictions.length - truePositives;
  const falseNegatives = activeGroundTruths.length - truePositives;

  const precision = activePredictions.length > 0 ? truePositives / activePredictions.length : 0;
  const recall = activeGroundTruths.length > 0 ? truePositives / activeGroundTruths.length : 0;
  const averageIoU = truePositives > 0 ? totalIoU / truePositives : 0;
  const nameAccuracy = truePositives > 0 ? correctNames / truePositives : 0;

  return {precision, recall, averageIoU, nameAccuracy, truePositives, falsePositives, falseNegatives};
}

async function main() {
  console.log("Starting evaluation against ground truth...");

  if (!fs.existsSync(GROUND_TRUTH_FILE)) {
    console.error("No ground_truth.json found! Cannot evaluate.");
    return;
  }

  const groundTruthData: Record<string, Detection[]> = JSON.parse(fs.readFileSync(GROUND_TRUTH_FILE, "utf8"));

  let results: Record<string, any> = {};
  if (fs.existsSync(EVAL_RESULTS_FILE)) {
    results = JSON.parse(fs.readFileSync(EVAL_RESULTS_FILE, "utf8"));
  }

  const files = Object.keys(groundTruthData);

  const overallMetrics = {
    findMode: {precision: 0, recall: 0, avgIoU: 0, nameAcc: 0, count: 0},
    matchMode: {precision: 0, recall: 0, avgIoU: 0, nameAcc: 0, count: 0},
  };

  for (const file of files) {
    if (results[file] && results[file].completed) {
      console.log(`Skipping ${file}, already evaluated.`);
      updateOverallMetrics(overallMetrics, results[file]);
      continue;
    }

    console.log(`Evaluating ${file}...`);
    const filePath = path.join(IMAGES_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Image ${file} not found in images directory. Skipping.`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const mimeType = file.endsWith(".png") ? "image/png" : "image/jpeg";
    const base64Image = buffer.toString("base64");

    const gtDetections = groundTruthData[file];

    try {
      // 1. Find Mode (no expected tools)
      console.log("  Running Find Mode...");
      const findModePredictions = await analyzeToolImage(base64Image, mimeType, [], []);
      const findModeMetrics = matchDetections(findModePredictions, gtDetections);
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // 2. Match Mode (provide expected tools from ground truth)
      console.log("  Running Match Mode...");
      const expectedTools: Tool[] = gtDetections.map((gt, idx) => ({
        toolId: gt.toolId || `gt_${idx}`,
        drawerId: "drawer_eval",
        toolInfo: gt.toolInfo,
      }));
      const matchModePredictions = await analyzeToolImage(base64Image, mimeType, expectedTools, []);
      const matchModeMetrics = matchDetections(matchModePredictions, gtDetections);
      await new Promise((resolve) => setTimeout(resolve, 4000));

      results[file] = {
        completed: true,
        groundTruthCount: gtDetections.length,
        findMode: {
          predictionsCount: findModePredictions.length,
          metrics: findModeMetrics,
          predictions: findModePredictions
        },
        matchMode: {
          predictionsCount: matchModePredictions.length,
          metrics: matchModeMetrics,
          predictions: matchModePredictions
        },
      };

      updateOverallMetrics(overallMetrics, results[file]);

      fs.writeFileSync(EVAL_RESULTS_FILE, JSON.stringify(results, null, 2));
      console.log(`  Metrics for ${file}:`);
      console.log(`    Find:  Precision: ${(findModeMetrics.precision*100).toFixed(1)}%, Recall: ${(findModeMetrics.recall*100).toFixed(1)}%, IoU: ${(findModeMetrics.averageIoU).toFixed(2)}`);
      console.log(`    Match: Precision: ${(matchModeMetrics.precision*100).toFixed(1)}%, Recall: ${(matchModeMetrics.recall*100).toFixed(1)}%, IoU: ${(matchModeMetrics.averageIoU).toFixed(2)}`);
    } catch (error) {
      console.error(`Error evaluating ${file}:`, error);
      console.log("Stopping execution. Re-run script to continue from last successful image.");
      break;
    }
  }

  console.log("\n--- OVERALL EVALUATION RESULTS ---");
  printAggregate(overallMetrics.findMode, "FIND MODE");
  printAggregate(overallMetrics.matchMode, "MATCH MODE");
}

function updateOverallMetrics(overall: any, fileResult: any) {
  overall.findMode.precision += fileResult.findMode.metrics.precision;
  overall.findMode.recall += fileResult.findMode.metrics.recall;
  overall.findMode.avgIoU += fileResult.findMode.metrics.averageIoU;
  overall.findMode.nameAcc += fileResult.findMode.metrics.nameAccuracy;
  overall.findMode.count++;

  overall.matchMode.precision += fileResult.matchMode.metrics.precision;
  overall.matchMode.recall += fileResult.matchMode.metrics.recall;
  overall.matchMode.avgIoU += fileResult.matchMode.metrics.averageIoU;
  overall.matchMode.nameAcc += fileResult.matchMode.metrics.nameAccuracy;
  overall.matchMode.count++;
}

function printAggregate(metrics: any, title: string) {
  if (metrics.count === 0) return;
  console.log(`\n${title}:`);
  console.log(`  Average Precision: ${((metrics.precision / metrics.count) * 100).toFixed(2)}%`);
  console.log(`  Average Recall:    ${((metrics.recall / metrics.count) * 100).toFixed(2)}%`);
  console.log(`  Average IoU:       ${(metrics.avgIoU / metrics.count).toFixed(3)}`);
  console.log(`  Average Name Acc:  ${((metrics.nameAcc / metrics.count) * 100).toFixed(2)}%`);
}

if (require.main === module) {
  main().catch(console.error);
}
