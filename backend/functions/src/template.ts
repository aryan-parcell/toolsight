import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db} from "./firebase";
import {Drawer, Template, Tool, ToolBox, User} from "@shared/types";

export const assignTemplateToDrawer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {toolboxId, drawerId, templateId} = request.data;

  if (!toolboxId || !drawerId || !templateId) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  await db.runTransaction(async (transaction) => {
    const toolboxRef = db.collection("toolboxes").doc(toolboxId);
    const templateRef = db.collection("templates").doc(templateId);
    const userRef = db.collection("users").doc(request.auth!.uid);

    const toolboxSnap = await transaction.get(toolboxRef);
    const templateSnap = await transaction.get(templateRef);
    const userSnap = await transaction.get(userRef);

    if (!toolboxSnap.exists || !templateSnap.exists || !userSnap.exists) {
      throw new HttpsError("not-found", "Data not found");
    }

    const toolboxData = toolboxSnap.data();
    const templateData = templateSnap.data();
    const userData = userSnap.data();

    if (!toolboxData || !templateData || !userData) {
      throw new HttpsError("data-loss", "Failed to get data");
    }

    const toolbox = toolboxData as ToolBox;
    const template = templateData as Template;
    const user = userData as User;

    // Critical: Verify user permissions; Firebase Security Rules don't apply to function calls.
    const userOrgId = user.organizationId;
    if (user.role !== "admin" || userOrgId !== toolbox.organizationId || userOrgId !== template.organizationId) {
      throw new HttpsError("permission-denied", "You do not have permission to modify this toolbox or template");
    }

    const updatedDrawers: Drawer[] = toolbox.drawers.map((d) => {
      return d.drawerId === drawerId ? {...d, templateId: templateId} : d;
    });

    const updatedTemplateIds = Array.from(new Set(
      updatedDrawers.filter((d) => !!d.templateId).map((d) => d.templateId!)
    ));

    const otherTools = toolbox.tools.filter((t) => t.drawerId !== drawerId);

    const newTools: Tool[] = template.tools.map((t, i) => ({
      drawerId: drawerId,
      toolId: `t${drawerId.substring(1)}-${i}`,
      toolInfo: t,
    }));

    transaction.update(toolboxRef, {
      drawers: updatedDrawers,
      tools: [...otherTools, ...newTools],
      templateIds: updatedTemplateIds,
    });
  });

  return {success: true};
});
