import Offer from "../models/Offer.js";
import Product from "../models/Product.js";
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
