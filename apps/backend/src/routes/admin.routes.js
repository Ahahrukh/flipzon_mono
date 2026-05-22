import { Router } from "express";
import {
  adminProducts,
  adminOrders,
  adminTickets,
  assignDeliveryPartner,
  createOffer,
  deliveryPartners,
  listWithdrawals,
  sellers,
  users,
  updateSellerStatus,
  updateWithdrawal
} from "../controllers/admin.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/products", adminProducts);
router.get("/users", users);
router.get("/sellers", sellers);
router.get("/delivery-partners", deliveryPartners);
router.get("/orders", adminOrders);
router.get("/tickets", adminTickets);
router.get("/withdrawals", listWithdrawals);
router.patch("/orders/:id/assign-delivery", assignDeliveryPartner);
router.patch("/sellers/:id/status", updateSellerStatus);
router.post("/offers", createOffer);
router.patch("/withdrawals/:id", updateWithdrawal);

export default router;
