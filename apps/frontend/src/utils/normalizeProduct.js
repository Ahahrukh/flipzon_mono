export const normalizeProduct = (product, index = 0) => ({
  id: product._id || product.id,
  name: product.name,
  unit: product.unit || "piece",
  price: product.price,
  mrp: product.mrp || product.price,
  category: product.category || "Other",
  brand: product.brand || "VDelivery",
  seller: product.seller?.sellerProfile?.storeName || product.seller?.name || product.seller || "Seller",
  rating: product.rating || 4.5,
  stock: product.stock || 0,
  time: product.time || "12 min",
  emoji: product.emoji || product.name?.[0]?.toUpperCase() || "P",
  color: product.color || ["#ffe08a", "#b6f3ff", "#d7c3ff", "#ffd2b7"][index % 4],
  description: product.description || "Fresh product from a VDelivery seller.",
  tags: product.tags || [],
  imageUrl: product.imageUrl || product.photo || ""
});

export const productDisplayKey = (product) =>
  [product.name, product.category, product.brand || ""]
    .join("|")
    .trim()
    .toLowerCase();

export const dedupeProducts = (productList) => {
  const byDisplayKey = new Map();

  productList.forEach((product) => {
    const key = productDisplayKey(product);
    const current = byDisplayKey.get(key);
    if (!current || product.price < current.price || (product.price === current.price && product.stock > current.stock)) {
      byDisplayKey.set(key, product);
    }
  });

  return Array.from(byDisplayKey.values());
};
