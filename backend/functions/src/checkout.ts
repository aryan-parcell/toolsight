import {onCall, HttpsError} from "firebase-functions/v2/https";
import {db} from "./firebase";
import {createDrawerStates} from "./utils";
import {Timestamp} from "firebase-admin/firestore";
import {Checkout, ToolBox, User} from "@shared/types";

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
