import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const createAdminAndOrganization = onCall(async (request) => {
  // Authenticate user
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  // Retrieve and validate input
  const db = admin.firestore();
  const {displayName, organizationName} = request.data;
  const uid = request.auth.uid;
  const email = request.auth.token.email;

  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }

  if (!organizationName || typeof organizationName !== "string" || organizationName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Organization name is required.");
  }

  // Create new organization
  const orgRef = db.collection("organizations").doc();
  await orgRef.set({name: organizationName});

  // Create user profile
  const userRef = db.collection("users").doc(uid);
  await userRef.set({
    email: email,
    displayName: displayName,
    organizationId: orgRef.id,
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    role: "admin",
  });

  return {success: true};
});

export const createMaintainer = onCall(async (request) => {
  // Authenticate user
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  // Retrieve and validate input
  const db = admin.firestore();
  const {displayName, organizationId} = request.data;
  const uid = request.auth.uid;
  const email = request.auth.token.email;

  if (!displayName || typeof displayName !== "string" || displayName.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Display name is required.");
  }

  if (!organizationId) {
    throw new HttpsError("invalid-argument", "Organization ID is required.");
  }

  const orgDoc = await db.collection("organizations").doc(organizationId).get();
  if (!orgDoc.exists) {
    throw new HttpsError("not-found", "Organization not found.");
  }

  // Create user profile
  const userRef = db.collection("users").doc(uid);
  await userRef.set({
    email: email,
    displayName: displayName,
    organizationId: organizationId,
    lastLogin: admin.firestore.FieldValue.serverTimestamp(),
    role: "maintainer",
  });

  return {success: true};
});
