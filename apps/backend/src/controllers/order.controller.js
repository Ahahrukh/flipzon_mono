import Earning from "../models/Earning.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { notify } from "../services/notification.service.js";
import { createPaymentOrder, verifyPaymentSignature } from "../services/razorpay.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createOrder = asyncHandler(async (req, res) => {
  const { items, address } = req.body;
  const ids = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: ids }, status: "active" });

  const orderItems = items.map((item) => {
    const product = products.find((entry) => entry._id.toString() === item.product);
    if (!product || product.stock < item.quantity) throw new Error(`Product unavailable: ${item.product}`);
    return {
      product: product._id,
      seller: product.seller,
      name: product.name,
      quantity: item.quantity,
      price: product.price
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = req.user.referralDiscountAvailable ? Math.round(subtotal * 0.2) : 0;
  const total = Math.max(subtotal - discount, 0);
  const paymentOrder = await createPaymentOrder({ amount: total, receipt: `flipzon_${Date.now()}` });

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    subtotal,
    discount,
    total,
    payment: { razorpayOrderId: paymentOrder.id },
    delivery: { address }
  });

  await notify({
    role: "admin",
    title: "New order placed",
    message: `Order ${order._id} is waiting for payment confirmation.`,
    data: { orderId: order._id }
  });

  res.status(201).json({ order, razorpayOrder: paymentOrder });
});

export const verifyOrderPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await Order.findById(orderId);
  if (!order || order.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Order not found");
  }

  const verified = verifyPaymentSignature({
    razorpayOrderId: order.payment.razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });
  if (!verified) {
    res.status(400);
    throw new Error("Payment verification failed");
  }

  order.payment.status = "paid";
  order.payment.razorpayPaymentId = razorpayPaymentId;
  await order.save();

  if (req.user.referralDiscountAvailable) {
    req.user.referralDiscountAvailable = false;
    await req.user.save();
  }

  await Promise.all(
    order.items.map((item) =>
      Earning.create({
        seller: item.seller,
        order: order._id,
        grossAmount: item.price * item.quantity,
        platformFee: Math.round(item.price * item.quantity * 0.08),
        netAmount: Math.round(item.price * item.quantity * 0.92)
      })
    )
  );

  await notify({ recipient: req.user._id, title: "Payment received", message: "Your order is confirmed." });
  res.json({ order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate("items.product").sort("-createdAt");
  res.json({ orders });
});
