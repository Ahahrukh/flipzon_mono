import Order from "../models/Order.js";
import User from "../models/User.js";
import { notify } from "../services/notification.service.js";
import { calculateRouteEta } from "../services/map.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const hasValidCoordinates = (coordinates) => {
  return !Number.isNaN(Number(coordinates?.lat)) && !Number.isNaN(Number(coordinates?.lng));
};

const nearbyFallback = (customer) => ({
  lat: Number(customer?.lat || 19.0596) + 0.01,
  lng: Number(customer?.lng || 72.8295) + 0.01
});

export const assignedOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ "delivery.partner": req.user._id })
    .populate("user", "name phone address")
    .populate("items.product", "name imageUrl")
    .sort("-createdAt");
  res.json({ orders });
});

export const availableOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find({ "delivery.partner": { $exists: false }, "delivery.status": "placed" })
    .populate("user", "name phone")
    .populate("items.product", "name imageUrl")
    .sort("-createdAt")
    .limit(25);
  res.json({ orders });
});

export const acceptOrder = asyncHandler(async (req, res) => {
  const existingOrder = await Order.findOne({ _id: req.params.orderId, "delivery.partner": { $exists: false }, "delivery.status": "placed" });
  if (!existingOrder) {
    res.status(409);
    throw new Error("Order is already accepted or unavailable");
  }

  const browserLocation = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
  const savedLocation = req.user.address?.coordinates;
  const customerLocation = existingOrder.delivery?.address?.coordinates;
  const rider = hasValidCoordinates(browserLocation)
    ? browserLocation
    : hasValidCoordinates(savedLocation)
      ? { lat: Number(savedLocation.lat), lng: Number(savedLocation.lng) }
      : nearbyFallback(customerLocation);

  const route = await calculateRouteEta({ rider, customer: existingOrder.delivery?.address?.coordinates });
  await User.updateOne({ _id: req.user._id }, { "address.coordinates": rider });

  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, "delivery.partner": { $exists: false }, "delivery.status": "placed" },
    {
      "delivery.partner": req.user._id,
      "delivery.status": "out_for_delivery",
      "delivery.currentLocation": { ...rider, updatedAt: new Date() },
      "delivery.etaMinutes": Math.ceil(route.durationSeconds / 60),
      "delivery.distanceMeters": route.distanceMeters,
      "delivery.durationSeconds": route.durationSeconds
    },
    { new: true }
  );
  if (!order) {
    res.status(409);
    throw new Error("Order is already accepted or unavailable");
  }

  await notify({
    recipient: order.user,
    title: "Delivery partner assigned",
    message: `${req.user.name} accepted your order.`,
    type: "delivery_tracking",
    data: {
      orderId: order._id,
      currentLocation: order.delivery.currentLocation,
      etaMinutes: order.delivery.etaMinutes,
      distanceMeters: order.delivery.distanceMeters,
      status: order.delivery.status
    }
  });
  res.json({ order });
});

export const updateDeliveryLocation = asyncHandler(async (req, res) => {
  const rider = { lat: Number(req.body.lat), lng: Number(req.body.lng) };
  if (Number.isNaN(rider.lat) || Number.isNaN(rider.lng)) {
    res.status(400);
    throw new Error("Valid rider latitude and longitude are required");
  }

  const existingOrder = await Order.findOne({ _id: req.params.orderId, "delivery.partner": req.user._id });
  if (!existingOrder) {
    res.status(404);
    throw new Error("Assigned order not found");
  }

  const route = await calculateRouteEta({
    rider,
    customer: existingOrder.delivery?.address?.coordinates
  });
  await User.updateOne({ _id: req.user._id }, { "address.coordinates": rider });

  const order = await Order.findOneAndUpdate(
    { _id: req.params.orderId, "delivery.partner": req.user._id },
    {
      "delivery.currentLocation": {
        lat: rider.lat,
        lng: rider.lng,
        updatedAt: new Date()
      },
      "delivery.etaMinutes": Math.ceil(route.durationSeconds / 60),
      "delivery.distanceMeters": route.distanceMeters,
      "delivery.durationSeconds": route.durationSeconds
    },
    { new: true }
  );

  await notify({
    recipient: order.user,
    title: "Delivery location updated",
    message: "Your rider location is live.",
    type: "delivery_tracking",
    data: {
      orderId: order._id,
      currentLocation: order.delivery.currentLocation,
      etaMinutes: order.delivery.etaMinutes,
      distanceMeters: order.delivery.distanceMeters,
      status: order.delivery.status
    }
  });
  res.json({ order });
});
