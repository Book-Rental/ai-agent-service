import { Router } from "express";
import { productController } from "../controllers/productController.js";

const router = Router();

router.get("/:id", productController.getProduct);

export default router;