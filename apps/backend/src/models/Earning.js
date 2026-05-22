import mongoose from "mongoose";

const earningSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    grossAmount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "available", "withdrawn"], default: "available" }
  },
  { timestamps: true }
);

export default mongoose.model("Earning", earningSchema);
