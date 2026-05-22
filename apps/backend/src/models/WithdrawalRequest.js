import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ["pending", "approved", "rejected", "paid"], default: "pending" },
    note: String,
    adminNote: String
  },
  { timestamps: true }
);

export default mongoose.model("WithdrawalRequest", withdrawalRequestSchema);
