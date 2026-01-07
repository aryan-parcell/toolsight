import {Detection, Tool} from "./types";

/**
 * Cleans a JSON string that may be wrapped in markdown code blocks
 * or surrounded by extra text.
 *
 * @param {string} text Raw text that may contain a JSON array
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
 * Validates and normalizes AI tool detections to a 0–100 percentage format.
 *
 * @param {any} tool Raw AI tool detection-like object
 * @return {Detection} Normalized AI tool detection
 */
function validateAndNormalizeDetection(tool: any): Detection {
  let processedTool = {...tool};

  // If ALL coordinates are <= 1, they're likely normalized (0-1)
  // and need conversion to %
  if (
    tool.x <= 1 && tool.y <= 1 && tool.width <= 1 && tool.height <= 1 &&
    tool.x >= 0 && tool.y >= 0 && tool.width > 0 && tool.height > 0
  ) {
    processedTool = {
      ...tool,
      x: tool.x * 100,
      y: tool.y * 100,
      width: tool.width * 100,
      height: tool.height * 100,
    };
  }

  // Clamp to valid ranges
  const validated: Detection = {
    name: tool.name || "Unknown Tool Name",
    toolId: tool.toolId || "Unknown Tool ID",
    status: tool.status || "Unknown Tool Status",
    confidence: typeof tool.confidence === "number" ? tool.confidence : 0,
    x: Math.max(0, Math.min(100, processedTool.x)),
    y: Math.max(0, Math.min(100, processedTool.y)),
    width: Math.max(1, Math.min(100, processedTool.width)),
    height: Math.max(1, Math.min(100, processedTool.height)),
  };

  // Ensure bounding box doesn't extend outside image bounds
  if (validated.x + validated.width > 100) {
    validated.width = Math.max(1, 100 - validated.x);
  }

  if (validated.y + validated.height > 100) {
    validated.height = Math.max(1, 100 - validated.y);
  }

  return validated;
}

/**
 * Analyzes a base64-encoded image of a tool drawer using the Gemini API
 * to detect tools, match them against an expected inventory, and return
 * normalized tool positions and statuses.
 *
 * @param {string} image Base64-encoded image data
 * @param {string} mimeType MIME type of the image
 * @param {Tool[]} expectedTools Expected tool definitions for matching
 * @param {string} [templateImage] Optional reference image
 * @return {Promise<Detection[]>} Detected tool positions
 * @throws {Error} If the API key is missing or a fatal API error occurs
 */
export async function analyzeToolImage(
  image: string,
  mimeType: string,
  expectedTools: Tool[],
  templateImage?: string,
): Promise<Detection[]> {
  // Ensure API Key is present
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("Gemini API key is missing.");

  // Create a RAG context string from the database definitions
  const toolsContext = expectedTools.map((t) =>
    `- Tool Name: "${t.toolName}", ID: "${t.toolId}"`
  ).join("\n");

  // Using flash model for speed/cost efficiency
  const modelId = "gemini-2.5-flash-lite";
  const systemPrompt = `
    SYSTEM: You are ToolSight AI, a specialized aircraft maintenance tool 
    detector.

    CONTEXT: You are looking at a specific drawer that SHOULD contain the 
    following tools:
    ${toolsContext}

    INSTRUCTIONS:
    1. Analyze the image of a tool drawer and identify tools.
    2. Try to match detected tools to the "Tool Name" values provided in the 
    CONTEXT above.
    3. If you find a match, include the "Tool ID" from the context in your 
    output.
    4. Identify ONLY the tools and empty slots that are ACTUALLY VISIBLE
    5. Status Determination:
        - "present": Tool is clearly visible, identifiable, and functional
        - "absent": An empty slot where a tool should be
        - "unserviceable": Tool is present but visibly damaged or unusable.
    6. If you see a tool that is NOT in the context, mark it as "unknown" 
    or provide a descriptive name.

    CRITICAL COORDINATE SYSTEM REQUIREMENTS:
    - ALL coordinates MUST be in PERCENTAGE format (0 to 100) relative to the 
    image dimensions.
    - x, y coordinates represent the TOP-LEFT corner as percentages (0 to 100)
    - width, height represent the size as percentages (0 to 100).
    - Example: A tool at image center would have x≈50, y≈50.
    - NEVER return values like 0.1, 0.5, 0.8 (normalized, not percentages)
    - ALWAYS return values like 10.5, 25.3, 67.8 (percentages, not normalized)

    OUTPUT:
    - Return ONLY a valid JSON array of objects. The JSON should be properly
    formatted. An example is shown below.

    OUTPUT FORMAT (JSON Array):
    [{
      "name": "Wrench 10mm",
      "toolId": "t-105",    <-- CRITICAL: Return the ID from context if matched
      "status": "present",  <-- CRITICAL: "present", "absent", "unserviceable"
      "confidence": 0.95,
      "x": 10.5, "y": 20.0, "width": 5.0, "height": 15.0,
    }, ...]
  `;

  // Remove data URL prefix if present to get raw base64
  const base64Data = image.includes(",") ? image.split(",")[1] : image;

  // Retry logic with exponential backoff
  // Increased retries to 6 and initial delay to 4000ms to handle
  // persistent 429 errors
  const makeRequest = async (
    retries = 6,
    delay = 4000
  ): Promise<Detection[]> => {
    try {
      // Initialize client inside the request to ensure fresh config if needed
      const {GoogleGenAI} = await import("@google/genai");
      const ai = new GoogleGenAI({apiKey});

      const response = await ai.models.generateContent({
        model: modelId,
        contents: {
          role: "user",
          parts: [
            {text: systemPrompt},
            {inlineData: {mimeType: mimeType, data: base64Data}},
          ],
        },
        config: {
          temperature: 0.2,
          topP: 0.8,
          topK: 40,
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "[]";
      const cleanedJson = cleanJsonString(text);

      try {
        const rawTools = JSON.parse(cleanedJson);

        if (!Array.isArray(rawTools)) {
          console.warn("Gemini response is not an array:", rawTools);
          return [];
        }

        return rawTools.map(validateAndNormalizeDetection);
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", text);
        return [];
      }
    } catch (error: any) {
      console.error(
        `Gemini API Request Failed (Attempts remaining: ${retries}):`,
        error
      );

      // Detailed check for various error shapes that represent a
      // 429/Resource Exhausted
      let isRateLimit = false;

      if (error?.status === 429 || error?.code === 429) isRateLimit = true;
      else if (error?.message && (
        String(error.message).includes("429") ||
        String(error.message).toLowerCase().includes("exhausted") ||
        String(error.message).toLowerCase().includes("quota")
      )) isRateLimit = true;
      else if (error?.error) {
        if (
          error.error.code === 429 ||
          error.error.status === "RESOURCE_EXHAUSTED"
        ) isRateLimit = true;

        if (error.error.message && (
          String(error.error.message).includes("429") ||
          String(error.error.message).toLowerCase().includes("exhausted") ||
          String(error.error.message).toLowerCase().includes("quota")
        )) isRateLimit = true;
      }

      if (retries > 0 && isRateLimit) {
        console.warn(`Rate limit detected. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Exponential backoff (1.5x multiplier)
        return makeRequest(retries - 1, delay * 1.5);
      }

      // Clean up error message if possible for the UI
      if (error?.error?.message) {
        throw new Error(error.error.message);
      }
      if (error?.message) {
        throw new Error(error.message);
      }

      throw error;
    }
  };

  return makeRequest();
}
