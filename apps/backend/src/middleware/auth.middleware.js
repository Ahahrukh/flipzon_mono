import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  const decoded = jwt.verify(header.split(" ")[1], env.jwtSecret);
  const user = await User.findById(decoded.id).select("-passwordHash -otp");
  if (!user || !user.isActive) {
    const error = new Error("User not found or disabled");
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  const decoded = jwt.verify(header.split(" ")[1], env.jwtSecret);
  const user = await User.findById(decoded.id).select("-passwordHash -otp");
  if (user?.isActive) {
    req.user = user;
  }
  return next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    const error = new Error("You do not have permission for this action");
    error.statusCode = 403;
    return next(error);
  }
  return next();
};
