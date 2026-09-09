import {
  getGeminiFunctionCall,
} from "./geminiToolService.js";

import {
  executeGeminiTool,
} from "./apiToolExecutor.js";

const run = async () => {
  const message =
    "Get me the details of book 6a97c87ebbe3c9ec476220db";

  console.log("\nUser:", message);

  // 1. Ask Gemini to select the API
  const result =
    await getGeminiFunctionCall(message);

  const functionCall =
    result.functionCall;

  if (!functionCall) {
    console.log(
      "Gemini did not select any API."
    );

    return;
  }

  console.log(
    "\nGemini selected:"
  );

  console.log(
    JSON.stringify(
      functionCall,
      null,
      2
    )
  );

  // 2. Execute the selected API through MCP
  const apiResult =
    await executeGeminiTool(
      functionCall.name!,
      functionCall.args || {}
    );

  console.log(
    "\nBackend result through MCP:"
  );

  console.log(
    JSON.stringify(
      apiResult,
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(
    "Gemini → MCP test failed:",
    error
  );
});