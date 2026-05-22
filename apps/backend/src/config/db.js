import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

export const isDbConnected = () => mongoose.connection.readyState === 1;
