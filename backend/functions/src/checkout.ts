import {onCall, HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebase";
import {createDrawerStates} from "./utils";
import {Timestamp} from "firebase-admin/firestore";
import {Audit, Checkout, ToolBox, User} from "@shared/types";

/**
 * Checks out an available toolbox for the authenticated maintainer.
 * Depending on the toolbox's audit profile, this function may also automatically
 * create an on-checkout audit and schedule the next periodic audit.
 *
 * @param {string} toolboxId - The ID of the toolbox to check out.
 * @throws {HttpsError} - If user is unauthenticated, unauthorized, or validation fails.
 */
export const checkOutToolbox = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const userId = request.auth.uid;
  const {toolboxId} = request.data;
  if (!toolboxId) throw new HttpsError("invalid-argument", "ToolBox ID is required.");

  // Define document references
  const userRef = db.collection("users").doc(userId);
  const toolboxRef = db.collection("toolboxes").doc(toolboxId);
  const auditRef = db.collection("audits").doc();
  const checkoutRef = db.collection("checkouts").doc();

  await db.runTransaction(async (t) => {
    // 1. Fetch user and toolbox data
    const userSnap = await t.get(userRef);
    const toolboxSnap = await t.get(toolboxRef);

    if (!userSnap.exists || !toolboxSnap.exists) throw new HttpsError("not-found", "Data not found");

    const userData = userSnap.data();
    const toolboxData = toolboxSnap.data();

    if (!toolboxData || !userData) throw new HttpsError("data-loss", "Failed to get data");

    const user = userData as User;
    const orgId = user.organizationId;
    const toolbox = toolboxData as ToolBox;

    // 2. Validate toolbox state and user permissions
    if (toolbox.status !== "available") throw new HttpsError("failed-precondition", "Unavailable ToolBox");
    if (orgId !== toolbox.organizationId) throw new HttpsError("permission-denied", "Invalid Organization");
    if (user.role !== "maintainer") throw new HttpsError("permission-denied", "Invalid user role.");

    // 3. Determine audit scheduling and initial audit requirements
    const profile = toolbox.auditProfile;
    let initialAuditId = null;
    let auditStatus = "complete";
    let nextDue: Date | null = null;

    const now = Date.now();

    // Schedule next audit if periodic
    if (profile.shiftAuditType === "periodic") {
      nextDue = new Date(now + profile.periodicFrequencyHours * 3600 * 1000);
    }

    // Generate audit if required on checkout
    if (profile.requireOnCheckout) {
      initialAuditId = auditRef.id;
      auditStatus = "active";
      nextDue = new Date(now);

      t.set(auditRef, {
        toolboxId: toolboxId,
        checkoutId: checkoutRef.id,
        organizationId: user.organizationId,
        drawerStates: createDrawerStates(toolbox),
        startTime: new Date(now),
        endTime: null,
        trigger: "checkout",
      });
    }

    // 4. Create the checkout document
    t.set(checkoutRef, {
      userId: userId,
      toolboxId: toolboxId,
      checkoutTime: new Date(now),
      returnTime: null,
      status: "active",
      toolboxName: toolbox.name,
      auditProfile: profile,
      organizationId: user.organizationId,
      lastAuditTime: null,
      nextAuditDue: nextDue,
      currentAuditId: initialAuditId,
      auditStatus: auditStatus,
    });

    // 5. Update the toolbox document to reflect the checked-out state
    t.update(toolboxRef, {
      status: "checked-out",
      currentUserId: userId,
      currentCheckoutId: checkoutRef.id,
      ...(initialAuditId !== null && {lastAuditId: initialAuditId}),
    });
  });

  return {success: true};
});

/**
 * Returns a currently checked-out toolbox.
 *
 * This callable function enforces the following business rules:
 * 1. The toolbox must currently be checked out.
 * 2. Only the maintainer who checked it out can return it.
 * 3. All pending audits for the checkout session must be 'complete'.
 * 4. If an audit is required on return, it must have been completed within the last 15 minutes.
 *
 * @param {string} toolboxId - The ID of the toolbox to return.
 * @throws {HttpsError} - If validation fails or preconditions are not met.
 */
export const returnToolbox = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const userId = request.auth.uid;
  const {toolboxId} = request.data;
  if (!toolboxId) throw new HttpsError("invalid-argument", "ToolBox ID is required.");

  await db.runTransaction(async (t) => {
    // 1. Fetch the toolbox document
    const toolboxRef = db.collection("toolboxes").doc(toolboxId);
    const toolboxSnap = await t.get(toolboxRef);
    if (!toolboxSnap.exists) throw new HttpsError("not-found", "Invalid toolbox.");
    const toolbox = toolboxSnap.data() as ToolBox;

    const currentCheckoutId = toolbox.currentCheckoutId;
    if (!currentCheckoutId) throw new HttpsError("failed-precondition", "Toolbox is not checked out.");

    // 2. Fetch the corresponding checkout document
    const checkoutRef = db.collection("checkouts").doc(currentCheckoutId);
    const checkoutSnap = await t.get(checkoutRef);
    if (!checkoutSnap.exists) throw new HttpsError("not-found", "Invalid Checkout ID");
    const checkout = checkoutSnap.data() as Checkout;

    // 3. Validate checkout ownership and status
    if (checkout.userId !== userId) {
      throw new HttpsError("permission-denied", "You can only return toolboxes you checked out.");
    }

    if (checkout.auditStatus !== "complete") {
      throw new HttpsError("failed-precondition", "Audits must be completed before returning the toolbox.");
    }

    // 4. Enforce return audit requirements
    const profile = checkout.auditProfile;
    const now = Date.now();

    if (profile.requireOnReturn) {
      const lastAuditTime = checkout.lastAuditTime as any;
      if (!lastAuditTime) throw new HttpsError("failed-precondition", "Final audit required.");

      // Handle untyped snapshot data where dates might be Native Dates or Firestore Timestamps
      let lastAuditTimeMS: number;
      if (lastAuditTime instanceof Date) lastAuditTimeMS = lastAuditTime.getTime();
      else if (lastAuditTime instanceof Timestamp) lastAuditTimeMS = lastAuditTime.toDate().getTime();
      else throw new HttpsError("data-loss", "Invalid last audit time format.");

      const diffMinutes = (now - lastAuditTimeMS) / 60000;

      // Final audit must be within the last 15 minutes
      if (diffMinutes > 15) {
        throw new HttpsError(
          "failed-precondition",
          `Final audit required (Last check was ${Math.floor(diffMinutes)}m ago).`
        );
      }
    }

    // 5. Finalize the checkout session
    t.update(checkoutRef, {
      status: "complete",
      returnTime: new Date(now),
    });

    // 6. Reset the toolbox to an available state
    t.update(toolboxRef, {
      status: "available",
      currentUserId: null,
      currentCheckoutId: null,
    });
  });

  return {success: true};
});

/**
 * Completes an active audit session.
 *
 * This callable function executes within a Firestore transaction and:
 * 1. Sets the audit's `endTime` to `now`.
 * 2. Updates the parent `checkout` document
 * 3. Calculates and sets the rolling `nextAuditDue` scheduling timestamp
 *
 * @param {string} auditId - The ID of the audit to complete.
 * @throws {HttpsError} - If validation fails or preconditions are not met.
 */
export const completeAudit = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const {auditId} = request.data;
  if (!auditId) throw new HttpsError("invalid-argument", "Audit ID is required.");

  const userId = request.auth.uid;
  const userRef = db.collection("users").doc(userId);
  const auditRef = db.collection("audits").doc(auditId);

  await db.runTransaction(async (t) => {
    // 1. Fetch user data and audit data
    const userSnap = await t.get(userRef);
    const auditSnap = await t.get(auditRef);

    if (!userSnap.exists) throw new HttpsError("not-found", "User not found.");
    if (!auditSnap.exists) throw new HttpsError("not-found", "Audit not found.");

    const userData = userSnap.data() as User;
    const auditData = auditSnap.data() as Audit;

    // 2.1 Validate organization permissions
    if (userData.organizationId !== auditData.organizationId) {
      throw new HttpsError("permission-denied", "You do not have permission to access this audit.");
    }

    // 2.2 Validate checkout ID association
    const checkoutId = auditData.checkoutId;
    if (!checkoutId) {
      throw new HttpsError("failed-precondition", "Audit has no associated checkout session.");
    }

    // 2.3 Validate audit is not already completed
    if (auditData.endTime) {
      throw new HttpsError("failed-precondition", "Audit is already completed.");
    }

    // 3. Fetch parent checkout document
    const checkoutRef = db.collection("checkouts").doc(checkoutId);
    const checkoutSnap = await t.get(checkoutRef);
    if (!checkoutSnap.exists) {
      throw new HttpsError("not-found", "Associated checkout session not found.");
    }

    const checkoutData = checkoutSnap.data() as Checkout;

    const now = new Date();

    // 4. Update the audit's endTime to now
    t.update(auditRef, {
      endTime: now,
    });

    // 5. Determine next audit due time if periodic and update parent checkout
    const profile = checkoutData.auditProfile;
    let nextDue: Date | null = null;
    if (profile.shiftAuditType === "periodic") {
      nextDue = new Date(now.getTime() + profile.periodicFrequencyHours * 3600 * 1000);
    }

    // 6. Update the checkout document to reflect audit completion
    t.update(checkoutRef, {
      currentAuditId: null,
      auditStatus: "complete",
      lastAuditTime: now,
      nextAuditDue: nextDue,
    });
  });

  return {success: true};
});

/**
 * Ensures there is an active audit for the given toolbox checked out by the user.
 * If one already exists, its ID is returned. Otherwise, a new 'at-will' audit is created.
 *
 * @param {string} toolboxId - The ID of the toolbox.
 * @throws {HttpsError} - If user is unauthenticated, unauthorized, or validation fails.
 */
export const ensureActiveAudit = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const userId = request.auth.uid;
  const {toolboxId} = request.data;
  if (!toolboxId) throw new HttpsError("invalid-argument", "ToolBox ID is required.");

  const userRef = db.collection("users").doc(userId);
  const toolboxRef = db.collection("toolboxes").doc(toolboxId);
  const auditRef = db.collection("audits").doc();

  let auditId = "";

  await db.runTransaction(async (t) => {
    const userSnap = await t.get(userRef);
    const toolboxSnap = await t.get(toolboxRef);

    if (!userSnap.exists || !toolboxSnap.exists) {
      throw new HttpsError("not-found", "User or Toolbox not found.");
    }

    const user = userSnap.data() as User;
    const toolbox = toolboxSnap.data() as ToolBox;

    if (toolbox.organizationId !== user.organizationId) {
      throw new HttpsError("permission-denied", "Toolbox does not belong to your organization.");
    }

    if (toolbox.status !== "checked-out" || toolbox.currentUserId !== userId) {
      throw new HttpsError("failed-precondition", "You do not currently have this toolbox checked out.");
    }

    const currentCheckoutId = toolbox.currentCheckoutId;
    if (!currentCheckoutId) {
      throw new HttpsError("failed-precondition", "Toolbox does not have an active checkout.");
    }

    const checkoutRef = db.collection("checkouts").doc(currentCheckoutId);
    const checkoutSnap = await t.get(checkoutRef);
    if (!checkoutSnap.exists) {
      throw new HttpsError("not-found", "Checkout session not found.");
    }

    const checkout = checkoutSnap.data() as Checkout;

    // If an audit is already active, return its ID
    if (checkout.currentAuditId) {
      auditId = checkout.currentAuditId;
      return;
    }

    const now = new Date();
    auditId = auditRef.id;

    // Create a new "At-Will" audit
    t.set(auditRef, {
      checkoutId: currentCheckoutId,
      toolboxId: toolboxId,
      startTime: now,
      endTime: null,
      drawerStates: createDrawerStates(toolbox),
      organizationId: toolbox.organizationId,
      trigger: "at-will",
    });

    t.update(checkoutRef, {
      nextAuditDue: now,
      currentAuditId: auditId,
      auditStatus: "active",
    });

    t.update(toolboxRef, {
      lastAuditId: auditId,
    });
  });

  return {auditId};
});

/**
 * Discards the currently active 'at-will' audit if no images have been uploaded yet.
 *
 * @param {string} toolboxId - The ID of the toolbox.
 * @throws {HttpsError} - If user is unauthenticated, unauthorized, or validation fails.
 */
export const discardActiveAudit = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "User must be logged in.");

  const userId = request.auth.uid;
  const {toolboxId} = request.data;
  if (!toolboxId) throw new HttpsError("invalid-argument", "ToolBox ID is required.");

  const userRef = db.collection("users").doc(userId);
  const toolboxRef = db.collection("toolboxes").doc(toolboxId);

  // 1. Query for the most recent completed audit of this toolbox before transaction
  const prevAuditQuery = db.collection("audits")
    .where("toolboxId", "==", toolboxId)
    .where("endTime", "!=", null)
    .orderBy("endTime", "desc")
    .limit(1);

  const prevAuditSnap = await prevAuditQuery.get();
  const prevAuditId = prevAuditSnap.docs[0].id;

  await db.runTransaction(async (t) => {
    // 2. Load user, toolbox, checkout, and audit data
    const userSnap = await t.get(userRef);
    const toolboxSnap = await t.get(toolboxRef);

    if (!userSnap.exists || !toolboxSnap.exists) {
      throw new HttpsError("not-found", "User or Toolbox not found.");
    }

    const user = userSnap.data() as User;
    const toolbox = toolboxSnap.data() as ToolBox;

    if (toolbox.organizationId !== user.organizationId) {
      throw new HttpsError("permission-denied", "Toolbox does not belong to your organization.");
    }

    if (toolbox.status !== "checked-out" || toolbox.currentUserId !== userId) {
      throw new HttpsError("failed-precondition", "You do not currently have this toolbox checked out.");
    }

    const currentCheckoutId = toolbox.currentCheckoutId;
    if (!currentCheckoutId) {
      throw new HttpsError("failed-precondition", "Toolbox does not have an active checkout.");
    }

    const checkoutRef = db.collection("checkouts").doc(currentCheckoutId);
    const checkoutSnap = await t.get(checkoutRef);
    if (!checkoutSnap.exists) {
      throw new HttpsError("not-found", "Checkout session not found.");
    }

    const checkout = checkoutSnap.data() as Checkout;

    const currentAuditId = checkout.currentAuditId;
    if (!currentAuditId) {
      throw new HttpsError("failed-precondition", "No active audit found to discard.");
    }

    const auditRef = db.collection("audits").doc(currentAuditId);
    const auditSnap = await t.get(auditRef);
    if (!auditSnap.exists) {
      throw new HttpsError("not-found", "Active audit not found.");
    }

    const audit = auditSnap.data() as Audit;

    // 3. Enforce safety checks: must be 'at-will' and no images uploaded
    if (audit.trigger !== "at-will") {
      throw new HttpsError("failed-precondition", "Only 'at-will' audits can be discarded.");
    }

    const drawerStates = audit.drawerStates;
    const hasImages = Object.values(drawerStates).some((state) => state.imageUrl !== null);
    if (hasImages) {
      throw new HttpsError("failed-precondition", "Cannot discard an audit after images have been uploaded.");
    }

    // 4. Revert checkout and toolbox document to reflect audit discard
    const profile = checkout.auditProfile;
    let revertedNextDue: Date | null = null;
    if (profile.shiftAuditType === "periodic") {
      const baseTime = checkout.lastAuditTime ?
        (checkout.lastAuditTime instanceof Date ? checkout.lastAuditTime : (checkout.lastAuditTime as any).toDate()) :
        (checkout.checkoutTime instanceof Date ? checkout.checkoutTime : (checkout.checkoutTime as any).toDate());
      revertedNextDue = new Date(baseTime.getTime() + profile.periodicFrequencyHours * 3600 * 1000);
    }

    t.update(checkoutRef, {
      currentAuditId: null,
      auditStatus: "complete",
      nextAuditDue: revertedNextDue,
    });

    // 4. Revert toolbox lastAuditId
    t.update(toolboxRef, {
      lastAuditId: prevAuditId,
    });

    // 5. Delete the audit document
    t.delete(auditRef);
  });

  return {success: true};
});
