import { Router } from "express";
import {
  adminProducts,
  createOffer,
  listWithdrawals,
  sellers,
  updateSellerStatus,
  updateWithdrawal
} from "../controllers/admin.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect, authorize("admin"));
router.get("/products", adminProducts);
router.get("/sellers", sellers);
router.get("/withdrawals", listWithdrawals);
router.patch("/sellers/:id/status", updateSellerStatus);
router.post("/offers", createOffer);
router.patch("/withdrawals/:id", updateWithdrawal);

export default router;
