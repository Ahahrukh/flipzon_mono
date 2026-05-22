import { Router } from "express";
import { assignedOrders, updateDeliveryLocation } from "../controllers/delivery.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/orders", protect, authorize("delivery_partner"), assignedOrders);
router.patch("/orders/:orderId/location", protect, authorize("delivery_partner"), updateDeliveryLocation);

export default router;
