import { Router } from "express";
import { agentController } from "../controllers/agentController.js";


const router = Router();

router.post("/chat", agentController.chat);

export default router;