import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ recipient: req.user._id }, { role: req.user.role }]
  }).sort("-createdAt");
  res.json({ notifications });
});

export const markRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { _id: { $in: req.body.ids }, $or: [{ recipient: req.user._id }, { role: req.user.role }] },
    { readAt: new Date() }
  );
  res.json({ message: "Notifications marked as read" });
});
