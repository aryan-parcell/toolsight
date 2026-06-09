import {Part, Schema, Type} from "@google/genai";
import type {Detection, Tool} from "@shared/types";
import {logger} from "firebase-functions/v2";

/**
 * Identifies the prompt/model contract version. Bump when the prompt, schema,
 * model, or sampling settings change so audit attribution can record exactly
 * what produced a result.
 */
export const PROMPT_VERSION = "v2.0.0";

/**
 * Default model. Override at runtime via the GEMINI_MODEL_ID env var.
 * Gemini 3.1 models offer improved visual reasoning and spatial coordinates.
 * We default to the cost-efficient flash-lite, but can upgrade to full flash for higher accuracy.
 */
const DEFAULT_MODEL_ID = "gemini-3.1-flash-lite";

/** Hard ceiling on inline image payloads to keep Cloud Functions safe from OOMs. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Optional context useful for logging and template handling. None of these
 * affect the AI request itself; auditId/drawerId are correlation IDs only.
 */
export interface AnalyzeOptions {
  auditId?: string;
  drawerId?: string;
}

/**
 * Defensive fallback that strips markdown fences or stray prose from a
 * response that should already be a JSON array. With responseSchema enforced
 * by the SDK this is rarely exercised.
 *
 * @param {string} text Raw text output from Gemini that may contain a JSON array
 * @return {string} A cleaned JSON string
 */
function cleanJsonString(text: string): string {
  // Try to find JSON array in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (codeBlockMatch) return codeBlockMatch[1];

  // Try to find array directly
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) return arrayMatch[0];

  // Fallback: try to parse the whole text if it looks like JSON
  if (text.trim().startsWith("[") && text.trim().endsWith("]")) {
    return text;
  }

  return text;
}

/**
 * Approximate the raw byte size of a base64 string accounting for `=` padding.
 *
 * @param {string} b64 Base64 string to analyze
 * @return {number} Estimated size in bytes
 */
function approximateBase64Bytes(b64: string): number {
  const padding = (b64.match(/=+$/) || [""])[0].length;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/**
 * Validates base64 formats, size restrictions, and MIME types.
 * Returns clean base64 data strings ready for ingestion.
 *
 * @param {string} image Base64-encoded image data
 * @param {string} mimeType MIME type of the target image
 * @param {string} [templateImage] Optional base64 template reference image
 * @param {string} [templateMimeType] Optional MIME type for the template image
 * @param {string} [logCtx] Logging context tag prefix
 * @return {Object} Cleaned base64 strings
 * @throws {Error} If any validation check fails.
 */
function validateInputs(
  image: string,
  mimeType: string,
  templateImage?: string,
  templateMimeType?: string,
  logCtx = ""
): { drawerBase64: string; templateBase64?: string } {
  // Validate that we are working with an actual image format
  if (!mimeType.toLowerCase().startsWith("image/")) {
    throw new Error(`${logCtx} Unsupported image MIME type: ${mimeType}.`);
  }

  const drawerBase64 = image.includes(",") ? image.split(",")[1] : image;
  if (!drawerBase64) throw new Error(`${logCtx} Empty audit image payload.`);

  const approxRawBytes = approximateBase64Bytes(drawerBase64);
  if (approxRawBytes > MAX_IMAGE_BYTES) {
    throw new Error(`${logCtx} Audit image too large (${approxRawBytes} / ${MAX_IMAGE_BYTES} bytes).`);
  }

  let templateBase64: string | undefined;
  if (templateImage) {
    if (!templateMimeType || !templateMimeType.toLowerCase().startsWith("image/")) {
      throw new Error(`${logCtx} Unsupported template image MIME type: ${templateMimeType}.`);
    }

    templateBase64 = templateImage.includes(",") ? templateImage.split(",")[1] : templateImage;
    if (!templateBase64) throw new Error(`${logCtx} Empty template image payload.`);

    const approxTemplateBytes = approximateBase64Bytes(templateBase64);
    if (approxTemplateBytes > MAX_IMAGE_BYTES) {
      throw new Error(`${logCtx} Template image too large (${approxTemplateBytes} / ${MAX_IMAGE_BYTES} bytes).`);
    }
  }

  return {drawerBase64, templateBase64};
}

/**
 * Validates and normalizes a single AI tool detection. Coordinates are clamped
 * to 0–100 (percentage). Confidence is left in 0.0–1.0 (probability).
 *
 * @param {any} tool Raw tool prediction object matching the nested Detection schema
 * @return {Detection} Normalized Detection object conforming strictly to shared/types
 */
function validateAndNormalizeDetection(tool: any): Detection {
  // Helper to coerce values to numbers
  const toNum = (v: any, fallback: number): number => typeof v === "number" ? v : fallback;
  const clampPct = (v: any, fallback: number) => Math.max(0, Math.min(100, toNum(v, fallback)));

  // Get bounding box coordinates
  const xmin = Math.min(tool.xmin, tool.xmax);
  const xmax = Math.max(tool.xmin, tool.xmax);
  const ymin = Math.min(tool.ymin, tool.ymax);
  const ymax = Math.max(tool.ymin, tool.ymax);

  // Convert to percentage coordinates (0-100)
  const x = xmin / 10;
  const y = ymin / 10;
  const width = (xmax - xmin) / 10;
  const height = (ymax - ymin) / 10;

  return {
    toolId: typeof tool.toolId === "string" ? tool.toolId : "",
    status: tool.status === "present" ? "present" : "absent",
    confidence: ["low", "medium", "high"].includes(tool.confidence) ? tool.confidence : "low",
    toolInfo: {
      name: typeof tool.name === "string" && tool.name.length > 0 ? tool.name : "Unknown Tool",
      x: clampPct(x, 0),
      y: clampPct(y, 0),
      width: clampPct(width, 1),
      height: clampPct(height, 1),
      shape: tool.shape === "ellipse" ? "ellipse" : "rectangle",
      angle: typeof tool.angle === "number" ? tool.angle : 0,
    },
  };
}

/**
 * Build the structured-output JSON schema enforced on Gemini.
 * Maps directly to our shared/types Detection interface (using nested toolInfo).
 *
 * @param {Tool[]} expectedTools List of expected tools for matching (if any)
 * @return {Schema} JSON schema structure compatible with the Gemini API
 */
function buildResponseSchema(expectedTools: Tool[]): Schema {
  const properties: Record<string, any> = {
    status: {
      type: Type.STRING,
      enum: ["present", "absent"],
      description: "Presence state: 'present' if visible, 'absent' if empty.",
    },
    confidence: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
      description: "Qualitative confidence in this detection.",
    },
    name: {
      type: Type.STRING,
      description: "The official name of the tool.",
    },
    ymin: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 1000,
      description: "Top boundary coordinate on a 1000-scale grid (Y-axis).",
    },
    xmin: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 1000,
      description: "Left boundary coordinate on a 1000-scale grid (X-axis).",
    },
    ymax: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 1000,
      description: "Bottom boundary coordinate on a 1000-scale grid (Y-axis).",
    },
    xmax: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 1000,
      description: "Right boundary coordinate on a 1000-scale grid (X-axis).",
    },
    angle: {
      type: Type.INTEGER,
      minimum: 0,
      maximum: 360,
      description: "Clockwise rotation angle in degrees (0 to 360).",
    },
    shape: {
      type: Type.STRING,
      enum: ["rectangle", "ellipse"],
      description: "The geometric boundary shape enclosing the tool.",
    },
  };

  const required = ["status", "confidence", "name", "ymin", "xmin", "ymax", "xmax", "angle", "shape"];

  if (expectedTools.length > 0) {
    properties.toolId = {
      type: Type.STRING,
      enum: expectedTools.map((t) => t.toolId),
      description: "Matched tool ID from context.",
    };
    required.unshift("toolId");

    properties.name.enum = Array.from(new Set(expectedTools.map((t) => t.toolInfo.name)));
    properties.name.description = "Tool name. Must match one of the expected tool names.";
  }

  return {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties,
      required,
    },
  };
}

/**
 * Classify an SDK or HTTP error to decide whether the request is worth retrying.
 *
 * @param {any} error Raw caught error object
 * @return {{isRetryable: boolean, reason: string}} If retryable and the reason
 */
function classifyError(error: any): { isRetryable: boolean; reason: string } {
  // Extract standard numerical HTTP or API error code (e.g. 429, 503)
  const code = error?.status ?? error?.code ?? error?.error?.code;

  // Extract standard API error string identifier (e.g. "RESOURCE_EXHAUSTED", "UNAVAILABLE")
  const status = error?.error?.status ?? error?.status;

  // Normalize message text for string pattern scanning
  const message = String(error?.error?.message ?? error?.message ?? error ?? "").toLowerCase();

  // 1. Rate Limiting / Quota Exhaustion (Retry with progressive backoff)
  const isRateLimit = code === 429 || status === "RESOURCE_EXHAUSTED" ||
    message.includes("429") || message.includes("quota");
  if (isRateLimit) {
    return {isRetryable: true, reason: "rate-limit"};
  }

  // 2. Server-side Transient Failures (5xx status codes, network deadlines, timeouts)
  const is5xx = typeof code === "number" && code >= 500 && code < 600;
  const isTransientStatus = status === "UNAVAILABLE" || status === "DEADLINE_EXCEEDED" || status === "INTERNAL";
  const isTransientMessage = message.includes("unavailable") || message.includes("deadline") ||
    message.includes("timeout");
  if (is5xx || isTransientStatus || isTransientMessage) {
    return {isRetryable: true, reason: "transient-api"};
  }

  // 3. Low-level Node / Socket Drops (Quick retry is safe to bypass temporary blips)
  const transientNetworkCodes = new Set(["ECONNRESET", "ETIMEDOUT", "EAI_AGAIN", "ENETUNREACH", "ENOTFOUND", "EPIPE"]);
  const isNetworkDrop = transientNetworkCodes.has(error?.code) || message.includes("network error");
  if (isNetworkDrop) {
    return {isRetryable: true, reason: "network-drop"};
  }

  // 4. Fatal Failures (Invalid key, bad schema configurations, unsupported model selections)
  return {isRetryable: false, reason: "fatal"};
}

/**
 * Builds the comprehensive prompt text and inserts current database context if matching tools.
 *
 * @param {Tool[]} expectedTools Set of tools expected in drawer
 * @param {boolean} hasTemplate Is a reference template image supplied?
 * @param {string} primaryColor Primary color of the foam.
 * @param {string} secondaryColor Secondary color of the foam.
 * @return {string} Formatted system instruction string
 */
function buildSystemPrompt(expectedTools: Tool[], hasTemplate: boolean,
  primaryColor: string, secondaryColor: string ): string {
  const coordinateInstructions = `
    - ALL bounding boxes MUST be defined using four coordinates on a 1000-scale grid (0 to 1000):
      - ymin: Distance from the TOP edge of the image to the TOP boundary of the tool's bounding box (0 to 1000).
      - xmin: Distance from the LEFT edge of the image to the LEFT boundary of the tool's bounding box (0 to 1000).
      - ymax: Distance from the TOP edge of the image to the BOTTOM boundary of the tool's bounding box (0 to 1000).
      - xmax: Distance from the LEFT edge of the image to the RIGHT boundary of the tool's bounding box (0 to 1000).
    - This is the standard 1000x1000 visual grid coordinate system where
      (xmin, ymin) is the top-left corner and (xmax, ymax) is the bottom-right corner.
    - Ensure ymin < ymax and xmin < xmax.
    - angle represents the rotation of the bounding box.
    - angle is in degrees (0-360) clockwise; 0 means unrotated/horizontal.
  `;

  if (expectedTools.length === 0) {
    return `
      SYSTEM: You are ToolSight AI, a specialized aircraft maintenance tool detector.
      GOAL: Identify EVERY tool visible to create a master inventory template.

      INSTRUCTIONS:
      1. Analyze the image of a tool drawer and identify all distinct tools.
      2. Set status to "present" for every identified tool.
      3. For each tool, populate the 'toolInfo' object containing the tool's name and coordinate positioning.

      CRITICAL COORDINATE SYSTEM REQUIREMENTS:
      ${coordinateInstructions}

      OUTPUT:
      - Return ONLY a valid JSON array matching the response schema.
    `;
  }

  const toolsContext = expectedTools.map((t) => {
    const toolDesc = `Tool Name: "${t.toolInfo.name}", ID: "${t.toolId}";`;

    // Convert percentage-based stored coordinates to 0-1000 scale for the prompt
    const x = t.toolInfo.x ?? 0;
    const y = t.toolInfo.y ?? 0;
    const w = t.toolInfo.width ?? 0;
    const h = t.toolInfo.height ?? 0;

    const xmin = Math.round(x * 10);
    const ymin = Math.round(y * 10);
    const xmax = Math.round((x + w) * 10);
    const ymax = Math.round((y + h) * 10);

    const toolLoc = `Reference Location (Image 2): (
          ymin: ${ymin}, xmin: ${xmin},
          ymax: ${ymax}, xmax: ${xmax},
          shape: ${t.toolInfo.shape}, angle: ${t.toolInfo.angle?.toFixed(0)} degrees
      )`;

    return `- ${toolDesc} ${hasTemplate ? toolLoc : ""}`;
  }).join("\n");

  return `
    SYSTEM: You are ToolSight AI, a specialized aircraft maintenance tool detector.

    ${hasTemplate ?
    `
      INPUTS: You are provided with TWO images.
        Image 1 is the TARGET AUDIT IMAGE: The current drawer state to analyze and audit.
        Image 2 is the REFERENCE TEMPLATE IMAGE: A clean state photo with all tools present. 
    ` : "INPUT: You are provided with a TARGET AUDIT IMAGE."
}

    CONTEXT: You are looking at a specific drawer that SHOULD contain the following tools:
    ${toolsContext}

    ${hasTemplate ?
    `
      INSTRUCTIONS FOR REFERENCE: 
        Look at Image 2 (Reference).
        Use the provided 'Reference Location' to find each tool. Then search for that SAME object in Image 1 (Target).
        Use the reference image to learn the unique visual features of each tool (shape, color, size, texture).
        Do NOT require pixel alignment between the two images.
        The target audit image (Image 1) may be shifted, rotated, shot from a different distance, etc. 
      ` : ""
}   
    ${primaryColor != "" ?
    `The toolbox has two layers of foam. The foam surrounding tools is colored ${primaryColor}.` : ""}
    ${secondaryColor != "" ?
    `The foam underneath the tools is colored ${secondaryColor}.
    Excess of ${secondaryColor} may signify absence of a tool.` : ""}

    INSTRUCTIONS:
    1. Analyze the TARGET AUDIT IMAGE of a tool drawer and identify tools.
    2. Match detected tools to the Tool values provided in the CONTEXT.
    3. Include the exact "Tool ID" from the CONTEXT in output if matched.
    4. Identify ONLY the tools and empty slots that are ACTUALLY VISIBLE.
    5. Status Determination:
        - "present": Tool is clearly visible and identifiable.
        - "absent": An empty slot where a tool should be.
    6. For each tool, populate the nested 'toolInfo' object containing the tool's name and coordinate positioning.

    CRITICAL COORDINATE SYSTEM REQUIREMENTS:
    ${coordinateInstructions}

    OUTPUT:
    - Return ONLY a valid JSON array matching the response schema.
  `;
}

/**
 * Packs text cues and image assets into Parts to send to Gemini.
 *
 * @param {string} drawerBase64 Target drawer image
 * @param {string} mimeType Target drawer mime type
 * @param {string} [templateBase64] Reference template image base64
 * @param {string} [templateMimeType] Reference template image mime type
 * @return {Part[]} Array of Part inputs for generateContent
 */
function buildContentParts(
  drawerBase64: string,
  mimeType: string,
  templateBase64?: string,
  templateMimeType?: string
): Part[] {
  const contentParts: Part[] = [];

  contentParts.push({
    text: templateBase64 ?
      "Image 1 is the TARGET AUDIT IMAGE. Image 2 is the REFERENCE TEMPLATE IMAGE. Analyze and audit Image 1" :
      "Analyze this tool drawer image.",
  });

  contentParts.push({
    inlineData: {mimeType: mimeType, data: drawerBase64},
  });

  if (templateBase64) {
    contentParts.push({
      inlineData: {mimeType: templateMimeType, data: templateBase64},
    });
  }

  return contentParts;
}

/**
 * Submits generateContent request to Gemini and performs retries on transient errors.
 *
 * @param {string} apiKey Gemini API key
 * @param {string} modelId Model ID to invoke
 * @param {Part[]} contentParts Request user content parts
 * @param {string} systemPrompt Prompt system instructions
 * @param {any} responseSchema Enforced output schema
 * @param {string} logCtx Log context tag
 * @param {number} [retries] Number of remaining attempts
 * @param {number} [delay] Starting delay for backoff
 * @return {Promise<Detection[]>} List of normalized tool detections
 */
async function executeRequestWithRetry(
  apiKey: string,
  modelId: string,
  contentParts: Part[],
  systemPrompt: string,
  responseSchema: Schema,
  logCtx: string,
  retries = 6,
  delay = 4000
): Promise<Detection[]> {
  try {
    const {GoogleGenAI} = await import("@google/genai");
    const ai = new GoogleGenAI({apiKey});

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        role: "user",
        parts: contentParts,
      },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0,
        topP: 1,
        topK: 16,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    // For logging token costs to console. Should be ommitted for release.
    // 25 cents for input text/image per million, and 1.5 dollars for output text per million.
    console.log(response.usageMetadata);
    const inputTokenCost = (response.usageMetadata?.promptTokenCount ?? 0) * .25 / 1000000;
    const outputTokenCost = (response.usageMetadata?.candidatesTokenCount ?? 0) * 1.5 / 1000000;
    const totalCost = inputTokenCost + outputTokenCost;
    console.log(`Input Token Cost ${inputTokenCost.toFixed(6)} USD,
     Output Token Cost ${outputTokenCost.toFixed(6)} USD, Total Cost ${totalCost.toFixed(6)} USD`);

    let text: string;
    try {
      text = response.text || "[]";
    } catch (textErr: any) {
      console.error(`${logCtx} Failed to read Gemini response text:`, textErr);
      text = "[]";
    }

    const cleanedJson = cleanJsonString(text);
    let rawTools: unknown;
    try {
      rawTools = JSON.parse(cleanedJson);
    } catch (parseErr: any) {
      throw new Error(
        `${logCtx} AI returned invalid JSON: ${parseErr.message}. ` +
        `First 200 chars: ${String(text).slice(0, 200)}`
      );
    }

    if (!Array.isArray(rawTools)) {
      throw new Error(`${logCtx} Gemini returned non-array response: ` + String(text).slice(0, 200));
    }

    logger.info({
      tag: "gemini-debug-log",
      header: `${logCtx} Gemini API request successful.`,
      prompt: systemPrompt,
      response: rawTools,
    });

    return rawTools.map(validateAndNormalizeDetection);
  } catch (error: any) {
    const {isRetryable, reason} = classifyError(error);
    console.error(`${logCtx} Gemini API request failed (reason=${reason}, attemptsRemaining=${retries}):`, error);

    if (retries > 0 && isRetryable) {
      const isRateLimit = reason === "rate-limit";
      const backoff = isRateLimit ? delay : Math.min(delay, 1000);
      const nextDelay = isRateLimit ? delay * 1.5 : delay;

      console.warn(`${logCtx} ${reason} detected. Retrying in ${backoff}ms.`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
      return executeRequestWithRetry(
        apiKey,
        modelId,
        contentParts,
        systemPrompt,
        responseSchema,
        logCtx,
        retries - 1,
        nextDelay
      );
    }

    if (error instanceof Error) throw error;
    if (error?.error?.message) throw new Error(error.error.message);
    if (error?.message) throw new Error(error.message);
    throw new Error(`${logCtx} Unknown Gemini error: ${String(error)}`);
  }
}

/**
 * Analyzes a base64-encoded image of a tool drawer using the Gemini API to
 * detect tools, match them against an expected inventory, and return
 * normalized tool positions and statuses.
 *
 * @param {string} image Base64-encoded image data
 * @param {string} mimeType MIME type of the target image
 * @param {Tool[]} [expectedTools] List of database tool records for matching
 * @param {string[]} toolboxColors Primary/Secondary colored foam.
 * @param {string} [templateImage] Optional base64 template reference image
 * @param {string} [templateMimeType] Optional MIME type for the template image
 * @param {AnalyzeOptions} [options] Logging and template configuration options
 * @return {Promise<Detection[]>} Array of normalized tool detections
 * @throws {Error} If any validation or API execution fails
 */
export async function analyzeToolImage(
  image: string,
  mimeType: string,
  expectedTools: Tool[] = [],
  toolboxColors: string[],
  templateImage?: string,
  templateMimeType?: string,
  options: AnalyzeOptions = {}
): Promise<Detection[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY env var is missing.");

  const modelId = process.env.GEMINI_MODEL_ID || DEFAULT_MODEL_ID;

  // Build a short tag prepended to every log line for traceability.
  const logCtx = (() => {
    const parts: string[] = [];
    if (options.auditId) parts.push(`audit=${options.auditId}`);
    if (options.drawerId) parts.push(`drawer=${options.drawerId}`);
    parts.push(`prompt=${PROMPT_VERSION}`);
    parts.push(`model=${modelId}`);
    return `[${parts.join(" ")}]`;
  })();

  // 1. Validate inputs (MIMEs, size limits, payload validity)
  const {drawerBase64, templateBase64} = validateInputs(
    image,
    mimeType,
    templateImage,
    templateMimeType,
    logCtx
  );

  // 2. Build instructions and response schema (structured JSON array matching our Detection type)
  const systemPrompt = buildSystemPrompt(expectedTools, !!templateBase64,
    toolboxColors[0] || "", toolboxColors[1] || "");
  const responseSchema = buildResponseSchema(expectedTools);

  // 3. Build user payload content
  const contentParts = buildContentParts(drawerBase64, mimeType, templateBase64, templateMimeType);

  // 4. Request generation from model with robust, classification-aware retry
  return executeRequestWithRetry(apiKey, modelId, contentParts, systemPrompt, responseSchema, logCtx);
}
