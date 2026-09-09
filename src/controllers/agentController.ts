import { Request, Response } from "express";
import { agentService } from "../services/agentService.js";

export const agentController = {
  async chat(req: Request, res: Response) {
    try {
      const { message } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          message: "Message is required",
        });
      }

      // Get Authorization header from frontend
      const authorization = req.headers.authorization;

      console.log(
        "Incoming Authorization:",
        authorization
          ? "Token present"
          : "No token"
      );

      const result =
        await agentService.processMessage(
          message,
          authorization
        );

      return res.status(200).json({
        success: true,
        data: result,
      });

    } catch (error: any) {
      console.error(
        "Agent chat error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to process request",
      });
    }
  },
};