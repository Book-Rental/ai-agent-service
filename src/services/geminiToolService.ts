import {
  GoogleGenAI,
} from "@google/genai";

import {
  env,
} from "../config/env.js";

import {
  getGeminiApiTools,
} from "./openApiToolsService.js";


/*
 * --------------------------------------------------
 * Gemini LLM Client
 * --------------------------------------------------
 */

const ai =
  new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
  });


console.log(
  "\n=========================================="
);

console.log(
  "🤖 GEMINI LLM CONFIGURATION"
);

console.log(
  "LLM Provider : Google Gemini"
);

console.log(
  "Model        : gemini-3.5-flash-lite"
);

console.log(
  "API Key      :",
  env.GEMINI_API_KEY
    ? "Configured"
    : "NOT CONFIGURED"
);

console.log(
  "==========================================\n"
);


/*
 * --------------------------------------------------
 * Sleep
 * --------------------------------------------------
 */

const sleep =
  (ms: number) =>
    new Promise(
      (resolve) =>
        setTimeout(resolve, ms)
    );


/*
 * --------------------------------------------------
 * Gemini retry
 * --------------------------------------------------
 */

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
          `Gemini LLM request attempt ${attempt}/${retries}...`
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


/*
 * --------------------------------------------------
 * Clean Gemini response
 *
 * Removes unwanted Markdown formatting
 * before sending the response to frontend.
 * --------------------------------------------------
 */

const cleanUserResponse =
  (text: string): string => {

    return text

      // Remove bold Markdown
      .replace(/\*\*/g, "")

      // Remove italic Markdown
      .replace(/\*/g, "")

      // Remove Markdown headings
      .replace(
        /^#{1,6}\s*/gm,
        ""
      )

      // Remove bullet symbols
      .replace(
        /^\s*[-*]\s+/gm,
        ""
      )

      // Remove backticks
      .replace(
        /`/g,
        ""
      )

      // Remove excessive blank lines
      .replace(
        /\n{3,}/g,
        "\n\n"
      )

      .trim();
  };


/*
 * --------------------------------------------------
 * Generate user-friendly response for
 * requests where no backend API is selected.
 *
 * This prevents technical API information
 * from being shown to the user.
 * --------------------------------------------------
 */

const generateDirectUserResponse =
  async (
    userMessage: string,
    geminiResponse: string
  ): Promise<string> => {

    console.log(
      "\n========== USER-FRIENDLY RESPONSE =========="
    );

    console.log(
      "Converting Gemini response to user-friendly text..."
    );


    const prompt = `
You are a helpful AI assistant for a Book Rental application.

The user asked:

"${userMessage}"

The initial assistant response was:

"${geminiResponse}"

Rewrite the response so that it is suitable for displaying
directly to the user in a frontend chat application.

IMPORTANT RULES:

1. Do not mention APIs.

2. Do not mention API endpoints.

3. Do not mention backend systems.

4. Do not mention HTTP methods.

5. Do not mention routes or URLs.

6. Do not mention database details.

7. Do not explain which APIs are available.

8. Do not explain which APIs are unavailable.

9. Do not say that an API endpoint is missing.

10. Do not expose technical implementation details.

11. If the requested information cannot be provided or the
    user does not have access to it, simply explain that in
    a polite and natural way.

12. Use wording that is understandable to a normal application user.

13. Do not invent information.

14. Keep the response concise.

15. Use plain text only.

16. Do not use Markdown.

17. Do not use ** or *.

18. Do not use # headings.

19. Do not use backticks.

20. Do not use Markdown bullet points.

21. Return only the final response that should be shown to the user.

For example, if the user asks for information that they
cannot access, respond naturally with:

"Sorry, you don't have access to view this information."

Do not explain the technical reason behind the restriction.
`;


    try {

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


      const finalText =
        textPart?.text?.trim() ||
        "Sorry, I can't provide that information.";


      console.log(
        "User-friendly response generated."
      );

      console.log(
        "==========================================\n"
      );


      return cleanUserResponse(
        finalText
      );

    } catch (error) {

      console.error(
        "Failed to generate user-friendly response:",
        error
      );


      /*
       * Fallback response.
       *
       * This is only used if the second
       * Gemini request fails.
       */

      return cleanUserResponse(
        geminiResponse ||
        "Sorry, I can't provide that information."
      );
    }
  };


/*
 * ==================================================
 * Ask Gemini
 *
 * Gemini can either:
 *
 * 1. Answer the user directly
 * 2. Select a backend API tool
 *
 * userId is received from the authenticated
 * request and is used for user-specific APIs.
 * ==================================================
 */

export const getGeminiFunctionCall =
  async (
    message: string,
    userId?: string
  ) => {
    console.log(
      "\n========== GEMINI LLM REQUEST =========="
    );

    console.log(
      "User message:",
      message
    );

    console.log(
      "Authenticated userId:",
      userId || "NOT PROVIDED"
    );

    const apiTools =
      await getGeminiApiTools();

    console.log(
      "Available backend API tools:",
      apiTools.length
    );

    /*
     * =====================================================
     * DETERMINISTIC CHECK FOR CURRENT USER'S ORDERS
     * =====================================================
     *
     * Do not allow Gemini to accidentally select
     * /api/user/me or /api/order for "my orders".
     */

    const normalizedMessage =
      message.toLowerCase().trim();

    const isMyOrdersRequest =
      normalizedMessage.includes("my orders") ||
      normalizedMessage.includes("show my order") ||
      normalizedMessage.includes("get my order") ||
      normalizedMessage.includes("my order history") ||
      normalizedMessage.includes("order history") ||
      normalizedMessage.includes("show my recent orders");

    if (isMyOrdersRequest) {

      if (!userId) {
        console.error(
          "Authenticated user ID is missing for user's orders request."
        );

        throw new Error(
          "Authenticated user ID is not available."
        );
      }

      const orderTool =
        apiTools.find(
          (tool) =>
            tool.name ===
            "get__api_order_getByUserId_userId"
        );

      if (!orderTool) {
        throw new Error(
          "User orders API is not available."
        );
      }

      const functionCall = {
        name:
          "get__api_order_getByUserId_userId",

        args: {
          userId,
        },
      };

      console.log(
        "\n🔒 AUTHENTICATED USER ORDER REQUEST"
      );

      console.log(
        "User message:",
        message
      );

      console.log(
        "Authenticated userId:",
        userId
      );

      console.log(
        "Forcing API:",
        functionCall.name
      );

      console.log(
        "Arguments:",
        functionCall.args
      );

      console.log(
        "========================================\n"
      );

      return {
        functionCall,

        functionCallPart: {
          functionCall,
        },

        selectedTool:
          orderTool,

        response: null,
      };
    }

    /*
     * =====================================================
     * NORMAL GEMINI API SELECTION
     * =====================================================
     *
     * For all other requests Gemini decides which
     * OpenAPI tool should be used.
     */

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

        contents: `
You are an API selection assistant for a Book Rental application.

Select the correct backend API based on the user's request.

IMPORTANT API SELECTION RULES:

1. For requests about the CURRENT LOGGED-IN USER'S ORDERS, use:
   get__api_order_getByUserId_userId

2. NEVER use:
   get__api_order

   for requests about the current user's orders.

3. NEVER use:
   get__api_user_me

   for order-related requests.

4. get__api_user_me is only for profile/account information.

5. Do not invent or guess user IDs.

6. For requests about the user's orders, the authenticated
   user ID is handled by the application.

7. For profile/account requests, use:
   get__api_user_me

User message:

${message}
`,

        config: {
          tools: [
            {
              functionDeclarations,
            },
          ],

          toolConfig: {
            functionCallingConfig: {
              mode: "AUTO",
            },
          },
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
      functionCallPart?.functionCall
    ) {

      const functionCall =
        functionCallPart.functionCall;

      const selectedTool =
        apiTools.find(
          (tool) =>
            tool.name ===
            functionCall.name
        );

      console.log(
        "\n🔧 GEMINI SELECTED BACKEND API"
      );

      console.log(
        "API:",
        functionCall.name
      );

      console.log(
        "Arguments:",
        functionCall.args
      );

      console.log(
        "========================================\n"
      );

      return {
        functionCall,
        functionCallPart,
        selectedTool,
        response,
      };
    }

    /*
     * =====================================================
     * GEMINI DIRECT RESPONSE
     * =====================================================
     */

    const textPart =
      parts.find(
        (part: any) =>
          part.text
      );

    const initialResponse =
      textPart?.text?.trim() ||
      "I could not generate a response.";

    console.log(
      "\n🧠 GEMINI ANSWERED DIRECTLY"
    );

    console.log(
      "No backend API was selected."
    );

    const directResponse =
      await generateDirectUserResponse(
        message,
        initialResponse
      );

    console.log(
      "========================================\n"
    );

    return {
      functionCall: null,
      functionCallPart: null,
      selectedTool: null,
      response,
      directResponse,
    };
  };

/*
 * ==================================================
 * Generate final response from backend data
 *
 * This is used when Gemini selected and
 * executed a backend API.
 * ==================================================
 */

export const generateNaturalLanguageResponse =
  async (
    userMessage: string,
    apiResponse: unknown
  ): Promise<string> => {

    console.log(
      "\n========== FINAL GEMINI RESPONSE =========="
    );

    console.log(
      "Sending backend response to Gemini LLM..."
    );


    const prompt = `
You are a helpful Book Rental AI Assistant.

The user asked:

"${userMessage}"

The backend returned application data:

${JSON.stringify(
  apiResponse,
  null,
  2
)}

Generate a clear, useful and natural response
for the user.

IMPORTANT RULES:

1. Do NOT show raw JSON.

2. Do NOT show internal database fields such as:
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

3. Show only information that is useful
   and understandable to the user.

4. Do NOT mention technical implementation details.

5. Do NOT mention API endpoints.

6. Do NOT mention HTTP methods.

7. Do NOT mention backend systems.

8. Do NOT mention database implementation.

9. Do NOT mention routes or URLs.

10. Do NOT expose internal technical information.

11. If the requested information is not available
    or the user does not have permission to access it,
    give a short, polite and user-friendly response.

12. Do not explain technical reasons to the user.

13. Do not invent information.

14. If multiple records are returned, present them
    as a simple numbered list.

15. Keep descriptions concise.

16. If a value is unavailable or null,
    do not show it.

17. Use ₹ for prices when the response contains prices.

18. Make the response natural and easy to read
    in a frontend chat interface.

19. Do not use Markdown formatting.

20. Do not use ** or *.

21. Do not use # headings.

22. Do not use backticks.

23. Do not use Markdown bullet points.

24. Answer directly and naturally.

25. Return only the final user-friendly response.
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


    console.log(
      "Final response generated by Gemini LLM."
    );

    console.log(
      "==========================================\n"
    );


    const finalText =
      textPart?.text?.trim() ||
      "I found the information, but I couldn't format the response.";


    /*
     * Final cleanup.
     *
     * This guarantees that unwanted Markdown
     * characters are removed before the
     * response reaches the frontend.
     */

    return cleanUserResponse(
      finalText
    );
  };