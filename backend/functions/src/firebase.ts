import * as admin from "firebase-admin";

// Initialize once here
admin.initializeApp();

// Export the initialized services
export const db = admin.firestore();
export const messaging = admin.messaging();
export const storage = admin.storage();
