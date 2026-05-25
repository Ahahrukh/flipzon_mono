import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        name: String,
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }
      }
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    payment: {
      provider: { type: String, default: "razorpay" },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" }
    },
    delivery: {
      partner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["placed", "packed", "out_for_delivery", "delivered", "cancelled"],
        default: "placed"
      },
      address: Object,
      currentLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date
      },
      etaMinutes: Number,
      distanceMeters: Number,
      durationSeconds: Number
    }
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
