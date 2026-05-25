import Ticket from "../models/Ticket.js";
import { notify } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, order } = req.body;
  if (!subject?.trim() || !message?.trim()) {
    res.status(400);
    throw new Error("Ticket subject and message are required");
  }
  const ticket = await Ticket.create({ subject, message, order, user: req.user._id });
  await notify({
    role: "admin",
    title: "Support ticket raised",
    message: `${req.user.name} raised: ${ticket.subject}`,
    data: { ticketId: ticket._id }
  });
  res.status(201).json({ ticket });
});

export const listTickets = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const tickets = await Ticket.find(filter).populate("user", "name email phone").sort("-createdAt");
  res.json({ tickets });
});

export const replyTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  if (req.user.role !== "admin" && ticket.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You do not have permission to reply to this ticket");
  }
  if (!req.body.message?.trim()) {
    res.status(400);
    throw new Error("Reply message is required");
  }
  ticket.replies.push({ by: req.user._id, message: req.body.message });
  ticket.status = req.body.status || ticket.status;
  await ticket.save();
  await notify({ recipient: ticket.user, title: "Ticket updated", message: ticket.subject, data: { ticketId: ticket._id } });
  res.json({ ticket });
});
