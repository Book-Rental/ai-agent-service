import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 5001,

  EXISTING_BACKEND_URL:
    process.env.EXISTING_BACKEND_URL ||
    "https://be-book-rental.onrender.com",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};

if (!env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not configured");
}