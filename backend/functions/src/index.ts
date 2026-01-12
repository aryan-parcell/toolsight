/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

/**
 * HTTP function example
 *
 * export const helloWorld = onRequest((request, response) => {
 *  logger.info("Hello logs!", {structuredData: true});
 *  response.send("Hello from Firebase!");
 * });
 *
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onObjectFinalized} from "firebase-functions/v2/storage";
import * as admin from "firebase-admin";
import {getStorage} from "firebase-admin/storage";
import * as path from "path";
import {analyzeToolImage} from "./gemini";
import {
  AuditToolStatus, Detection, Tool, ToolBox, VisualDetection,
} from "@shared/types";

// For cost control, you can set the maximum number of containers that can be
// running at the same time
setGlobalOptions({maxInstances: 10});

admin.initializeApp();
const db = admin.firestore();

/**
 * Finds the best matching AI detection for a given expected tool.
 *
 * @param {Tool} tool Expected tool definition
 * @param {Detection[]} detections AI-detected tools
 * @return {Detection | undefined} Matching detection or undefined if none found
 */
function findMatchingDetection(
  tool: Tool,
  detections: Detection[]
): Detection | undefined {
  // 1. Prefer ID match (High Confidence)
  const idMatch = detections.find((d) => d.toolId === tool.toolId);
  if (idMatch) return idMatch;

  // 2. Fallback to Name fuzzy match
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = normalize(tool.toolName);

  return detections.find((d) => {
    const candidate = normalize(d.name || "");
    return candidate.includes(target) || target.includes(candidate);
  });
}

export const onDrawerImageUpload = onObjectFinalized(async (event) => {
  const fileBucket = event.data.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType || "image/jpeg";

  // 1. Only process images in the 'audits' folder
  if (!filePath || !filePath.startsWith("audits/")) {
    return console.log("Skipping.");
  }

  // 2. File path structure validation (audits/{auditId}/{drawerId}.jpg)
  const segments = filePath.split("/");
  if (segments.length !== 3) return console.log("Invalid path.");

  // 3. Extract IDs from file path
  const auditId = segments[1];
  const drawerId = path.parse(filePath).name; // Remove file extension

  try {
    // 4. Fetch context from FirestoreDB (The "RAG" Step)
    const auditSnap = await db.collection("audits").doc(auditId).get();
    if (!auditSnap.exists) throw new Error("Audit not found");
    const checkoutId = auditSnap.data()?.checkoutId;

    const checkoutSnap = await db.collection("checkouts").doc(checkoutId).get();
    if (!checkoutSnap.exists) throw new Error("Checkout not found");
    const toolboxId = checkoutSnap.data()?.toolboxId;

    const toolboxSnap = await db.collection("toolboxes").doc(toolboxId).get();
    if (!toolboxSnap.exists) throw new Error("Toolbox not found");

    // 5. Filter to get tools for this specific drawer
    const toolboxData: ToolBox = toolboxSnap.data() as ToolBox;
    const allTools = toolboxData.tools || [];
    const drawerTools = allTools.filter((t) => t.drawerId === drawerId);

    // 6. Drawer tool validation
    if (drawerTools.length === 0) {
      return console.log("No tools defined for drawer. Aborting AI.");
    }

    // 7. Download image
    const file = getStorage().bucket(fileBucket).file(filePath);
    const [fileBuffer] = await file.download();
    const base64Image = fileBuffer.toString("base64");

    // 8. Run AI Analysis
    const aiRawDetections = await analyzeToolImage(
      base64Image,
      contentType,
      drawerTools
    );

    // 9. Merge & Map (The "Truth" Generation)
    const auditResults: Record<string, AuditToolStatus> = {};
    const visualDetections: Record<string, VisualDetection> = {};

    // Loop through EXPECTED tools (The Source of Truth)
    drawerTools.forEach((tool) => {
      const match = findMatchingDetection(tool, aiRawDetections);

      if (match) {
        // Invalid status --> Default to absent
        if (!["present", "absent", "unserviceable"].includes(match.status)) {
          match.status = "absent";
        }

        // Save audit results
        auditResults[tool.toolId] = match.status;

        // Save bounding box for UI
        visualDetections[tool.toolId] = {
          name: tool.toolName,
          confidence: match.confidence,
          boundingBox: {
            x: match.x,
            y: match.y,
            width: match.width,
            height: match.height,
          },
        };
      } else {
        // AI missed it --> Default to absent
        auditResults[tool.toolId] = "absent";
      }
    });

    // 10. Update Firestore with results
    await db.collection("audits").doc(auditId).update({
      [`drawerStates.${drawerId}.drawerStatus`]: "ai-completed",
      [`drawerStates.${drawerId}.results`]: auditResults,
      [`drawerStates.${drawerId}.visualResults`]: visualDetections,
    });
  } catch (error) {
    console.error("Pipeline Failed:", error);
    await db.collection("audits").doc(auditId).update({
      [`drawerStates.${drawerId}.status`]: "ai-failed",
    });
  }
});
