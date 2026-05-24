import PartnerApplication from "../models/PartnerApplication.js";
import User from "../models/User.js";
import { notify } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const roleLabel = (role) => role.replace("_", " ");

export const createPartnerApplication = asyncHandler(async (req, res) => {
  const { requestedRole, name, email, phone, city, storeName, vehicleType, note } = req.body;
  if (!["seller", "delivery_partner"].includes(requestedRole)) {
    res.status(400);
    throw new Error("Request type must be seller or delivery partner");
  }

  const application = await PartnerApplication.create({
    requestedRole,
    name,
    email,
    phone,
    city,
    storeName,
    vehicleType,
    note,
    user: req.user?._id
  });

  await notify({
    role: "admin",
    title: "New access request",
    message: `${name} requested ${roleLabel(requestedRole)} access.`,
    type: "partner_application",
    data: { applicationId: application._id, requestedRole }
  });

  res.status(201).json({ application });
});

export const listPartnerApplications = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.requestedRole) filter.requestedRole = req.query.requestedRole;
  const applications = await PartnerApplication.find(filter)
    .populate("user", "name email phone role")
    .populate("reviewedBy", "name")
    .sort("-createdAt");
  res.json({ applications });
});

export const updatePartnerApplication = asyncHandler(async (req, res) => {
  const application = await PartnerApplication.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error("Access request not found");
  }

  const editableFields = ["name", "email", "phone", "city", "storeName", "vehicleType", "note", "adminNote"];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) application[field] = req.body[field];
  });

  if (req.body.status) {
    application.status = req.body.status;
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
  }

  let user = null;
  if (req.body.status === "approved") {
    const identityFilter = [];
    if (application.email) identityFilter.push({ email: application.email });
    if (application.phone) identityFilter.push({ phone: application.phone });

    user = identityFilter.length ? await User.findOne({ $or: identityFilter }) : null;
    if (!user) {
      user = await User.create({
        name: application.name,
        email: application.email,
        phone: application.phone,
        passwordHash: await User.hashPassword("Test@123"),
        role: application.requestedRole,
        phoneVerified: true,
        referralCode: `FLIP${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        sellerProfile: application.requestedRole === "seller" ? { storeName: application.storeName || `${application.name} Store`, isOnline: true } : {}
      });
    } else {
      user.name = application.name || user.name;
      user.email = application.email || user.email;
      user.phone = application.phone || user.phone;
      user.role = application.requestedRole;
      user.isActive = true;
      user.phoneVerified = true;
      if (application.requestedRole === "seller") {
        user.sellerProfile = {
          ...user.sellerProfile,
          storeName: application.storeName || user.sellerProfile?.storeName || `${application.name} Store`,
          isOnline: user.sellerProfile?.isOnline !== false
        };
      }
      await user.save();
    }
    application.user = user._id;
  }

  await application.save();

  if (application.user && req.body.status) {
    await notify({
      recipient: application.user,
      title: `Access request ${application.status}`,
      message:
        application.status === "approved"
          ? `Your ${roleLabel(application.requestedRole)} access is approved.`
          : `Your ${roleLabel(application.requestedRole)} request is ${application.status}.`,
      type: "partner_application",
      data: { applicationId: application._id, status: application.status }
    });
  }

  const safeUser = user ? await User.findById(user._id).select("-passwordHash -otp") : null;
  res.json({ application, user: safeUser });
});
