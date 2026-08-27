import { backendClient } from "../config/backendClient.js";

export const productTools = {
  // Get a single book by ID
  async getProductDetails(productId: string) {
    try {
      const response = await backendClient.get(
        `/api/book/${productId}`
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error getting book details:",
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message || "Failed to get book details"
      );
    }
  },

  // Get all books
  async getAllProducts(language: string = "all") {
    try {
      const response = await backendClient.get("/api/book", {
        params: {
          language,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error(
        "Error getting books:",
        error.response?.data || error.message
      );

      throw new Error(
        error.response?.data?.message || "Failed to get books"
      );
    }
  },
};