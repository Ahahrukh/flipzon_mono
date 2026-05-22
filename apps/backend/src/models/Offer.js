import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    discountType: { type: String, enum: ["percentage", "flat"], default: "percentage" },
    discountValue: { type: Number, required: true },
    maxDiscount: Number,
    startsAt: Date,
    endsAt: Date,
    isActive: { type: Boolean, default: true },
    appliesTo: {
      sellers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      categories: [String]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Offer", offerSchema);
