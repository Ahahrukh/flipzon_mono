import crypto from "crypto";
import Razorpay from "razorpay";
import { env } from "../config/env.js";

const razorpay = new Razorpay({
  key_id: env.razorpayKeyId || "rzp_test_placeholder",
  key_secret: env.razorpayKeySecret || "placeholder"
});

export const createPaymentOrder = async ({ amount, receipt }) => {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    return {
      id: `dev_order_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt
    };
  }

  return razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
    payment_capture: 1
  });
};

export const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!env.razorpayKeySecret) return true;
  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac("sha256", env.razorpayKeySecret).update(payload).digest("hex");
  return expected === razorpaySignature;
};
