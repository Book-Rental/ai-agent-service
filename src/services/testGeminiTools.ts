import { geminiService } from "./geminiService.js";

const run = async () => {
  const message =
    "Get me the details of book 123";

  console.log(
    "\nUser:",
    message
  );

  const response =
    await geminiService.understandMessage(
      message
    );

  console.log(
    "\nGemini response:"
  );

  console.log(
    JSON.stringify(
      response,
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(
    "Gemini tools test failed:",
    error
  );
});