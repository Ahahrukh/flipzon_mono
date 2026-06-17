import { Router } from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { chatWithBot } from "../controllers/chat.controller.js";

const router = Router();

router.post("/", optionalAuth, chatWithBot);

export default router;
