import {Drawer, Tool} from "@shared/types";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {db} from "./firebase";
import {getTemplate, getToolBox, getUser} from "./utils";

export const assignTemplateToDrawer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in.");
  }

  const {toolboxId, drawerId, templateId} = request.data;

  if (!toolboxId || !drawerId || !templateId) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  await db.runTransaction(async (transaction) => {
    const {toolboxRef, toolbox} = await getToolBox(transaction, toolboxId);
    const {template} = await getTemplate(transaction, templateId);
    const {user} = await getUser(transaction, request.auth!.uid);

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
