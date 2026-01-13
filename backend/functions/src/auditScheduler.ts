import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {DocumentSnapshot} from "firebase-functions/firestore";
import {Checkout, ToolBox} from "@shared/types";
import {db} from "./firebase";
import {createDrawerStates, sendPushNotification} from "./utils";

/**
 * Creates and issues a new periodic audit for a given checkout.
 * Notifies the user upon creation.
 *
 * @param {DocumentSnapshot} checkoutDoc Firebase document for the checkout
 * @param {Date} now The current time
 */
async function issuePeriodicAudit(checkoutDoc: DocumentSnapshot, now: Date) {
  const checkout = checkoutDoc.data() as Checkout;

  await db.runTransaction(async (t) => {
    // 1. Fetch Toolbox to generate accurate drawer states
    const toolboxRef = db.collection("toolboxes").doc(checkout.toolboxId);
    const toolboxSnap = await t.get(toolboxRef);
    if (!toolboxSnap.exists) {
      throw new Error(`Toolbox ${checkout.toolboxId} not found`);
    }

    const toolbox = toolboxSnap.data() as ToolBox;

    // 2. Create new Audit Document
    const newAuditRef = db.collection("audits").doc();
    t.set(newAuditRef, {
      checkoutId: checkoutDoc.id,
      startTime: now,
      endTime: null,
      drawerStates: createDrawerStates(toolbox),
    });

    // Link new audit to checkout and set status to active
    t.update(checkoutDoc.ref, {
      currentAuditId: newAuditRef.id,
      auditStatus: "active",
    });

    // Link new audit to toolbox
    t.update(toolboxRef, {
      lastAuditId: newAuditRef.id,
    });
  });

  // 3. Notify User
  await sendPushNotification(
    checkout.userId,
    "Audit Required",
    `It is time for a periodic audit of ${checkout.toolboxName}.`
  );
}

/**
 * Finds checkouts that are due for a new periodic audit and issues them.
 *
 * @param {Date} now
 */
async function issuePeriodicAudits(now: Date) {
  // Query: Active checkouts, waiting for next audit, where time is up
  const dueQuery = db.collection("checkouts")
    .where("status", "==", "active")
    .where("auditStatus", "==", "complete")
    .where("nextAuditDue", "<=", now);

  const dueSnaps = await dueQuery.get();

  console.log(`[Issuer] Found ${dueSnaps.size} checkouts due for audit.`);

  const promises = dueSnaps.docs.map(async (checkoutDoc) => {
    try {
      await issuePeriodicAudit(checkoutDoc, now);

      console.log(`[Issuer] Issued audit for checkout ${checkoutDoc.id}`);
    } catch (e) {
      console.error(`[Issuer] Failed to issue audit for ${checkoutDoc.id}`, e);
    }
  });

  await Promise.all(promises);
}

/**
 * Marks a given checkout's audit as overdue and notifies the user.
 *
 * @param {DocumentSnapshot} checkoutDoc Firebase document for the checkout
 */
async function enforceOverdueAudit(checkoutDoc: DocumentSnapshot) {
  const checkout = checkoutDoc.data() as Checkout;

  await checkoutDoc.ref.update({
    auditStatus: "overdue",
  });

  await sendPushNotification(
    checkout.userId,
    "⚠️ Audit Overdue",
    `You are over the 1-hour grace period for ${checkout.toolboxName}.`
  );
}

/**
 * Finds audits that have been pending for >1 hour and marks them overdue.
 *
 * @param {Date} now The current time
 */
async function enforceOverdueAudits(now: Date) {
  // Grace Period: 1 hour
  const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));

  // Query: Checkouts that are currently 'active' (audit started/issued)
  // but the original due time was over 1 hour ago.
  const overdueQuery = db.collection("checkouts")
    .where("status", "==", "active")
    .where("auditStatus", "==", "active")
    .where("nextAuditDue", "<=", oneHourAgo);

  const overdueSnaps = await overdueQuery.get();

  console.log(`[Enforcer] Found ${overdueSnaps.size} checkouts overdue.`);

  const promises = overdueSnaps.docs.map(async (checkoutDoc) => {
    try {
      await enforceOverdueAudit(checkoutDoc);

      console.log(`[Enforcer] Marked checkout ${checkoutDoc.id} overdue.`);
    } catch (e) {
      console.error(`[Enforcer] Failed to mark ${checkoutDoc.id} overdue`, e);
    }
  });

  await Promise.all(promises);
}

export const auditScheduler = onSchedule(
  "every 5 minutes",
  async (event) => {
    const now = admin.firestore.Timestamp.now().toDate();

    console.log("Running Audit Scheduler...");

    await Promise.all([
      issuePeriodicAudits(now),
      enforceOverdueAudits(now),
    ]);

    console.log("Audit Scheduler finished.");
  },
);
