
import {
  getGeminiFunctionCall,
  generateFinalResponse,
} from "./geminiToolService.js";

import {
  executeGeminiTool,
} from "./apiToolExecutor.js";

const run = async () => {
  const message =
    "Get me the details of book 6a97c87ebbe3c9ec476220db";

  console.log("\nUser:", message);

  // Step 1: Gemini selects API
  const result =
    await getGeminiFunctionCall(message);

  const functionCall =
    result.functionCall;

  const functionCallPart =
    result.functionCallPart;

  if (!functionCall || !functionCallPart) {
    console.log(
      "Gemini did not select an API."
    );

    return;
  }

  console.log(
    "\nSelected API:",
    functionCall.name
  );

  // Step 2: Execute API through MCP
  const toolResult =
    await executeGeminiTool(
      functionCall.name!,
      functionCall.args || {}
    );

  console.log(
    "\nAPI executed successfully."
  );

  // Step 3: Gemini generates final answer
  const finalResponse =
    await generateFinalResponse(
      message,
      functionCallPart,
      toolResult
    );

  console.log(
    "\nFinal AI Response:"
  );

  console.log(finalResponse);
};

run().catch((error) => {
  console.error(
    "Final response test failed:",
    error
  );
});

