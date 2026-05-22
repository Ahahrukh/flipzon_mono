import User from "../models/User.js";
import { createOtp, otpExpiry, sendOtp } from "../services/otp.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createReferralCode } from "../utils/referral.js";
import { signToken } from "../utils/tokens.js";

const userPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  phoneVerified: user.phoneVerified,
  referralCode: user.referralCode,
  referralDiscountAvailable: user.referralDiscountAvailable,
  sellerProfile: user.sellerProfile
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, referralCode } = req.body;
  if (!email && !phone) {
    res.status(400);
    throw new Error("Email or phone is required");
  }

  const existing = await User.findOne({ $or: [{ email }, { phone }].filter((item) => Object.values(item)[0]) });
  if (existing) {
    res.status(409);
    throw new Error("User already exists");
  }

  const referredBy = referralCode ? await User.findOne({ referralCode }) : null;
  const user = await User.create({
    name,
    email,
    phone,
    role: "user",
    passwordHash: await User.hashPassword(password),
    referralCode: createReferralCode(name),
    referredBy: referredBy?._id,
    referralDiscountAvailable: Boolean(referredBy)
  });

  res.status(201).json({ user: userPayload(user), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const user = await User.findOne({
    $or: [{ email: identifier?.toLowerCase() }, { phone: identifier }]
  });

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  res.json({ user: userPayload(user), token: signToken(user) });
});

export const requestPhoneOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const user = await User.findOne({ phone });
  if (!user) {
    res.status(404);
    throw new Error("Phone number is not registered");
  }

  const code = createOtp();
  user.otp = { code, expiresAt: otpExpiry() };
  await user.save();
  await sendOtp(phone, code);
  res.json({ message: "OTP sent" });
});

export const verifyPhoneOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  const user = await User.findOne({ phone });
  if (!user || user.otp?.code !== otp || user.otp.expiresAt < new Date()) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  user.phoneVerified = true;
  user.otp = undefined;
  await user.save();
  res.json({ user: userPayload(user), token: signToken(user) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: userPayload(req.user) });
});
