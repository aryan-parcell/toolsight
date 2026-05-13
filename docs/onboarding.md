# Onboarding & Invitation Workflow

ToolSight uses an invitation-based system to register maintainers. This ensures that every maintainer is securely linked to an organization without requiring manual entry of Organization IDs.

## Workflow Overview

1.  **Admin Invitation (Web App)**:
    *   Admins invite maintainers by email through the "Maintainer Management" section in Settings.
    *   This calls the `inviteMaintainers` Cloud Function, which creates a document in the `invitations` collection.
    *   The system deduplicates invitations and checks if a user is already registered.

2.  **Maintainer Registration (Mobile App)**:
    *   Maintainers register using their Name, Email, and Password.
    *   The app calls the `registerMaintainer` Cloud Function.
    *   The function verifies that the email has at least one pending invitation.

3.  **Multi-Organization Support**:
    *   If a maintainer has been invited to multiple organizations, the `registerMaintainer` function returns a `requiresSelection` response with a list of organization names and IDs.
    *   The mobile app displays an "Organization Picker" dialog.
    *   The maintainer selects an organization, and the app calls `registerMaintainer` again with the `selectedOrganizationId`.

4.  **Atomic User Creation**:
    *   The `registerMaintainer` function uses the Firebase Admin SDK to create the Auth user and the Firestore user document.
    *   Upon successful creation, it deletes **all** pending invitations for that email to clean up the database.

## Security

*   Registration is restricted to invited emails only.
*   The `invitations` collection is protected by Firestore rules; only admins can view or delete invitations within their organization.
*   Creation of invitations is restricted to the backend via Cloud Functions.
