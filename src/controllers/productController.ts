import { Request, Response } from "express";
import { productTools } from "../tools/productTools.js";


export const productController = {
  async getProduct(req: Request, res: Response) {
    try {
      const id = String(req.params.id);

      const data = await productTools.getProductDetails(id);

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get product",
      });
    }
  },
};