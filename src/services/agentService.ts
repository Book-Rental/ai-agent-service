import { geminiService } from "../services/geminiService.js";
import { bookTools } from "../tools/bookTools.js";
import {
  AgentResult,
  Book,
} from "../types/agent.types.js";

const createBookSummary = (book: any): string => {
  const data = book?.data || book;

  const rentPrice = data.rentalPricePerDay;
  const weekPrice = data.rentalPricePerWeek;
  const monthPrice = data.rentalPricePerMonth;

  const rentText =
    data.availableForRent === true
      ? `Available for rent at ${rentPrice}/day`
      : "Not available for rent";

  const saleText =
    data.availableForSale === true
      ? `Available for sale at ${data.purchasePrice}`
      : "Not available for sale";

  return [
    `Book: ${data.name}`,
    `Author: ${data.author || "Unknown"}`,
    `Language: ${data.language || "Unknown"}`,
    `Condition: ${data.condition || "Unknown"}`,
    `Rental: ${rentText}`,
    `Weekly rental: ${weekPrice ?? "N/A"}`,
    `Monthly rental: ${monthPrice ?? "N/A"}`,
    `Sale: ${saleText}`,
    `Availability: ${data.availabilityStatus || "Unknown"}`,
  ].join("\n");
};

export const agentService = {
  async processMessage(message: string) {
    console.log(
      "User message received by Agent:",
      message
    );

    // 1. Ask LLM to understand user request
    const llmResponse =
      await geminiService.understandMessage(message);

    if (!llmResponse) {
      return {
        reply: "I could not understand your request.",
        intent: "UNKNOWN",
        data: null,
      };
    }

    // 2. Parse LLM response
    let aiResult: AgentResult;

    try {
      aiResult = JSON.parse(llmResponse);
    } catch (error) {
      console.error(
        "Failed to parse Gemini response:",
        error
      );

      return {
        reply: "I could not understand your request.",
        intent: "UNKNOWN",
        data: null,
      };
    }

    const { intent, filters } = aiResult;

    console.log("Detected intent:", intent);
    console.log("Detected filters:", filters);

    // 3. Get specific book details
    if (
      intent === "GET_BOOK_DETAILS" &&
      filters?.name
    ) {
      console.log(
        "Agent selected: GET_BOOK_DETAILS"
      );

      const book = await bookTools.findBookByName(
        filters.name
      );

      if (!book) {
        return {
          reply: `I could not find a book named "${filters.name}".`,
          intent,
          data: null,
        };
      }

      return {
        reply: createBookSummary(book),
        intent,
        data: book,
      };
    }

    // 4. Search books using dynamic filters
    if (intent === "SEARCH_BOOKS") {
      console.log(
        "Agent selected: SEARCH_BOOKS"
      );

      const books = await bookTools.searchBooks(
        filters
      );

      if (books.length === 0) {
        return {
          reply:
            "I could not find any books matching those criteria.",
          intent,
          data: [],
        };
      }

      return {
        reply: `I found ${books.length} matching book${
          books.length > 1 ? "s" : ""
        }.`,
        intent,
        data: books,
      };
    }

    // 5. Unsupported request
    return {
      reply:
        "I can currently help you search for books and get book details.",
      intent: "UNKNOWN",
      data: null,
    };
  },
};