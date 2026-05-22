import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    role: { type: String, enum: ["admin", "seller", "user", "delivery_partner"] },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    data: Object,
    readAt: Date
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
