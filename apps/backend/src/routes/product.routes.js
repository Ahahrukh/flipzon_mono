import multer from "multer";
import { Router } from "express";
import { createProduct, deleteProduct, getProduct, listProducts, updateProduct, uploadProductsCsv } from "../controllers/product.controller.js";
import { authorize, protect } from "../middleware/auth.middleware.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", protect, authorize("seller"), createProduct);
router.patch("/:id", protect, authorize("seller"), updateProduct);
router.delete("/:id", protect, authorize("seller"), deleteProduct);
router.post("/bulk-csv", protect, authorize("seller"), upload.single("file"), uploadProductsCsv);

export default router;
