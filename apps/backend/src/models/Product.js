import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    description: String,
    category: { type: String, required: true, index: true },
    brand: String,
    imageUrl: String,
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "piece" },
    tags: [String],
    status: { type: String, enum: ["active", "out_of_stock", "disabled"], default: "active" }
  },
  { timestamps: true }
);

productSchema.index({ seller: 1, sku: 1 }, { unique: true });
productSchema.index({ name: "text", category: "text", brand: "text" });

export default mongoose.model("Product", productSchema);
