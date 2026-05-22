import { Router } from "express";
import { createTicket, listTickets, replyTicket } from "../controllers/ticket.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);
router.post("/", createTicket);
router.get("/", listTickets);
router.post("/:id/replies", replyTicket);

export default router;
