import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import partnerApplicationRoutes from "./routes/partnerApplication.routes.js";
import { env } from "./config/env.js";
import { isDbConnected } from "./config/db.js";
import { requireDb } from "./middleware/db.middleware.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";

const app = express();
const swaggerPath = [
  path.resolve(process.cwd(), "docs/swagger.yml"),
  path.resolve(process.cwd(), "../../docs/swagger.yml")
].find((candidate) => fs.existsSync(candidate));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "flipzon-api", database: isDbConnected() ? "connected" : "disconnected" }));
if (swaggerPath) {
  const swaggerDocument = YAML.parse(fs.readFileSync(swaggerPath, "utf8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get("/api-docs.json", (_req, res) => res.json(swaggerDocument));
}
app.use("/api/auth", requireDb, authRoutes);
app.use("/api/products", requireDb, productRoutes);
app.use("/api/orders", requireDb, orderRoutes);
app.use("/api/seller", requireDb, sellerRoutes);
app.use("/api/admin", requireDb, adminRoutes);
app.use("/api/tickets", requireDb, ticketRoutes);
app.use("/api/notifications", requireDb, notificationRoutes);
app.use("/api/delivery", requireDb, deliveryRoutes);
app.use("/api/partner-applications", requireDb, partnerApplicationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
