import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { setSocketServer } from "./services/notification.service.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: env.clientUrl, credentials: true }
});

io.on("connection", (socket) => {
  socket.on("join:user", (userId) => socket.join(`user:${userId}`));
  socket.on("join:role", (role) => socket.join(`role:${role}`));
});

setSocketServer(io);

server.listen(env.port, () => {
  console.log(`Flipzon API listening on http://localhost:${env.port}`);
});

connectDb().catch((error) => {
  console.error("Database connection failed. API docs remain available; database routes need MongoDB.", error);
});
