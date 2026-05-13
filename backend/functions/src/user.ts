import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {Invitation, Organization, User} from "@shared/types";

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

export const inviteMaintainers = onCall(async (request) => {
  // Authenticate user
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const db = admin.firestore();
  const uid = request.auth.uid;

  // Get the calling user and verify they are an admin
  const callerDoc = await db.collection("users").doc(uid).get();
  if (!callerDoc.exists) throw new HttpsError("permission-denied", "User not found.");

  const callerData = callerDoc.data();
  if (!callerData) throw new HttpsError("permission-denied", "User data not found.");

  const callerUser = callerData as User;
  if (callerUser.role !== "admin") throw new HttpsError("permission-denied", "Only admins can invite maintainers.");

  const orgId = callerUser.organizationId;
  const emails = request.data.emails;
  if (!Array.isArray(emails)) throw new HttpsError("invalid-argument", "emails must be an array.");

  const results = [];

  for (const emailRaw of emails) {
    if (!emailRaw || typeof emailRaw !== "string") {
      results.push({email: emailRaw || "unknown", success: false, error: "Invalid email"});
      continue;
    }

    const email = emailRaw.toLowerCase().trim();

    try {
      // Check if user is already registered in the users collection
      const userSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      if (!userSnapshot.empty) {
        results.push({email, success: false, error: "Already registered."});
        continue;
      }

      // Check if invitation already exists for this exact email and orgId
      const inviteSnapshot = await db.collection("invitations")
        .where("email", "==", email)
        .where("organizationId", "==", orgId)
        .limit(1)
        .get();

      if (!inviteSnapshot.empty) {
        results.push({email, success: false, error: "Already invited to this organization."});
        continue;
      }

      // Write a new document to the invitations collection
      await db.collection("invitations").add({
        email: email,
        organizationId: orgId,
      });

      results.push({email, success: true});
    } catch (error: any) {
      results.push({email, success: false, error: error.message});
    }
  }

  return {results};
});

export const registerMaintainer = onCall(async (request) => {
  const {email: rawEmail, name, password, organizationId} = request.data;

  if (!rawEmail || !name || !password) {
    throw new HttpsError("invalid-argument", "Email, name, and password are required.");
  }

  const lowerEmail = rawEmail.toLowerCase().trim();
  const db = admin.firestore();

  // Query invitations collection for the provided email
  const inviteSnapshot = await db.collection("invitations").where("email", "==", lowerEmail).get();

  if (inviteSnapshot.empty) {
    throw new HttpsError("permission-denied", "You have not been invited to join ToolSight.");
  }

  const invitations = inviteSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data() as Invitation}));

  let selectedOrgId: string;

  if (invitations.length > 1 && !organizationId) {
    // If > 1 found and orgId is NOT provided: Return a custom response indicating multiple organizations are available
    const organizations = [];
    for (const invite of invitations) {
      const orgDoc = await db.collection("organizations").doc(invite.organizationId).get();
      if (orgDoc.exists) {
        const orgData = orgDoc.data() as Organization;
        organizations.push({id: orgDoc.id, name: orgData.name});
      }
    }

    return {
      success: false,
      requiresSelection: true,
      organizations,
    };
  } else if (invitations.length > 1 && organizationId) {
    // If > 1 found and orgId IS provided matching an invite
    const matchingInvite = invitations.find((inv) => inv.organizationId === organizationId);
    if (!matchingInvite) throw new HttpsError("invalid-argument", "Invalid organization selected.");

    selectedOrgId = organizationId;
  } else {
    // If exactly 1 found
    selectedOrgId = invitations[0].organizationId;
  }

  try {
    // Create the user in Firebase Auth via Admin SDK using the provided password
    const userRecord = await admin.auth().createUser({
      email: lowerEmail,
      displayName: name,
      password: password,
    });

    // Create the users/{uid} document with role: 'maintainer' and the resolved organizationId
    await db.collection("users").doc(userRecord.uid).set({
      email: lowerEmail,
      displayName: name,
      organizationId: selectedOrgId,
      role: "maintainer",
    });

    // Delete all pending invitations for this email from the invitations collection to clean up
    const batch = db.batch();
    invitations.forEach((invite) => {
      batch.delete(db.collection("invitations").doc(invite.id));
    });
    await batch.commit();

    return {success: true};
  } catch (error: any) {
    throw new HttpsError("internal", error.message || "Failed to register maintainer.");
  }
});
