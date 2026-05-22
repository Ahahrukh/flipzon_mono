import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "flipzon-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/delivery", deliveryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
