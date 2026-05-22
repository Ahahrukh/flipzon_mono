import { motion } from "framer-motion";
import { Filter, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import ProductCard from "../components/ProductCard.jsx";
import RoleSections from "../components/RoleSections.jsx";
import { products } from "../data/products.js";
import { apiRequest } from "../services/api.js";

const normalizeProduct = (product, index) => ({
  id: product._id || product.id,
  name: product.name,
  unit: product.unit || "piece",
  price: product.price,
  mrp: product.mrp || product.price,
  category: product.category || "Other",
  brand: product.brand || "Flipzon",
  seller: product.seller?.sellerProfile?.storeName || product.seller?.name || product.seller || "Seller",
  rating: product.rating || 4.5,
  stock: product.stock || 0,
  time: product.time || "12 min",
  emoji: product.emoji || product.name?.[0]?.toUpperCase() || "P",
  color: product.color || ["#ffe08a", "#b6f3ff", "#d7c3ff", "#ffd2b7"][index % 4],
  description: product.description || "Fresh product from a Flipzon seller.",
  tags: product.tags || []
});

export default function Dashboard() {
  const shopRef = useRef(null);
  const [filters, setFilters] = useState({ category: "All", brand: "All", seller: "All", maxPrice: 350, q: "" });
  const [remoteProducts, setRemoteProducts] = useState([]);
  const { user } = useSelector((state) => state.auth);
  useEffect(() => {
    apiRequest("/products")
      .then((data) => setRemoteProducts((data.products || []).map(normalizeProduct)))
      .catch(() => setRemoteProducts([]));
  }, []);
  const catalog = remoteProducts.length > 0 ? remoteProducts : products;
  const availableBrands = useMemo(() => ["All", ...new Set(catalog.map((product) => product.brand))], [catalog]);
  const availableSellers = useMemo(() => ["All", ...new Set(catalog.map((product) => product.seller))], [catalog]);
  const availableCategories = useMemo(() => ["All", ...new Set(catalog.map((product) => product.category))], [catalog]);
  const filteredProducts = useMemo(
    () =>
      catalog.filter((product) => {
        const matchesCategory = filters.category === "All" || product.category === filters.category;
        const matchesBrand = filters.brand === "All" || product.brand === filters.brand;
        const matchesSeller = filters.seller === "All" || product.seller === filters.seller;
        const matchesPrice = product.price <= Number(filters.maxPrice);
        const matchesSearch = `${product.name} ${product.brand} ${product.category} ${product.tags.join(" ")}`
          .toLowerCase()
          .includes(filters.q.toLowerCase());
        return matchesCategory && matchesBrand && matchesSeller && matchesPrice && matchesSearch;
      }),
    [catalog, filters]
  );
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <main>
      <Header />
      <section className="hero">
        <motion.div
          className="heroCopy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <p className="eyebrow">
            <Sparkles size={16} /> Hyperlocal quick commerce
          </p>
          <h1>Groceries, offers, and live delivery in one fast cart.</h1>
          <p className="heroText">
            Shop fast, use referral discounts, pay online, track delivery live, and raise support tickets from one user account.
          </p>
          <div className="heroActions">
            <button className="primaryButton" onClick={() => shopRef.current?.scrollIntoView({ behavior: "smooth" })}>
              Start shopping
            </button>
          </div>
        </motion.div>
        <motion.div className="heroMedia" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="videoMock">
            <span className="pulse" />
            <h2>11 min</h2>
            <p>fresh basket arriving</p>
          </div>
        </motion.div>
      </section>

      <section className="categoryStrip">
        {availableCategories.map((category) => (
          <button className={filters.category === category ? "active" : ""} key={category} onClick={() => updateFilter("category", category)}>
            {category}
          </button>
        ))}
      </section>

      <section className="contentGrid" ref={shopRef}>
        <div className="shopArea">
          <div className="sectionTitle">
            <div>
              <p>Top picks</p>
              <h2>Fresh in your area</h2>
            </div>
            <span>{filteredProducts.length} products found</span>
          </div>
          <div className="filterPanel">
            <div className="filterTitle">
              <Filter size={18} />
              <strong>Filters</strong>
            </div>
            <label>
              Search
              <input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Search products" />
            </label>
            <label>
              Brand
              <select value={filters.brand} onChange={(event) => updateFilter("brand", event.target.value)}>
                {availableBrands.map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
              </select>
            </label>
            <label>
              Seller
              <select value={filters.seller} onChange={(event) => updateFilter("seller", event.target.value)}>
                {availableSellers.map((seller) => (
                  <option key={seller}>{seller}</option>
                ))}
              </select>
            </label>
            <label>
              Max price: Rs {filters.maxPrice}
              <input type="range" min="50" max="400" value={filters.maxPrice} onChange={(event) => updateFilter("maxPrice", event.target.value)} />
            </label>
            <button className="secondaryButton compact" onClick={() => setFilters({ category: "All", brand: "All", seller: "All", maxPrice: 350, q: "" })}>
              Reset
            </button>
          </div>
          <div className="productGrid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length === 0 && <p className="emptyState">No products match these filters.</p>}
        </div>
      </section>

      <RoleSections authenticated={Boolean(user)} />
      <Footer />
    </main>
  );
}
