import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY,
});

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const geminiService = {
  async understandMessage(
    message: string
  ): Promise<string | undefined> {
    console.log("1. Sending request to Gemini...");

    const prompt = `
You are the language-understanding layer of a book rental AI agent.

Your job is to understand the user's request and extract search criteria dynamically.

Supported intents:

- GET_BOOK_DETAILS
  Use when the user wants detailed information about a specific book.

- SEARCH_BOOKS
  Use when the user wants to find one or more books.

- UNKNOWN
  Use when the request is not related to books.

The user may identify or filter books using:

- book name
- author
- language
- category
- rental price per day
- rental price per week
- rental price per month
- purchase price
- availability for rent
- availability for sale

The user can combine multiple criteria.

Rules:

1. Do NOT invent values.
2. Extract only values actually present in the user's message.
3. Return ONLY valid JSON.
4. Numeric prices must be numbers, not strings.
5. Boolean availability values must be true, false, or null.
6. If a value is not mentioned, return null.

Return JSON using this structure:

{
  "intent": "GET_BOOK_DETAILS | SEARCH_BOOKS | UNKNOWN",
  "filters": {
    "name": string | null,
    "author": string | null,
    "language": string | null,
    "category": string | null,
    "rentalPricePerDay": {
      "operator": "eq | lt | lte | gt | gte | null",
      "value": number | null
    },
    "rentalPricePerWeek": {
      "operator": "eq | lt | lte | gt | gte | null",
      "value": number | null
    },
    "rentalPricePerMonth": {
      "operator": "eq | lt | lte | gt | gte | null",
      "value": number | null
    },
    "purchasePrice": {
      "operator": "eq | lt | lte | gt | gte | null",
      "value": number | null
    },
    "availableForRent": boolean | null,
    "availableForSale": boolean | null
  }
}

Operator rules:

- "under", "less than" => lt
- "at most", "less than or equal to" => lte
- "over", "more than" => gt
- "at least", "greater than or equal to" => gte
- "exactly", "equal to" => eq

User message:
"${message}"
`;

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `Gemini request attempt ${attempt}/${maxRetries}...`
        );

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        console.log("2. Gemini API responded");

        console.log(
          "3. Gemini result:",
          response.text
        );

        return response.text;
      } catch (error: any) {
        const status = error?.status;

        console.error(
          `Gemini attempt ${attempt} failed. Status:`,
          status
        );

        // 503 = temporary service problem
        if (status === 503 && attempt < maxRetries) {
          const delay =
            Math.pow(2, attempt - 1) * 2000;

          console.log(
            `Gemini temporarily unavailable. Retrying in ${
              delay / 1000
            } seconds...`
          );

          await sleep(delay);
          continue;
        }

        // 429 = quota/rate limit
        if (status === 429) {
          console.error(
            "Gemini API quota/rate limit exceeded."
          );

          throw new Error(
            "Gemini API quota exceeded. Please check your Gemini API plan and billing."
          );
        }

        console.error(
          "Gemini API error:",
          error
        );

        throw error;
      }
    }

    return undefined;
  },
};