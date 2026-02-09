/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

/**
 * HTTP function example
 *
 * export const helloWorld = onRequest((request, response) => {
 *  logger.info("Hello logs!", {structuredData: true});
 *  response.send("Hello from Firebase!");
 * });
 *
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {auditScheduler} from "./auditScheduler";
import {aiAuditer} from "./aiAuditer";
import {HttpsError, onCall} from "firebase-functions/https";
import {analyzeToolImage} from "./gemini";

// For cost control, you can set the maximum number of containers that can be
// running at the same time
setGlobalOptions({maxInstances: 10});

export {auditScheduler, aiAuditer};

export const discoverTools = onCall({
  cors: true,
  memory: "512MiB",
  timeoutSeconds: 60,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {image, mimeType} = request.data;

  try {
    const tools = await analyzeToolImage(image, mimeType, []);
    return {tools};
  } catch (error: any) {
    console.error("Analysis Failed:", error);
    throw new HttpsError("internal", "AI Analysis Failed");
  }
});
