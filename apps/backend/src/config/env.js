import dotenv from "dotenv";

dotenv.config({ path: process.env.ENV_FILE || "../../.env" });
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientOrigins: (process.env.CLIENT_ORIGINS || process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/VDelivery",
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
  openRouteServiceApiKey: process.env.OPENROUTE_SERVICE_API_KEY || "",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash"
};
