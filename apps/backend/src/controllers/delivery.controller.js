import Order from "../models/Order.js";
import { notify } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const assignedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "delivery.partner": req.user._id })
    .populate("user", "name phone address")
    .populate("items.product", "name imageUrl")
    .sort("-createdAt");
  res.json({ orders });
});

export const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, "delivery.partner": req.user._id },
    {
      "delivery.currentLocation": {
        lat: req.body.lat,
        lng: req.body.lng,
        updatedAt: new Date()
      },
      "delivery.etaMinutes": req.body.etaMinutes
    },
    { new: true }
  );
  if (!order) {
    res.status(404);
    throw new Error("Assigned order not found");
  }
  await notify({
    recipient: order.user,
    title: "Delivery location updated",
    message: "Your rider location is live.",
    data: { orderId: order._id, currentLocation: order.delivery.currentLocation }
  });
  res.json({ order });
});
