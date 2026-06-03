# ToolSight System Handover & Engineering Deep-Dive

This document compiles the comprehensive architectural designs, operational policies, development workflows, and institutional knowledge of ToolSight. It is optimized for easy ingestion by future maintainers, incoming developers, and AI coding agents.

---

## 1. Project Overview & Boundaries

ToolSight is a visual asset tracking, custody tracking, and audit compliance system built for the United States Air Force aircraft maintenance community and potential commercial aviation/industrial clients. It solves the critical flight line "Chain of Custody" problem by enforcing audits at key custody transitions and tracking active sessions.

### Multi-Tenant Model & Membership
*   **Tenant Isolation**: All user accounts, toolboxes, templates, and storage folders are scoped strictly to an **Organization** (`organizationId`). 
*   **Single-Tenant Accounts**: A user belongs to exactly one Organization. There is no multi-org membership model. If a user (e.g., a contractor) needs to audit toolboxes in multiple organizations, they must register separate accounts using distinct email addresses.
*   **Invitation Deletion**: Upon a Maintainer's successful registration, the backend permanently deletes **all** pending invitations associated with that email across all organizations. This enforces complete system cleanliness and ensures single-tenancy.

---

## 2. The Core Checkout & Audit Lifecycle

We enforce a strict "Sandwich Lifecycle" around the custody of physical toolboxes:

```
[ Checkout Begins ] ──► (If requireOnCheckout) ──► Mandate Checkout Audit
        │
        ▼
[   The Shift     ] ──► (If periodic) ──► Schedule Periodic Audits (Checkpoint Restart)
        │
        ▼
[ Toolbox Return  ] ──► (If requireOnReturn) ──► Mandate Audit within last 15 minutes
```

### Critical Enforcement Parameters
*   **Checkpoint Restart**: The countdown for the next scheduled periodic audit begins only when the *current* active audit is successfully completed (e.g., `Now + periodicFrequencyHours`), rather than starting from its original due time. This prevents "audit stacking" where a delayed maintainer is forced to complete multiple overdue audits back-to-back.
*   **1-Hour Grace Period**: When an audit is issued, the status is `'active'`. The Maintainer has a globally hardcoded **1-hour grace period** to complete the audit. If they fail to do so, the Watchdog marks the checkout status as `'overdue'`, turning the UI red and warning admins and users.
*   **15-Minute Return Threshold**: If `requireOnReturn` is enabled, a maintainer cannot close a checkout session unless they successfully completed an audit within the **15 minutes immediately preceding the return**, capturing a perfect physical snapshot of the toolbox at the exact moment custody is relinquished.
*   **No Auto-Timeouts**: Currently, there are no automatic timeouts. A maintainer can keep a toolbox checked out indefinitely.
*   **No Admin Force-Close**: Currently, Admins cannot force-close or override an active checkout/audit from the Web App. If a maintainer goes home with an open checkout, they must manually sign back in to close it, or the admin must modify the document directly in the Firestore Console. *This represents an important future feature request.*

---

## 3. The AI Visual RAG Pipeline

ToolSight utilizes a validated, schema-enforced, multimodal vision pipeline using **Google Gemini 3.1 Flash-Lite** (with optional upgrade to full 3.1 Flash) via the Google Gen AI SDK.

### Gemini Pipeline Modes
*   **Find Mode**: Used when creating a template or auditing a drawer with no template assigned. The AI scans the image, detects all distinct tools, outlines them, and generates an initial master layout.
*   **Match Mode**: Used when a Reference Template is provided. The AI accepts the Target Audit Image (Image 1) and the Reference Template Image (Image 2) and uses the template's bounding boxes to verify whether the expected tools are present or absent.

### Prompting & Attention Alignment
*   **Attention Anchor**: Image 1 is explicitly passed as the Target Audit Image, and Image 2 is the Reference Template. This order prevents the model from copy-pasting coordinates from the template photo, anchoring the coordinate generation strictly on the audit photo's real-world distance and rotation.
*   **Visual Invariance**: Explicit guidelines prompt the AI not to expect pixel alignment (as photos are shot in varying angles, shifts, or lighting).
*   **Coordinate System (1000-Scale Grid)**: Coordinates are fed to and returned from Gemini on a $0$-$1000$ coordinate grid (aligned with Gemini's native pre-training). The backend converts existing database percentages ($0$-$100$) to 1000-scale coordinates for the prompt, and automatically normalizes the returned $0$-$1000$ values back to the $0$-$100$ percentage scale for the UI overlays.
*   **Hallucination Prevention**: The expected tool list restricts Gemini's JSON schema output using dynamic enums. Gemini *cannot* output non-existent tool names or invalid IDs.
*   **Qualitative Confidence**: Rather than float probabilities (which are poorly calibrated in LLMs), the AI returns discrete confidence labels: `high`, `medium`, or `low`.
*   **Foreign Object Debris (FOD)**: Unexpected/foreign objects are intentionally ignored by the pipeline to keep the audit clean and actionable.

### User Validation & Confirmation
*   **Locked Coordinates**: Maintainers reviewing results in the mobile app can only confirm or toggle the present/absent state of each tool. They **cannot** adjust bounding box coordinates.
*   **Template Builder Control**: Editing bounding box coordinates is exclusive to Admins inside the Web App's Template Builder.
*   **Fail-Safe Default**: If the Gemini pipeline fails (`ai-failed`), all tools default to `absent`, and the Maintainer must manually toggle them all to `present` during User Validation.

---

## 4. Client vs. Server Data Execution Boundary

To ensure the security, consistency, and performance of ToolSight, the data boundary split is defined by a strict architectural policy:

### A. Client-Side (Direct Firestore SDK)
*   **Reads and Real-Time Streams**: Both mobile and web clients read and subscribe to real-time database streams directly using the Firebase SDK. This leverages Firestore's native caching, offline capability, and instant real-time sync.
*   **Simple Single-Document Writes**: Direct single-document mutations (such as updating metadata or a maintainer toggling a tool's `present`/`absent` state) are executed client-side. They are tightly restricted from privilege escalation or unauthorized access by Firestore Security Rules.

### B. Server-Side (Cloud Functions)
Mutations and logic must run server-side inside secure Firebase Cloud Functions if they require:
*   **Multi-Document Transactions**: Multi-document atomic writes across multiple collections (e.g. `checkOutToolbox`, `returnToolbox`, `assignTemplateToDrawer`) to prevent partial database failures.
*   **Third-Party API Integrations**: Webhooks or calls requiring private access keys (e.g., Stripe Payments, Gemini AI Vision pipeline).
*   **Sensitive Administrative Operations**: Creating organization admin accounts, inviting maintainers, and handling new registrations.
*   **Automated Schedulers**: Automated background checks (e.g., the 5-minute Watchdog scheduler).

---

## 5. Security & Billing Infrastructure

### The Database-Enforced Paywall
Subscription paywall enforcement is entirely handled at the Firestore and Firebase Storage layer using native **Firebase Security Rules**.

*   **Helper Function**: `hasActiveOrgAccess(docData)` checks that:
    1.  The user is logged in.
    2.  The target document's `organizationId` matches the user's `organizationId`.
    3.  The parent organization's `subscriptionStatus` is `'active'`.
*   **Automatic Lockdown**: If an organization's subscription status lapses or becomes inactive, all document reads/writes and Storage uploads/downloads are instantly blocked by Firestore. No application-level or Cloud Function logic is needed to duplicate this subscription check.
*   **Privilege Escalation Protection**: Users are blocked from writing or changing their own `role` or `organizationId` directly in Firestore. All roles and memberships are restricted via Firestore Rules, allowing modifications only via verified backend admin actions or Cloud Functions.

### Billing Pricing Structure
*   **Model**: Tentatively configured as a recurring monthly subscription set at **$25/month** per organization, subject to change in the future.

---

## 6. Secret Management & Configuration

*   **API Keys Location**: All keys are stored in local `.env` files.
    *   **Backend Functions**: Located at `backend/functions/.env`.
    *   **Secrets Contained**:
        *   `GEMINI_API_KEY`: API Key for Google Gemini.
        *   `STRIPE_SECRET_KEY`: Stripe Private Secret Key.
        *   `STRIPE_WEBHOOK_SECRET`: Signature verification secret for Stripe payment webhooks.
*   **Developer Setup**: A new developer must copy/create `backend/functions/.env` and insert their own API keys to run the local server or deploy.

---

## 7. DevOps, Environments, & Deployment

*   **Firebase Projects**: There is currently a single Firebase project: **`toolsight-teng`** (where `teng` is a leftover artifact from an older naming convention).
*   **CI/CD Pipeline**: There is currently no CI/CD pipeline (e.g. GitHub Actions).
*   **Deployment Workflow**: All deployments are triggered manually by running CLI scripts defined in `package.json` files:
    *   **Backend Functions**: In `backend/functions/`, run `npm run deploy` (calls `firebase deploy --only functions`).
    *   **Web App (Hosting)**: In `apps/web/`, run `npm run deploy` (calls `npm run build && firebase deploy --only hosting`).
*   **Network Requirement**: Real-time network connectivity is mandatory for both the web and mobile apps. No offline queueing or offline operation is currently supported.
*   **Data Retention Policy**: All audits, checkouts, users, and templates are kept in Firestore **forever**. There are no archival, pruning, or purging cron jobs, preserving a complete audit record for compliance.

---

## 8. Operational & Technical Handover Secrets

This section tracks highly specific technical realities, legacy codebase structures, and planned future tracks:

### A. The EID Global Uniqueness Constraint
The **EID** (Equipment ID) of a physical Toolbox is used as its document ID in the `toolboxes` collection. Because Firestore document IDs must be globally unique across the entire database instance, **no two toolboxes can share the same EID (even if they belong to entirely different organizations).**
*   **Operational Catch**: Currently, if an Admin in Organization A tries to register a toolbox with an EID that already exists in Organization B, the creation will silently fail.
*   **Future Fix**: In future releases, the toolbox creation routine should be guarded with a duplicate EID pre-flight check or moved to a sub-collection schema if multi-org sharing is required.

### B. Image Compression & Quality Guards
Technicians' mobile cameras can capture images over 10MB, which would fail Gemini's size limits or trigger Cloud Function Out-Of-Memory (OOM) crashes.
*   **The Guard**: Inside `apps/mobile/lib/pages/drawer_capture.dart`, the `ImageCropper` is configured with strict client-side compression boundaries:
    *   `compressFormat`: JPEG format enforcement.
    *   `compressQuality`: 85% JPEG compression.
    *   `maxWidth`/`maxHeight`: The image is downscaled to fit within a $1200\times1200$ square.
*   **Result**: Captured photos are typically compressed to $100\text{KB} - 300\text{KB}$ before being uploaded to Storage, drastically reducing network transmission time and keeping functions completely safe.

### C. Deprecated Anchor Points
*   **Background**: In older mockups, the system featured an `AnchorPoint` model (`AnchorPointManager.tsx` on the web app) designed to let users place reference landmarks on templates and drawer images.
*   **Current State**: Although the React UI code is still present, **anchor points are completely disregarded, and are not saved in the database.**
*   **Recommendation**: Future developers can safely deprecate and remove the `AnchorPointManager` component. Gemini's visual boundaries analysis has made manual alignment landmarks entirely obsolete.

### D. Android-Only Development & Future iOS Setup
*   **Current Deployment**: ToolSight has been built and tested **exclusively on Android**. It has never been compiled or run on iOS.
*   **Future Road**: Porting to iOS is a planned next step. To enable iOS, a future developer will need to:
    1.  Compile the Flutter target under macOS using Xcode.
    2.  Set up Apple Developer certificates and configure Apple Push Notification Service (APNS) keys in the Firebase Console.
    3.  Generate matching `.p8` keys to register the APNS service to handle iOS push alerts on the scheduling cron.

### E. Android App Signing & Keystores
To compile or build release bundles (`.apk` or `.aab`) of the Android mobile application, you will need the signing configuration keys.
*   **The Files**: The build configuration points to:
    *   `apps/mobile/android/key.properties` (contains signing store passwords and aliases).
    *   `apps/mobile/android/app/upload-keystore.jks` (contains the raw signing key certificate).
*   **Git Status**: These files are **git-ignored** for security. A future maintainer must retrieve these files securely from the team admin or project owner to compile official release builds.

### F. Outdated Security & Rules Tests
The test suite located under `tests/` (e.g., `tests/suites/05-exploits.ts`) was written early in the project's history to test Firestore rules. 
*   **Current State**: Due to subsequent schema evolutions and system refactoring, these tests are **likely broken** and out-of-date.
*   **Recommendation**: Do not expect `npm run test` in `tests/` to pass out of the box. Future developers will need to update these test suites to match the current database schemas if they wish to re-enable security rules unit-testing.

---

## 9. Directory Structure & Navigation Guide

This section is an LLM/developer roadmap to quickly find, modify, and build files in ToolSight:

```
/
├── CONTEXT.md                       # Canonical Glossary (Always use these exact terms)
├── README.md                        # Quick setup & technologies list
├── docs/
│   ├── adr/                         # Architectural Decision Records (0001 - 0007)
│   ├── system-handover-deep-dive.md # This comprehensive document
│   └── audit-architecture.md        # Technical explanation of the Sandwich Lifecycle
├── shared/
│   └── types/                       # TypeScript schemas shared between Web and Backend
├── apps/
│   ├── web/                         # React Admin Web App
│   │   ├── src/features/            # Page-specific views (TemplateBuilder, TemplateInventory)
│   │   ├── src/components/          # Shared components (AnchorPointManager)
│   │   ├── src/hooks/               # React Hooks fetching and syncing Firestore streams
│   │   └── src/repositories/        # Static classes invoking direct Firestore database operations
│   └── mobile/                      # Flutter Maintainer Mobile App
│       ├── lib/pages/               # Core pages (drawer_capture, drawer_page, scan_toolbox)
│       └── lib/repositories/        # Isolated classes managing database/FCM network calls
└── backend/
    └── functions/                   # Firebase Cloud Functions (Typescript)
        ├── src/gemini.ts            # High-level RAG Gemini Vision pipeline config & retry loop
        ├── src/aiAuditer.ts         # Firestore triggered pipeline coordinator
        ├── src/auditScheduler.ts    # 5-minute Watchdog scheduler (Overdue / Periodic)
        ├── src/checkout.ts          # Checkout & Return entry points
        └── src/user.ts              # Invitation, multi-org registration, and admin creation
```

### G. UI-Database Separation Design Pattern
To keep code highly modular and allow visual layouts to be tested independently of physical networks:
*   **Web App Pattern**: All React pages use **Hooks** (to handle stream lifecycle, loading spinner state, and local states) which delegate real-time database modifications to isolated **Repositories** (e.g. `TemplateRepository`).
*   **Mobile App Pattern**: All Flutter pages are isolated from database streams, routing queries, or cloud functions via static **Repositories** (e.g. `AuditRepository`), keeping the Dart widgets entirely clean and focused on rendering layout and drawing visual boundary overlays.

---

## 10. Known Technical Debt, Risks, & Future Enhancements

These are the core architectural limits, known edge cases, and design compromises that have been intentionally accepted during initial development to keep the system simple and lightweight. They serve as immediate, high-priority work items for the incoming team:

### B. Raw Gemini Rate Limits & Shift-Change Congestion
*   **The Issue**: There is no server-side queueing, rate-limiting, or traffic throttling for AI audits. If 20 maintainers simultaneously perform checkout audits during a shift change, all requests hit the Gemini API at once.
*   **The Mitigation**: The only current protection is the exponential backoff/retry loop inside `executeRequestWithRetry` (`gemini.ts`).
*   **Future Road**: If traffic spikes frequently cause 429 quota exhaustion errors, the incoming team should implement a task queue (e.g., Firebase Cloud Tasks) to serialize image analysis requests during high-congestion periods.

### C. Accumulating Storage Costs (Host-Forever Policy)
*   **The Issue**: The current operational model has **no** automated deletion or archival routine. All uploaded drawer audit photos and template layout images are hosted in Firebase Storage indefinitely.
*   **The Cost**: While simple, this will eventually lead to substantial billing accumulation as hundreds of daily audit photos pile up.
*   **Future Road**: The incoming team should implement a Firebase Storage Lifecycle Policy to auto-delete or migrate raw audit images to cold storage (e.g., Archival classes) after 30 to 90 days, while preserving the lightweight Firestore document metadata for compliance tracking.

### D. FCM Push Notification Dependency
*   **The Issue**: The "Audit Required" and "Audit Overdue" alerts rely solely on Firebase Cloud Messaging (FCM). Due to OS-level power saving or background throttling, push notifications are inherently unreliable on mobile devices in deep sleep.
*   **The Reality**: Currently, notifications are treated as a helpful "nudge" rather than a mission-critical failure path. The system relies on maintainers checking their local home dashboards or supervisors managing active sessions from the admin panel.

### E. Manual Denormalized Mismatch Repair
*   **The Issue**: To maximize loading performance, ToolSight heavily duplicates data (e.g. duplicating names and statuses across toolboxes and checkouts). 
*   **The Risk**: There are no background "repair" scripts, trigger heals, or integrity checkers to correct inconsistencies if a database write is interrupted or modified incorrectly.
*   **Status**: All core custody actions are tightly controlled via transactions or backend-only functions, so no data desynchronization has occurred in the past 6 months of development. This remains a key area for potential verification cron-jobs.
