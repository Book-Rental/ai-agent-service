import {
  getGeminiFunctionCall,
} from "./geminiToolService.js";

const run = async () => {
  const message =
    "Get me the details of book 6a97c87ebbe3c9ec476220db";

  console.log(
    "\nUser:",
    message
  );

  const result =
    await getGeminiFunctionCall(
      message
    );

  console.log(
    "\nGemini selected tool:"
  );

  console.log(
    JSON.stringify(
      result.functionCall,
      null,
      2
    )
  );
};

run().catch((error) => {
  console.error(
    "Function call test failed:",
    error
  );
});