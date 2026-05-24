import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import ProductCard from "../components/ProductCard.jsx";
import RoleSections from "../components/RoleSections.jsx";
import { products } from "../data/products.js";
import { apiRequest } from "../services/api.js";
import { dedupeProducts, normalizeProduct } from "../utils/normalizeProduct.js";

const PRODUCTS_PER_PAGE = 12;

const getPageNumbers = (currentPage, pageCount) => {
  const pages = [];
  const start = Math.max(1, Math.min(currentPage - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
};

export default function Dashboard() {
  const shopRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ category: "All", brand: "All", seller: "All", maxPrice: 350, q: "" });
  const [remoteProducts, setRemoteProducts] = useState([]);
  const [productFetchStatus, setProductFetchStatus] = useState("loading");
  const [productFetchMessage, setProductFetchMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useSelector((state) => state.auth);
  const queryFromUrl = searchParams.get("q") || "";
  useEffect(() => {
    setCurrentPage(1);
    setFilters((current) => ({ ...current, q: queryFromUrl }));
    if (queryFromUrl) window.setTimeout(() => shopRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [queryFromUrl]);

  useEffect(() => {
    const handleSearch = (event) => {
      setCurrentPage(1);
      setFilters((current) => ({ ...current, q: event.detail || "" }));
      shopRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("flipzon:search", handleSearch);
    return () => window.removeEventListener("flipzon:search", handleSearch);
  }, []);

  useEffect(() => {
    setProductFetchStatus("loading");
    setProductFetchMessage("Loading live products from database...");
    apiRequest("/products?limit=500")
      .then((data) => {
        const liveProducts = dedupeProducts((data.products || []).map(normalizeProduct));
        setRemoteProducts(liveProducts);
        setProductFetchStatus("success");
        setProductFetchMessage(
          liveProducts.length
            ? "Showing live products from database."
            : "No live DB products found. Seller must be online, active, and product status must be active."
        );
      })
      .catch((error) => {
        setRemoteProducts([]);
        setProductFetchStatus("error");
        setProductFetchMessage(`${error.message}. Showing sample products until the backend API is available.`);
      });
  }, []);
  const catalog = productFetchStatus === "success" && remoteProducts.length > 0 ? remoteProducts : dedupeProducts(products);
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
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE),
    [currentPage, filteredProducts]
  );
  const pageNumbers = useMemo(() => getPageNumbers(currentPage, pageCount), [currentPage, pageCount]);
  const pageStart = filteredProducts.length ? (currentPage - 1) * PRODUCTS_PER_PAGE + 1 : 0;
  const pageEnd = Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length);
  const updateFilter = (key, value) => {
    setCurrentPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const resetFilters = () => {
    setCurrentPage(1);
    setFilters({ category: "All", brand: "All", seller: "All", maxPrice: 350, q: "" });
  };

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
          <div className={`productSource productSource-${productFetchStatus}`}>
            <span>{productFetchMessage}</span>
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
            <button className="secondaryButton compact" onClick={resetFilters}>
              Reset
            </button>
          </div>
          <div className="productGrid">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {filteredProducts.length > PRODUCTS_PER_PAGE && (
            <nav className="paginationBar" aria-label="Product pagination">
              <span>
                Showing {pageStart}-{pageEnd} of {filteredProducts.length}
              </span>
              <div className="paginationControls">
                <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Previous page">
                  <ChevronLeft size={18} />
                </button>
                {pageNumbers.map((page) => (
                  <button key={page} className={currentPage === page ? "active" : ""} onClick={() => setCurrentPage(page)}>
                    {page}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Next page">
                  <ChevronRight size={18} />
                </button>
              </div>
            </nav>
          )}
          {filteredProducts.length === 0 && <p className="emptyState">No products match these filters.</p>}
        </div>
      </section>

      <RoleSections authenticated={Boolean(user)} />
      <Footer />
    </main>
  );
}
