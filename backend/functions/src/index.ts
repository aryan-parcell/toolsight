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

// For cost control, you can set the maximum number of containers that can be
// running at the same time
setGlobalOptions({maxInstances: 10});

export {auditScheduler, aiAuditer};
