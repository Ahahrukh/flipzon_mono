import Notification from "../models/Notification.js";

let io;

export const setSocketServer = (socketServer) => {
  io = socketServer;
};

export const notify = async ({ recipient, role, title, message, type = "info", data = {} }) => {
  const notification = await Notification.create({ recipient, role, title, message, type, data });

  if (io) {
    if (recipient) io.to(`user:${recipient}`).emit("notification:new", notification);
    if (role) io.to(`role:${role}`).emit("notification:new", notification);
  }

  return notification;
};
