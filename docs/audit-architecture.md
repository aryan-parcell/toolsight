# Toolsight: Audit System Architecture & Design Paradigm

## 1. High-Level Overview

Toolsight is an automated asset tracking and audit compliance system. It solves the "Chain of Custody" problem by enforcing audits at critical lifecycle events (Checkout/Return) and maintaining vigilance during shifts via automated periodic checks.

### Technology Stack

* **Mobile App:** Flutter (Maintainer Interface)
* **Web App:** React (Admin/Toolbox Management)
* **Backend:** Firebase (Firestore, Auth, Storage, Messaging)
* **Compute:** Firebase Cloud Functions (Node.js/TypeScript)
* **AI/Vision:** Google Gemini 2.5 Flash (via Cloud Functions)

## 2. Core Philosophy: The "Sandwich Lifecycle"

The system is designed around a strict lifecycle for every tool checkout session. This ensures tools are accounted for before, during, and after use.

1. **The Top Bun (Checkout):**
    * **Trigger:** User checks out a Toolbox
    * **Logic:** System validates availability and creates a `Checkout` session.
    * **Rule:** If `requireOnCheckout` is enabled, an initial audit is issued.

2. **The Meat (The Shift):**
    * **Modes:** Defined by `AuditProfile`.
        * **`at-will`:** User can perform voluntary audits at any time.
        * **`periodic`:** System forces an audit every  hours (e.g., 4 hours).
    * **Automation:** A "Watchdog" scheduler monitors active checkouts, flags overdue items, and issues periodic audits. 

3. **The Bottom Bun (Return):**
    * **Trigger:** User attempts to "Close Toolbox".
    * **Blocking Rule:** Return is **rejected** if:
        * An audit is currently active.
        * `requireOnReturn` is True **AND** the last audit was >15 minutes ago.


### The Audit Scheduling Paradigm

We strictly enforce a **"Checkpoint Restart"** strategy for periodic audits. This ensures compliance without punishing maintainers for schedule drift.

* **Concept:** The countdown for the *next* audit begins only when the *current* audit is successfully completed.
* **Example:**
    * **Config:** 4-hour periodic interval.
    * **Scenario:** Audit #1 is due at 12:00 PM. The user is busy and completes it at 12:30 PM.
    * **Result:** Audit #2 is scheduled for 4:30 PM (12:30 + 4h), *not* 4:00 PM.
* **Benefit:** This prevents "audit stacking" where a user might be forced to do two audits back-to-back if they fall behind schedule.

### Lifecycle & Enforcement

Compliance is enforced by a server-side Cloud Function (`auditScheduler.ts`) running every 5 minutes.

| State | Trigger | Description |
| --- | --- | --- |
| **Active (Issued)** | `nextAuditDue <= Now` | The system (or user) creates an audit. `auditStatus` becomes `'active'`. Notification sent. |
| **Grace Period** | `Issued + 1 Hour` | The user has 1 hour from the "Issue Time" (`nextAuditDue`) to complete the audit. |
| **Overdue** | `Now > Issued + 1 Hour` | If still `'active'`, the backend marks `auditStatus` as `'overdue'`. A notification is sent to the user. |
| **Complete** | User Action | User completes audit. `lastAuditTime` updated to Now. If using periodic audits, `nextAuditDue` calculated (Now + Period). |

### Types of Audits

1. **On Checkout:** Immediate mandatory audit when opening a toolbox. 
2. **Periodic:** Recurring audit based on the toolbox's `auditProfile` (e.g., every 4 hours).
3. **At Will:** User manually triggers an audit (e.g., for peace of mind).
4. **On Return:** (Optional) Mandatory audit before closing the checkout session.

## 3. Data Architecture (Schema)

### A. Toolbox (`toolboxes/{id}`)

*Defines the physical asset and its rules.*

* **`status`:** `available` | `checked_out` | `maintenance`.
* **`currentCheckoutId`:** Pointer to the active session (null if available).
* **`lastAuditId:`** Pointer to the most recent audit for a toolbox (can be active or completed)
* **`auditProfile`:** Configuration object defining the rules of engagement.
    * `requireOnCheckout` (bool)
    * `requireOnReturn` (bool)
    * `shiftAuditType` ('periodic' | 'at-will')
    * `periodicFrequencyHours` (number)

### B. Checkout (`checkouts/{id}`)

*Represents a user's session with a toolbox.*

* **`auditStatus`:** `active` | `complete` | `overdue`.
* **`nextAuditDue`:** Timestamp used by the Watchdog to trigger alerts. Corresponds to audit issue time (either previous or next).
* **`currentAuditId`:** Pointer to the *single* open audit. If `null`, user is compliant.

### C. Audit (`audits/{id}`)

*A specific instance of checking tools.*

* **`drawerStates`:** A map tracking the progress of each drawer.
* `drawerStatus`: `pending`  `ai-completed`  `user-validated`.
* `visualResults`: Stores bounding boxes (`x,y` %) for UI overlay.
* `results`: The "Source of Truth" inventory status (`present` | `absent` | `unserviceable`).

---

## 4. The AI Pipeline (RAG Implementation)

We use **Retrieval-Augmented Generation (RAG)** to ensure high accuracy. We do not ask the AI "What do you see?"; we ask "Do you see *these specific tools*?".

### The 5-Step Pipeline

1. **Capture (Mobile):**
    * User takes a photo.
    * App normalizes orientation (forces landscape) and uploads to `audits/{auditId}/{drawerId}.jpg`.

2. **Trigger (Cloud Function):**
    * `aiAuditer` listens for storage uploads.
    * **Context Fetching:** Function reads `toolboxId`  downloads the `tools` list for that specific drawer.

3. **Analysis (Gemini):**
    * System constructs a prompt containing the list of expected tools (IDs and Names).
    * **Prompt Instruction:** The AI is instructed to return bounding boxes (0-100% relative coordinates) and statuses (`present`, `absent`, `unserviceable`).
    * **Coordinates:** Returns 0-100% relative coordinates for universal device support.

4. **Mapping:**
    * Function fuzzy-matches AI detections back to Database Tool IDs.
    * **Visuals:** Saves bounding boxes to `visualResults`.
    * **Logic:** Saves status (`present`/`absent`/`unserviceable`) to `results`.

5. **Visualization (Mobile):**
    * Mobile app listens to Firestore stream.
    * Overlays green bounding boxes on the image using the `%` coordinates.
    * User reviews and confirms.

---

## 5. Automation & Compliance (The Watchdog)

To handle "offline" compliance (e.g., user sleeps or closes app), we rely on server-side automation.

### The Scheduler (`issuePeriodicAudits`)

* **Query:** Finds `active` checkouts where `nextAuditDue <= Now` and `auditStatus == complete`
* **Action:**
    1. **Transaction:** Locks the checkout to prevent race conditions.
    2. **Hydration:** Fetches the toolbox definition and creates a full Audit document with all drawers set to `pending`.
    3. **Alert:** Updates Checkout `auditStatus` to `active`.
    4. **Notify:** Sends FCM Push Notification ("Audit Required").

### The Enforcer (`enforceOverdueAudits`)

* **Query:** Finds `active` checkouts where `nextAuditDue <= [one hour ago]` and `auditStatus == active`
* **Grace Period:** Checks for audits that have been "active" for  hour.
* **Action:** Marks `auditStatus` as `overdue` (turns UI Red) and sends FCM Push Notification.

---

## 6. Client-Side Workflows (Flutter)

### JIT (Just-In-Time) Audit Creation

The app creates audit documents lazily to support "At-Will" behavior.

* **Action:** User clicks "Capture Drawer Images".
* **Logic:**
    * If `currentAuditId` exists, open that audit.
    * If `null`, create a new Audit doc, link it to Checkout and Toolbox, *then* open it.
    * **Critical:** Sets `nextAuditDue` to `DateTime.now()`. This ensures that the 1-hour grace period from the backend enforcer has started ticking. 

### The Rolling Schedule

* **Trigger:** User clicks "Confirm Results" on the final drawer.
* **Logic:**
    * App checks `AuditProfile`.
    * If `periodic`, calculates `NewDue = Now + Frequency`.
    * Updates `nextAuditDue` on the Checkout.

### Return Blocking

* **Trigger:** User clicks "Close Toolbox".
* **Checks:**
    1. Is `auditStatus` == `complete`? (Is the current audit finished?)
    2. Is `requireOnReturn` == `true`?
        * If Yes: Is `Now - lastAuditTime < 15 mins`?
        * If No: Throw error "Final audit required.".

### User Session Sync

* **Trigger:** Successful Login.
* **Action:** App syncs the current user's profile and, crucially, the FCM Token to users/{uid} in Firestore to ensure notifications can be delivered.
