import dotenv from "dotenv";

dotenv.config();

const BASE_URL =
    process.env.BASE_URL || "";

export const env = {
    PORT: Number(process.env.PORT) || 5001,

    BASE_URL,

    MCP_SERVER_URL: `${BASE_URL}/mcp`,

    OPENAPI_URL: `${BASE_URL}/openapi.json`,

    GEMINI_API_KEY:
        process.env.GEMINI_API_KEY || "",
};

if (!env.BASE_URL) {
    console.warn("BASE_URL is not configured");
}

if (!env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not configured");
}