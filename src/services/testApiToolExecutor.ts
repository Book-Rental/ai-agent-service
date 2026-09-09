import {
  executeGeminiTool,
} from "./apiToolExecutor.js";

const run = async () => {
  console.log(
    "Testing Gemini tool → MCP → Backend..."
  );

  const result =
    await executeGeminiTool(
      "getBookById",
      {
        id: "6a97c87ebbe3c9ec476220db",
      }
    );

  console.log(
    "\nFinal MCP result:"
  );

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(
    "API tool execution failed:",
    error
  );
});