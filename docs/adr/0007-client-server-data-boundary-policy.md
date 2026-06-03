# 0007: Client-Server Data Boundary Policy

To clarify our architectural boundaries and ensure system security, performance, and data integrity, we established a strict client-server data split policy. 

### 1. Client-Side (Direct Firestore SDK)
*   **Reads and Real-Time Streams**: Both mobile and web clients query and subscribe to real-time document streams directly using the Firebase SDK. This leverages Firestore's native caching, latency compensation, and real-time synchronization.
*   **Simple Single-Document Writes**: Single-document modifications (such as a maintainer toggling a tool's presence, or an admin updating descriptive metadata) are executed directly via the client SDK. These are protected from privilege escalation or unauthorized writes by comprehensive **Firestore Security Rules**.

### 2. Server-Side (Cloud Functions)
Any database mutation or logic must be executed server-side via Firebase Cloud Functions if it meets any of the following criteria:
*   **Multi-Document Transactions**: Operations requiring atomic multi-document writes across collections (e.g. `checkOutToolbox`, `returnToolbox`, `assignTemplateToDrawer`) to prevent partial failures.
*   **Third-Party API Integrations**: Functions requiring secure credential storage or webhooks (e.g., Stripe Payment processing, Gemini AI vision pipeline).
*   **Administrative & Onboarding Operations**: Sensitive user operations (such as invitation validation, role creation, and registrations) where direct client-side write access to the collections is blocked for security.
*   **System Schedulers**: Automated background cron-jobs (e.g., the Watchdog 5-minute scheduler).
