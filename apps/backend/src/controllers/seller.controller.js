import Earning from "../models/Earning.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import WithdrawalRequest from "../models/WithdrawalRequest.js";
import { notify } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const earningSummary = asyncHandler(async (req, res) => {
  const { from, to, status } = req.query;
  const filter = { seller: req.user._id };
  if (status) filter.status = status;
  if (from || to) filter.createdAt = { $gte: new Date(from || "1970-01-01"), $lte: new Date(to || Date.now()) };

  const rows = await Earning.find(filter).populate("order", "createdAt payment.status").sort("-createdAt");
  const summary = rows.reduce(
    (acc, item) => {
      acc.grossAmount += item.grossAmount;
      acc.platformFee += item.platformFee;
      acc.netAmount += item.netAmount;
      return acc;
    },
    { grossAmount: 0, platformFee: 0, netAmount: 0 }
  );
  res.json({ summary, rows });
});

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await WithdrawalRequest.create({
    seller: req.user._id,
    amount: req.body.amount,
    note: req.body.note
  });
  await notify({
    role: "admin",
    title: "Withdrawal request",
    message: `${req.user.name} requested payout of Rs ${req.body.amount}.`,
    data: { withdrawalId: withdrawal._id }
  });
  res.status(201).json({ withdrawal });
});

export const sellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user._id }).sort("-createdAt");
  res.json({ products });
});

export const sellerWithdrawals = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { seller: req.user._id };
  if (status) filter.status = status;
  const withdrawals = await WithdrawalRequest.find(filter).sort("-createdAt");
  res.json({ withdrawals });
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { "sellerProfile.isOnline": Boolean(req.body.isOnline) },
    { new: true }
  ).select("-passwordHash -otp");
  res.json({ user });
});
