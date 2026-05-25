import Earning from "../models/Earning.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { notify } from "../services/notification.service.js";
import { createPaymentOrder, verifyPaymentSignature } from "../services/razorpay.service.js";
import { calculateRouteEta, geocodeAddress } from "../services/map.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const distanceKm = (from, to) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return Number.POSITIVE_INFINITY;
  const earthRadiusKm = 6371;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const firstLat = (from.lat * Math.PI) / 180;
  const secondLat = (to.lat * Math.PI) / 180;
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const createOrder = asyncHandler(async (req, res) => {
  const { items, address } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Order must include at least one item");
  }
  const ids = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: ids }, status: "active" });

  const orderItems = items.map((item) => {
    const product = products.find((entry) => entry._id.toString() === item.product);
    if (!product || product.stock < item.quantity) throw new Error(`Product unavailable: ${item.product}`);
    return {
      product: product._id,
      seller: product.seller,
      name: product.name,
      quantity: item.quantity,
      price: product.price
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = req.user.referralDiscountAvailable ? Math.round(subtotal * 0.2) : 0;
  const total = Math.max(subtotal - discount, 0);
  const paymentOrder = await createPaymentOrder({ amount: total, receipt: `VDelivery_${Date.now()}` });
  const customerCoordinates = await geocodeAddress(address);
  const initialRoute = await calculateRouteEta({ customer: customerCoordinates });

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    subtotal,
    discount,
    total,
    payment: { razorpayOrderId: paymentOrder.id },
    delivery: {
      address: { ...address, coordinates: customerCoordinates },
      etaMinutes: Math.ceil(initialRoute.durationSeconds / 60),
      distanceMeters: initialRoute.distanceMeters,
      durationSeconds: initialRoute.durationSeconds
    }
  });

  await notify({
    role: "admin",
    title: "New order placed",
    message: `Order ${order._id} is waiting for payment confirmation.`,
    data: { orderId: order._id }
  });
  const deliveryPartners = await User.find({ role: "delivery_partner", isActive: true }).select("address");
  const nearbyPartners = deliveryPartners.filter((partner) => distanceKm(partner.address?.coordinates, customerCoordinates) <= 10);
  const deliveryNotification = {
    title: "New nearby delivery request",
    message: `Order ${order._id.toString().slice(-8)} is ready for pickup.`,
    type: "delivery_request",
    data: {
      orderId: order._id,
      customerLocation: customerCoordinates,
      etaMinutes: order.delivery.etaMinutes,
      distanceMeters: order.delivery.distanceMeters
    }
  };
  if (nearbyPartners.length > 0) {
    await Promise.all(nearbyPartners.map((partner) => notify({ ...deliveryNotification, recipient: partner._id })));
  } else {
    await notify({ ...deliveryNotification, role: "delivery_partner" });
  }

  res.status(201).json({ order, razorpayOrder: paymentOrder });
});

export const verifyOrderPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;
  const order = await Order.findById(orderId);
  if (!order || order.user.toString() !== req.user._id.toString()) {
    res.status(404);
    throw new Error("Order not found");
  }

  const verified = verifyPaymentSignature({
    razorpayOrderId: order.payment.razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  });
  if (!verified) {
    res.status(400);
    throw new Error("Payment verification failed");
  }

  order.payment.status = "paid";
  order.payment.razorpayPaymentId = razorpayPaymentId;
  await order.save();

  if (req.user.referralDiscountAvailable) {
    req.user.referralDiscountAvailable = false;
    await req.user.save();
  }

  await Promise.all(
    order.items.map((item) =>
      Earning.create({
        seller: item.seller,
        order: order._id,
        grossAmount: item.price * item.quantity,
        platformFee: Math.round(item.price * item.quantity * 0.08),
        netAmount: Math.round(item.price * item.quantity * 0.92)
      })
    )
  );

  await notify({ recipient: req.user._id, title: "Payment received", message: "Your order is confirmed." });
  res.json({ order });
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).populate("items.product").sort("-createdAt");
  res.json({ orders });
});

export const trackOrder = asyncHandler(async (req, res) => {
  const { riderLat, riderLng, customerLat, customerLng } = req.body;
  if ([riderLat, riderLng, customerLat, customerLng].some((value) => Number.isNaN(Number(value)))) {
    res.status(400);
    throw new Error("Valid rider and customer coordinates are required");
  }

  const route = await calculateRouteEta({
    rider: { lat: Number(riderLat), lng: Number(riderLng) },
    customer: { lat: Number(customerLat), lng: Number(customerLng) }
  });

  res.json({
    distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
    duration: `${Math.ceil(route.durationSeconds / 60)} mins`,
    etaSeconds: route.durationSeconds
  });
});
