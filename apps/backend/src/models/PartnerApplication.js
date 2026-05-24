import mongoose from "mongoose";

const partnerApplicationSchema = new mongoose.Schema(
  {
    requestedRole: { type: String, enum: ["seller", "delivery_partner"], required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    storeName: { type: String, trim: true },
    vehicleType: { type: String, trim: true },
    note: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

partnerApplicationSchema.index({ phone: 1, requestedRole: 1, status: 1 });

export default mongoose.model("PartnerApplication", partnerApplicationSchema);
