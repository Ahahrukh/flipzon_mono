import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { isDbConnected } from "../config/db.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const gemini = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

const sanitizeMessage = (value) => String(value || "").trim().slice(0, 1000);

const localAssistantReply = ({ message, products }) => {
  const lower = message.toLowerCase();
  const matches = products.filter((product) => lower.includes(product.name.toLowerCase()) || lower.includes(product.category.toLowerCase()));
  const suggestions = (matches.length ? matches : products).slice(0, 4);

  if (lower.includes("track") || lower.includes("order")) {
    return "You can track active orders from My console > tracking. After a delivery partner accepts the order, the map shows ETA and rider location.";
  }

  if (lower.includes("ticket") || lower.includes("support") || lower.includes("problem")) {
    return "You can raise a support ticket from My console > tickets. Add the order number if the issue is related to a delivery or payment.";
  }

  if (suggestions.length === 0) {
    return "I can help with product suggestions, cart questions, delivery tracking, payments, refunds, and support tickets. Tell me what you want to buy or what issue you are facing.";
  }

  return `Here are good options from the current catalog: ${suggestions.map((item) => `${item.name} for Rs ${item.price}`).join(", ")}. Add the item to cart, then checkout with your typed delivery address or current location.`;
};

const loadProductContext = async () => {
  if (!isDbConnected()) return [];
  return Product.find({ status: "active", stock: { $gt: 0 } })
    .select("name category brand price stock unit")
    .sort("-createdAt")
    .limit(12)
    .lean();
};

export const chatWithBot = asyncHandler(async (req, res) => {
  const message = sanitizeMessage(req.body.message);
  if (!message) {
    res.status(400);
    throw new Error("Message is required");
  }

  const products = await loadProductContext();
  const userRole = req.user?.role || "guest";
  const fallbackReply = localAssistantReply({ message, products });

  if (!gemini) {
    return res.json({ reply: fallbackReply, source: "fallback" });
  }

  try {
    const response = await gemini.models.generateContent({
      model: env.geminiModel,
      contents: [
        [
          "You are VDelivery's quick-commerce assistant.",
          "Help with product discovery, cart, payments, delivery tracking, support tickets, seller/delivery partner workflows, and referrals.",
          "Do not invent order status. Ask the user to open My console for private order details.",
          "Keep replies short, practical, and friendly.",
          `User role: ${userRole}.`,
          `Available product context: ${products.map((item) => `${item.name} (${item.category}, Rs ${item.price}, ${item.stock} ${item.unit || "units"})`).join("; ") || "No live product context."}`,
          `User message: ${message}`
        ].join("\n")
      ],
      config: {
        temperature: 0.4,
        maxOutputTokens: 280
      }
    });

    const reply = response.text?.trim() || fallbackReply;
    return res.json({ reply, source: response.text ? "gemini" : "fallback" });
  } catch (error) {
    console.error("Gemini chatbot provider failed:", error.message);
    return res.json({ reply: fallbackReply, source: "fallback", warning: "Assistant provider unavailable" });
  }
});
