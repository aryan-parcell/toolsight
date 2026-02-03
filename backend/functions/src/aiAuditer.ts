import {onObjectFinalized} from "firebase-functions/v2/storage";
import {getStorage} from "firebase-admin/storage";
import * as path from "path";
import {AuditToolStatus, ToolBox, VisualDetection} from "@shared/types";
import {db} from "./firebase";
import {analyzeToolImage} from "./gemini";
import {findMatchingDetection} from "./utils";

export const aiAuditer = onObjectFinalized(async (event) => {
  // 1. Extract file metadata
  const fileBucket = event.data.bucket;
  const filePath = event.data.name;
  const contentType = event.data.contentType || "image/jpeg";
  if (!filePath) return;

  // 2. File path structure validation
  // (organizations/{orgId}/audits/{auditId}/{drawerId}.jpg)
  const segments = filePath.split("/");
  const isAuditImage =
    segments.length === 5 &&
    segments[0] === "organizations" &&
    segments[2] === "audits";
  if (!isAuditImage) return console.log("Skipping.");

  // 3. Extract IDs from file path
  const auditId = segments[3];
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
      [`drawerStates.${drawerId}.drawerStatus`]: "ai-failed",
    });
  }
});
