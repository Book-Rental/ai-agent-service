import { backendClient } from "../config/backendClient.js";

export const orderTools = {
  async getOrderDetails(orderId: string) {
    try {
      const response = await backendClient.get(
        `/api/orders/${orderId}`
      );

      return response.data;
    } catch (error: any) {
      console.error(
        "Error getting order details:",
        error.response?.data || error.message
      );

      throw new Error("Failed to get order details");
    }
  },
};