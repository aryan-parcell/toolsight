import * as admin from "firebase-admin";
import {
  Tool, Drawer, ToolBox, AuditToolStatus, DrawerState, Detection,
} from "@shared/types";

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Finds the best matching AI detection for a given expected tool.
 *
 * @param {Tool} tool Expected tool definition
 * @param {Detection[]} detections AI-detected tools
 * @return {Detection | undefined} Matching detection or undefined if none found
 */
export function findMatchingDetection(
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

/**
 * Creates initial drawer states for a new audit based on the toolbox.
 *
 * Replicates mobile app's createAuditDrawerStatesFromToolbox
 * Similar to web app's createInitialAuditFromToolbox
 *
 * @param {ToolBox} toolbox The toolbox to create an audit for
 * @return {Record<string, DrawerState>} The initial audit drawer states
 */
export function createDrawerStates(
  toolbox: ToolBox,
): Record<string, DrawerState> {
  const drawerStates: Record<string, DrawerState> = {};

  toolbox.drawers.forEach((drawer: Drawer) => {
    const results: Record<string, AuditToolStatus> = {};

    // Find all tools belonging to this drawer
    const drawerTools = toolbox.tools.filter(
      (t) => t.drawerId === drawer.drawerId
    );

    drawerTools.forEach((t) => {
      results[t.toolId] = "absent";
    });

    drawerStates[drawer.drawerId] = {
      drawerStatus: "pending",
      imageStoragePath: null,
      results: results,
    };
  });

  return drawerStates;
}

/** Sends a push notification to a user via FCM.
 *
 * @param {string} userId The ID of the user to notify
 * @param {string} title The notification title
 * @param {string} body The notification body
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
) {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    const token = userDoc.data()?.fcmToken;

    if (!token) {
      console.log(`No token found for user ${userId}`);
      return;
    }

    await messaging.send({
      token: token,
      notification: {
        title: title,
        body: body,
      },
      // data: {
      //   click_action: "FLUTTER_NOTIFICATION_CLICK",
      // }
    });
  } catch (error) {
    console.error(`Failed to send notification to ${userId}`, error);
  }
}
