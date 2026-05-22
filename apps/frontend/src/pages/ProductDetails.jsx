import { ArrowLeft, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { products } from "../data/products.js";
import { addToCart, decrementQuantity, incrementQuantity } from "../features/cart/cartSlice.js";

export default function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const product = products.find((item) => item.id === id);
  const cartItem = useSelector((state) => state.cart.items.find((item) => item.id === id));

  if (!product) {
    return (
      <main>
        <Header />
        <section className="detailPage">
          <h1>Product not found</h1>
          <Link className="secondaryButton" to="/">Back to shop</Link>
        </section>
        <Footer />
      </main>
    );
  }

  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 3);

  return (
    <main>
      <Header />
      <section className="detailPage">
        <Link className="textLink backLink" to="/">
          <ArrowLeft size={18} /> Back to products
        </Link>
        <div className="detailGrid">
          <div className="detailArt" style={{ background: product.color }}>
            <span>{product.emoji}</span>
          </div>
          <div className="detailInfo">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.name}</h1>
            <div className="ratingLine">
              <Star size={18} fill="currentColor" />
              <strong>{product.rating}</strong>
              <span>{product.brand}</span>
              <span>{product.seller}</span>
            </div>
            <p className="detailDescription">{product.description}</p>
            <div className="priceLine">
              <strong>Rs {product.price}</strong>
              <span>MRP Rs {product.mrp}</span>
              <small>{product.unit}</small>
            </div>
            <div className="detailTags">
              {product.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <div className="detailActions">
              {cartItem ? (
                <div className="qtyControl large">
                  <button onClick={() => dispatch(decrementQuantity(product.id))} aria-label="Decrease quantity">
                    <Minus size={18} />
                  </button>
                  <span>{cartItem.quantity}</span>
                  <button onClick={() => dispatch(incrementQuantity(product.id))} aria-label="Increase quantity">
                    <Plus size={18} />
                  </button>
                </div>
              ) : (
                <button className="primaryButton" onClick={() => dispatch(addToCart(product))}>
                  <ShoppingBag size={18} /> Add to cart
                </button>
              )}
              <Link className="secondaryButton" to="/cart">View cart</Link>
            </div>
            <div className="deliveryPromise">
              <strong>{product.time} delivery</strong>
              <span>{product.stock} units available. Online payment supported through Razorpay.</span>
            </div>
          </div>
        </div>
        {related.length > 0 && (
          <>
            <div className="sectionTitle">
              <div>
                <p>Related</p>
                <h2>More from {product.category}</h2>
              </div>
            </div>
            <div className="productGrid relatedGrid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
