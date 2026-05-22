import Offer from "../models/Offer.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import { notify } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminProducts = asyncHandler(async (req, res) => {
  const { seller, category, status, q } = req.query;
  const filter = {};
  if (seller) filter.seller = seller;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };
  const products = await Product.find(filter).populate("seller", "name email phone sellerProfile isActive").sort("-createdAt");
  res.json({ products });
});

export const sellers = asyncHandler(async (_req, res) => {
  const sellersList = await User.find({ role: "seller" }).select("-passwordHash -otp").sort("-createdAt");
  res.json({ sellers: sellersList });
});

export const users = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const filter = role ? { role } : {};
  const usersList = await User.find(filter).select("-passwordHash -otp").sort("-createdAt");
  res.json({ users: usersList });
});

export const deliveryPartners = asyncHandler(async (_req, res) => {
  const partners = await User.find({ role: "delivery_partner" }).select("-passwordHash -otp").sort("-createdAt");
  res.json({ partners });
});

export const adminOrders = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.query;
  const filter = {};
  if (status) filter["delivery.status"] = status;
  if (paymentStatus) filter["payment.status"] = paymentStatus;
  const orders = await Order.find(filter)
    .populate("user", "name email phone")
    .populate("delivery.partner", "name phone")
    .populate("items.product", "name")
    .sort("-createdAt");
  res.json({ orders });
});

export const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const partner = await User.findOne({ _id: req.body.partnerId, role: "delivery_partner", isActive: true });
  if (!partner) {
    res.status(404);
    throw new Error("Delivery partner not found");
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { "delivery.partner": partner._id, "delivery.status": "out_for_delivery" },
    { new: true }
  );
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  await notify({
    recipient: partner._id,
    title: "New delivery assigned",
    message: `Order ${order._id} is assigned to you.`,
    data: { orderId: order._id }
  });
  res.json({ order });
});

export const adminTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const tickets = await Ticket.find(filter).populate("user", "name email phone").populate("order", "total delivery.status").sort("-createdAt");
  res.json({ tickets });
});

export const updateSellerStatus = asyncHandler(async (req, res) => {
  const seller = await User.findOneAndUpdate(
    { _id: req.params.id, role: "seller" },
    { isActive: req.body.isActive },
    { new: true }
  ).select("-passwordHash -otp");
  if (!seller) {
    res.status(404);
    throw new Error("Seller not found");
  }
  await notify({
    recipient: seller._id,
    title: seller.isActive ? "Seller account enabled" : "Seller account disabled",
    message: "Admin updated your seller account status."
  });
  res.json({ seller });
});

export const createOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.create(req.body);
  await notify({ role: "user", title: "New offer available", message: `${offer.title} is live now.` });
  res.status(201).json({ offer });
});

export const updateWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await WithdrawalRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!withdrawal) {
    res.status(404);
    throw new Error("Withdrawal request not found");
  }
  await notify({
    recipient: withdrawal.seller,
    title: "Withdrawal updated",
    message: `Your withdrawal request is ${withdrawal.status}.`,
    data: { withdrawalId: withdrawal._id }
  });
  res.json({ withdrawal });
});

export const listWithdrawals = asyncHandler(async (_req, res) => {
  const withdrawals = await WithdrawalRequest.find()
    .populate("seller", "name email phone sellerProfile")
    .sort("-createdAt");
  res.json({ withdrawals });
});
