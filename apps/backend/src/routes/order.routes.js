import { Router } from "express";
import { createOrder, myOrders, verifyOrderPayment } from "../controllers/order.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", protect, authorize("user"), createOrder);
router.post("/verify-payment", protect, authorize("user"), verifyOrderPayment);
router.get("/mine", protect, authorize("user"), myOrders);

export default router;
