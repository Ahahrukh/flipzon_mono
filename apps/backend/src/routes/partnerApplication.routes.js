import { Router } from "express";
import { createPartnerApplication } from "../controllers/partnerApplication.controller.js";
import { optionalAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", optionalAuth, createPartnerApplication);

export default router;
