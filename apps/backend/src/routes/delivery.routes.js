import { Router } from "express";
import { acceptOrder, assignedOrders, availableOrders, updateDeliveryLocation } from "../controllers/delivery.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/orders", protect, authorize("delivery_partner"), assignedOrders);
router.get("/available-orders", protect, authorize("delivery_partner"), availableOrders);
router.patch("/orders/:orderId/accept", protect, authorize("delivery_partner"), acceptOrder);
router.patch("/orders/:orderId/location", protect, authorize("delivery_partner"), updateDeliveryLocation);

export default router;
