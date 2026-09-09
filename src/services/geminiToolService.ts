import {
  GoogleGenAI,
} from "@google/genai";

import {
  env,
} from "../config/env.js";

import {
  getGeminiApiTools,
} from "./openApiToolsService.js";

const ai =
  new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });

const sleep =
  (ms: number) =>
    new Promise(
      (resolve) =>
        setTimeout(resolve, ms)
    );

const generateWithRetry =
  async (
    request: any,
    retries = 2
  ) => {

    for (
      let attempt = 1;
      attempt <= retries;
      attempt++
    ) {

      try {

        console.log(
          `Gemini request attempt ${attempt}/${retries}...`
        );

        return await ai.models.generateContent(
          request
        );

      } catch (error: any) {

        if (
          error?.status !== 503 ||
          attempt === retries
        ) {
          throw error;
        }

        const delay =
          attempt * 2000;

        console.log(
          `Gemini returned 503. Retrying in ${
            delay / 1000
          } seconds...`
        );

        await sleep(delay);
      }
    }

    throw new Error(
      "Gemini request failed after retries."
    );
  };


/**
 * Select API dynamically using OpenAPI tools
 */
export const getGeminiFunctionCall =
  async (
    message: string
  ) => {

    console.log(
      "Sending user message to Gemini..."
    );

    const apiTools =
      await getGeminiApiTools();

    const functionDeclarations =
      apiTools.map(
        (tool) => ({
          name:
            tool.name,

          description:
            tool.description,

          parameters:
            tool.parameters,
        })
      );

    const response =
      await generateWithRetry({
        model:
          "gemini-3.5-flash-lite",

        contents:
          message,

        config: {
          tools: [
            {
              functionDeclarations,
            },
          ],
        },
      });

    const parts =
      response
        .candidates?.[0]
        ?.content
        ?.parts || [];

    const functionCallPart =
      parts.find(
        (part: any) =>
          part.functionCall
      );

    if (
      !functionCallPart?.functionCall
    ) {
      return {
        functionCall: null,
        functionCallPart: null,
        selectedTool: null,
        response,
      };
    }

    const functionCall =
      functionCallPart.functionCall;

    const selectedTool =
      apiTools.find(
        (tool) =>
          tool.name ===
          functionCall.name
      );

    return {
      functionCall,
      functionCallPart,
      selectedTool,
      response,
    };
  };


/**
 * Convert raw API response into
 * a user-friendly conversational response.
 */
export const generateNaturalLanguageResponse =
  async (
    userMessage: string,
    apiResponse: unknown
  ): Promise<string> => {

    console.log(
      "Generating user-friendly response..."
    );

    const prompt = `
You are a helpful Book Rental AI Assistant.

The user asked:
"${userMessage}"

The backend API returned this data:

${JSON.stringify(
  apiResponse,
  null,
  2
)}

Your job is to answer the user's request using the API data.

IMPORTANT RULES:

1. Do NOT show the raw JSON response.
2. Do NOT show MongoDB fields such as:
   _id
   createdAt
   updatedAt
   version
   sellerId
   createdBy
   updatedBy
   isActive
   isAvailable
   auctionId
3. Show only information useful to the user.
4. For books, prefer:
   - Book name
   - Author
   - Description
   - Language
   - Edition
   - Rental price
   - Purchase price
   - Availability
   - Category
5. If multiple books are returned, show them as a numbered list.
6. Keep descriptions concise.
7. Do not invent information that is not present in the API response.
8. If a value is unavailable or null, simply don't show it.
9. Make the response easy to read in a chatbot.
10. Use ₹ for prices when the API contains prices.
11. Do not say "Request completed successfully".
12. Answer directly without explaining how you processed the request.

Return only the final response that should be shown to the user.
`;

    const response =
      await generateWithRetry({
        model:
          "gemini-3.5-flash-lite",

        contents:
          prompt,
      });

    const parts =
      response
        .candidates?.[0]
        ?.content
        ?.parts || [];

    const textPart =
      parts.find(
        (part: any) =>
          part.text
      );

    return (
      textPart?.text?.trim() ||
      "I found the information, but I couldn't format the response."
    );
  };