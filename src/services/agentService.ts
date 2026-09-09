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
    authorization?: string
  ) {

    console.log(
      "User message received by Agent:",
      message
    );

    console.log(
      "Authorization received by Agent:",
      authorization
        ? "Token present"
        : "No token"
    );

    try {

      /*
       * STEP 1
       * Ask Gemini to select the API
       */
      const result =
        await getGeminiFunctionCall(
          message
        );


      const functionCall =
        result.functionCall;

      const functionCallPart =
        result.functionCallPart;

      const selectedTool =
        result.selectedTool;


      /*
       * Gemini didn't select an API
       */
      if (
        !functionCall ||
        !functionCallPart ||
        !selectedTool
      ) {

        console.log(
          "Gemini did not select an API."
        );

        const parts =
          result.response
            ?.candidates?.[0]
            ?.content?.parts || [];

        const textPart =
          parts.find(
            (part: any) =>
              part.text
          );

        return {
          reply:
            textPart?.text ||
            "I could not understand your request.",

          intent:
            "UNKNOWN",

          data:
            null,
        };
      }


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
       * STEP 2
       * Execute selected API through MCP
       */
      const toolResult =
        await executeGeminiTool(
          selectedTool,
          functionCall.args || {},
          authorization
        );


      console.log(
        "API executed successfully."
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
       * STEP 3
       * Parse MCP response
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
       * STEP 4
       * Ask Gemini to convert raw API
       * response into a useful response.
       */
      const userFriendlyResponse =
        await generateNaturalLanguageResponse(
          message,
          parsedData
        );


      /*
       * STEP 5
       * Return response to frontend
       */
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