import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    replies: [
      {
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
