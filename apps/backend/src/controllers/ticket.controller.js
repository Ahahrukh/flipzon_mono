import Ticket from "../models/Ticket.js";
import { notify } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.create({ ...req.body, user: req.user._id });
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
  ticket.replies.push({ by: req.user._id, message: req.body.message });
  ticket.status = req.body.status || ticket.status;
  await ticket.save();
  await notify({ recipient: ticket.user, title: "Ticket updated", message: ticket.subject, data: { ticketId: ticket._id } });
  res.json({ ticket });
});
