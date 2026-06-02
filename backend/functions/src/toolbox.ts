import {onCall, HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebase";

/**
 * Checks if a toolbox with the given EID (document ID) already exists globally.
 * This is used as a pre-flight validation on toolbox creation to bypass multi-tenancy
 * security rules that would block a tenant from reading another tenant's toolbox directly.
 */
export const checkToolboxExists = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {toolboxId} = request.data;
  if (!toolboxId || typeof toolboxId !== "string") {
    throw new HttpsError("invalid-argument", "Toolbox ID (EID) is required.");
  }

  try {
    const docRef = db.collection("toolboxes").doc(toolboxId);
    const docSnap = await docRef.get();
    return {exists: docSnap.exists};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error checking toolbox existence:", error);
    throw new HttpsError("internal", message || "Failed to check toolbox existence.");
  }
});
