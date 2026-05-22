import { Router } from "express";
import { listNotifications, markRead } from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", protect, listNotifications);
router.patch("/read", protect, markRead);

export default router;
