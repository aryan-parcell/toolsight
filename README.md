# ToolSight

ToolSight is a full-stack application to manage, track, and audit toolboxes across organizations. It provides an admin web console for toolbox management and a mobile app for maintainers to check out and audit toolboxes in the field.

## Components

- **Mobile app (maintainers):** Flutter app used by maintainers to check out toolboxes, perform audits, and submit reports.
- **Web app (admins):** React + TypeScript admin UI where toolboxes, organizations, and audit requirements are created and managed.
- **Backend:** Firebase (Firestore, Storage, Cloud Functions) driving data, images, and server-side logic.

## High-level workflows

- Admins create and configure toolboxes in the web app. Each toolbox document contains its inventory, organization association, and audit requirements.
- Maintainers open the mobile app and check out toolboxes by entering a toolbox ID. A maintainer can check out multiple toolboxes at once, but a single toolbox can only be checked out by one person at a time.
- While checked out, maintainers can perform audits defined by the toolbox's specification where they capture drawer images, run AI-assisted tool detection, review and confirm AI results, and submit an audit report. 

## Key constraints and business rules

- Checkout concurrency: Toolbox checkout is exclusive — Firestore transactions or server-side checks prevent two users from simultaneously checking out the same toolbox.
- Organization scoping: Toolboxes are scoped to organizations. Maintainers can only check out toolboxes that belong to their organization.

## Technology Stack
- **Frontend**: 
  - Mobile: Flutter
  - Web: React, TypeScript, Vite
- **Backend**: Firebase (Firestore, Storage, Cloud Functions)
- **AI/ML**: Gemini for advanced tool recognition and analysis

## Developer Setup
1. **Mobile App**:
   - Navigate to the mobile app directory: `cd apps/mobile`
   - Run `flutter pub get` to install dependencies.
   - Run `flutterfire configure` to generate `firebase_options.dart`.

2. **Web App**:
   - Navigate to the web app directory: `cd apps/web`
   - Run `npm install` to install dependencies.
   - Start the development server with `npm run dev`.

3. **Backend**:
   - Navigate to the backend functions directory: `cd backend/functions`
   - Run `npm install` to install dependencies.
   - Deploy functions with `npm run deploy`.

---

**Built for the United States Air Force aircraft maintenance community** ✈️
