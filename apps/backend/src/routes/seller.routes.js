import { Router } from "express";
import { earningSummary, requestWithdrawal, sellerProducts, sellerWithdrawals, updateAvailability } from "../controllers/seller.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/earnings", protect, authorize("seller"), earningSummary);
router.get("/products", protect, authorize("seller"), sellerProducts);
router.get("/withdrawals", protect, authorize("seller"), sellerWithdrawals);
router.post("/withdrawals", protect, authorize("seller"), requestWithdrawal);
router.patch("/availability", protect, authorize("seller"), updateAvailability);

export default router;
