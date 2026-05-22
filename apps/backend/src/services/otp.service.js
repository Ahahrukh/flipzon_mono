import { env } from "../config/env.js";

export const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const otpExpiry = () => new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000);

export const sendOtp = async (phone, code) => {
  if (env.nodeEnv !== "production") {
    console.log(`OTP for ${phone}: ${code}`);
  }
  return { provider: "console", delivered: true };
};
