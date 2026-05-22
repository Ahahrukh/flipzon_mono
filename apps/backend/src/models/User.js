import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, lowercase: true, sparse: true, trim: true },
    phone: { type: String, sparse: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "seller", "user", "delivery_partner"],
      default: "user"
    },
    phoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    referralCode: { type: String, unique: true, index: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    referralDiscountAvailable: { type: Boolean, default: false },
    sellerProfile: {
      storeName: String,
      gstNumber: String,
      bankAccount: String,
      ifsc: String,
      isOnline: { type: Boolean, default: true }
    },
    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    otp: {
      code: String,
      expiresAt: Date
    }
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 10);

export default mongoose.model("User", userSchema);
