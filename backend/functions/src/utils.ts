import * as admin from "firebase-admin";
import {
  Drawer, ToolBox, AuditToolStatus, DrawerState,
} from "@shared/types";

const db = admin.firestore();
const messaging = admin.messaging();

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
