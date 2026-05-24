import { parse } from "csv-parse/sync";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const productDisplayKey = (product) =>
  [product.name, product.category, product.brand || ""]
    .join("|")
    .trim()
    .toLowerCase();

const dedupeProducts = (products) => {
  const byDisplayKey = new Map();

  products.forEach((product) => {
    const key = productDisplayKey(product);
    const current = byDisplayKey.get(key);
    if (!current || product.price < current.price || (product.price === current.price && product.stock > current.stock)) {
      byDisplayKey.set(key, product);
    }
  });

  return Array.from(byDisplayKey.values());
};

export const listProducts = asyncHandler(async (req, res) => {
  const { q, category, seller, status = "active", minPrice, maxPrice } = req.query;
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 100)));
  const filter = {};
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  if (seller) filter.seller = seller;
  if (status) filter.status = status;
  if (minPrice || maxPrice) filter.price = { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 9999999) };
  if (!seller) {
    const onlineSellers = await User.find({
      role: "seller",
      isActive: true,
      "sellerProfile.isOnline": { $ne: false }
    }).select("_id");
    filter.seller = { $in: onlineSellers.map((item) => item._id) };
  }

  const products = await Product.find(filter).populate("seller", "name sellerProfile.storeName").sort("-createdAt");
  const uniqueProducts = dedupeProducts(products);
  const total = uniqueProducts.length;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const productsForPage = uniqueProducts.slice((page - 1) * limit, page * limit);

  res.json({
    products: productsForPage,
    pagination: {
      page,
      limit,
      total,
      pageCount,
      hasNextPage: page < pageCount,
      hasPreviousPage: page > 1
    }
  });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: "active" }).populate(
    "seller",
    "name isActive sellerProfile.storeName sellerProfile.isOnline"
  );
  if (!product || !product.seller?.isActive || product.seller?.sellerProfile?.isOnline === false) {
    res.status(404);
    throw new Error("Product not found or seller is offline");
  }
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, seller: req.user._id });
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ message: "Product deleted" });
});

export const uploadProductsCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("CSV file is required");
  }

  const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true, trim: true });
  const products = records.map((row) => ({
    seller: req.user._id,
    name: row.name,
    sku: row.sku,
    description: row.description,
    category: row.category,
    brand: row.brand,
    imageUrl: row.imageUrl,
    price: Number(row.price),
    mrp: Number(row.mrp || row.price),
    stock: Number(row.stock || 0),
    unit: row.unit || "piece",
    status: row.status || "active"
  }));

  await Product.bulkWrite(
    products.map((product) => ({
      updateOne: {
        filter: { seller: req.user._id, sku: product.sku },
        update: { $set: product },
        upsert: true
      }
    }))
  );

  res.status(201).json({ imported: products.length });
});
