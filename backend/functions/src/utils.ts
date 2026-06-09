import {Tool, Drawer, ToolBox, DrawerState, Detection, User, Checkout, Audit, Template} from "@shared/types";
import {db, messaging} from "./firebase";
import {DocumentReference, Transaction} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";

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
  const target = normalize(tool.toolInfo.name);

  return detections.find((d) => {
    const candidate = normalize(d.toolInfo.name);
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
    const results: Record<string, Detection> = {};

    // Find all tools belonging to this drawer
    const drawerTools = toolbox.tools.filter(
      (t) => t.drawerId === drawer.drawerId
    );

    drawerTools.forEach((t) => {
      results[t.toolId] = {
        toolId: t.toolId,
        status: "absent",
        confidence: "low",
        toolInfo: t.toolInfo,
      };
    });

    drawerStates[drawer.drawerId] = {
      drawerStatus: "pending",
      imageUrl: null,
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
      android: {
        priority: "high",
        notification: {
          channelId: "toolsight_mobile_notifs",
          priority: "max",
          defaultSound: true,
          visibility: "public",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(`Failed to send notification to ${userId}`, error);
  }
}

export const getToolBox = async (
  t: Transaction,
  toolboxId: string
): Promise<{toolboxRef: DocumentReference; toolbox: ToolBox}> => {
  const toolboxRef = db.collection("toolboxes").doc(toolboxId);
  const snap = await t.get(toolboxRef);
  if (!snap.exists) throw new HttpsError("not-found", "ToolBox not found");
  const data = snap.data();
  if (!data) throw new HttpsError("data-loss", "Failed to get toolbox data");
  return {toolboxRef, toolbox: data as ToolBox};
};

export const getUser = async (
  t: Transaction,
  userId: string
): Promise<{userRef: DocumentReference; user: User}> => {
  const userRef = db.collection("users").doc(userId);
  const snap = await t.get(userRef);
  if (!snap.exists) throw new HttpsError("not-found", "User not found");
  const data = snap.data();
  if (!data) throw new HttpsError("data-loss", "Failed to get user data");
  return {userRef, user: data as User};
};

export const getCheckout = async (
  t: Transaction,
  checkoutId: string
): Promise<{checkoutRef: DocumentReference; checkout: Checkout}> => {
  const checkoutRef = db.collection("checkouts").doc(checkoutId);
  const snap = await t.get(checkoutRef);
  if (!snap.exists) throw new HttpsError("not-found", "Checkout session not found");
  const data = snap.data();
  if (!data) throw new HttpsError("data-loss", "Failed to get checkout data");
  return {checkoutRef, checkout: data as Checkout};
};

export const getAudit = async (
  t: Transaction,
  auditId: string
): Promise<{auditRef: DocumentReference; audit: Audit}> => {
  const auditRef = db.collection("audits").doc(auditId);
  const snap = await t.get(auditRef);
  if (!snap.exists) throw new HttpsError("not-found", "Audit not found");
  const data = snap.data();
  if (!data) throw new HttpsError("data-loss", "Failed to get audit data");
  return {auditRef, audit: data as Audit};
};

export const getTemplate = async (
  t: Transaction,
  templateId: string
): Promise<{templateRef: DocumentReference; template: Template}> => {
  const templateRef = db.collection("templates").doc(templateId);
  const snap = await t.get(templateRef);
  if (!snap.exists) throw new HttpsError("not-found", "Template not found");
  const data = snap.data();
  if (!data) throw new HttpsError("data-loss", "Failed to get template data");
  return {templateRef, template: data as Template};
};
