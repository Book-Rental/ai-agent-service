import {
  getGeminiFunctionCall,
  generateNaturalLanguageResponse,
} from "./geminiToolService.js";

import {
  executeGeminiTool,
} from "./apiToolExecutor.js";


export const agentService = {

  async processMessage(
    message: string,
    authorization?: string,
    userId?: string
  ) {

    console.log(
      "\n\n=========================================="
    );

    console.log(
      "🚀 AI AGENT REQUEST"
    );

    console.log(
      "User message:",
      message
    );

    console.log(
      "Authorization:",
      authorization
        ? "Token present"
        : "No token"
    );

    console.log(
      "Authenticated userId:",
      userId || "NOT PROVIDED"
    );

    console.log(
      "=========================================="
    );


    try {

      /*
       * ==================================================
       * STEP 1
       *
       * Ask Gemini to understand the user's request
       * and select the appropriate backend API.
       * ==================================================
       */

      const result =
        await getGeminiFunctionCall(
          message,
          userId
        );


      const functionCall =
        result.functionCall;

      const functionCallPart =
        result.functionCallPart;

      const selectedTool =
        result.selectedTool;


      /*
       * ==================================================
       * CASE 1
       *
       * Gemini answered directly.
       *
       * No API.
       * No MCP.
       * No backend.
       * ==================================================
       */

      if (
        !functionCall ||
        !functionCallPart ||
        !selectedTool
      ) {

        console.log(
          "\n🧠 GENERAL LLM RESPONSE"
        );

        console.log(
          "Gemini answered without backend API."
        );


        return {

          reply:
            result.directResponse,

          intent:
            "GENERAL",

          data:
            null,

        };
      }


      /*
       * ==================================================
       * CASE 2
       *
       * Gemini selected a backend API.
       * ==================================================
       */

      console.log(
        "\n🔧 BACKEND API FLOW"
      );

      console.log(
        "Selected API:",
        functionCall.name
      );

      console.log(
        "Tool arguments:",
        functionCall.args
      );

      console.log(
        "API definition:",
        selectedTool._api
      );


      /*
       * ==================================================
       * STEP 2
       *
       * Execute API through MCP.
       *
       * The Authorization header is forwarded so that
       * protected APIs such as /api/order/me can
       * authenticate the logged-in user.
       * ==================================================
       */

      const toolResult =
        await executeGeminiTool(

          selectedTool,

          functionCall.args || {},

          authorization

        );


      console.log(
        "\n✅ Backend API executed."
      );


      console.log(
        "Raw MCP result:",
        JSON.stringify(
          toolResult,
          null,
          2
        )
      );


      /*
       * ==================================================
       * STEP 3
       *
       * Parse MCP response.
       * ==================================================
       */

      let parsedData: any =
        toolResult;


      try {

        const firstContent =
          toolResult?.content?.[0];


        if (
          firstContent &&
          firstContent.type === "text"
        ) {

          const rawText =
            firstContent.text;


          if (rawText) {

            parsedData =
              JSON.parse(
                rawText
              );

          }
        }

      } catch (parseError) {

        console.error(
          "Failed to parse MCP response:",
          parseError
        );

        parsedData =
          toolResult;
      }


      /*
       * ==================================================
       * STEP 4
       *
       * Check whether the backend returned an error.
       *
       * IMPORTANT:
       *
       * We do NOT hard-code the final user message here.
       *
       * Instead, we send the backend result to Gemini.
       * Gemini converts the authentication error into
       * natural user-friendly language.
       * ==================================================
       */

      const userFriendlyResponse =
        await generateNaturalLanguageResponse(

          message,

          parsedData

        );


      /*
       * ==================================================
       * STEP 5
       *
       * Return response to frontend.
       * ==================================================
       */

      console.log(
        "\n✅ AI AGENT REQUEST COMPLETED"
      );


      return {

        reply:
          userFriendlyResponse,

        intent:
          functionCall.name,

        data:
          parsedData,

      };


    } catch (error: any) {

      console.error(
        "Agent service error:",
        error
      );


      /*
       * IMPORTANT:
       *
       * Do not hide the original error completely.
       *
       * If Gemini itself fails or the MCP request fails,
       * we return a generic technical-safe response.
       *
       * Backend authentication errors should ideally
       * reach generateNaturalLanguageResponse() above.
       */

      return {

        reply:
          "Sorry, I was unable to process your request.",

        intent:
          "UNKNOWN",

        data:
          null,

      };
    }
  },
};