import { Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import { clearCart, decrementQuantity, incrementQuantity, removeFromCart } from "../features/cart/cartSlice.js";
import { apiRequest } from "../services/api.js";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const items = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const referralDiscount = subtotal > 0 ? Math.round(subtotal * 0.2) : 0;
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 25;
  const total = subtotal - referralDiscount + deliveryFee;
  const handlePay = useCallback(async () => {
    if (!user) {
      sessionStorage.setItem("flipzon_pending_checkout", "1");
      navigate("/login?redirect=/cart&checkout=1");
      return;
    }
    if (!items.length) return;
    setIsPaying(true);
    setCheckoutError("");
    try {
      const data = await apiRequest("/orders", {
        method: "POST",
        token,
        body: JSON.stringify({
          items: items.map((item) => ({ product: item.id, quantity: item.quantity })),
          address: {
            label: "Home",
            line1: "Bandra West",
            city: "Mumbai",
            coordinates: { lat: 19.0596, lng: 72.8295 }
          }
        })
      });
      dispatch(clearCart());
      navigate(`/console?tab=orders&order=${data.order._id}`);
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setIsPaying(false);
    }
  }, [dispatch, items, navigate, token, user]);

  useEffect(() => {
    const shouldResume = sessionStorage.getItem("flipzon_pending_checkout") === "1";
    if (user && shouldResume && items.length > 0) {
      sessionStorage.removeItem("flipzon_pending_checkout");
      handlePay();
    }
  }, [handlePay, items.length, user]);

  return (
    <main>
      <Header />
      <section className="cartPage">
        <div className="sectionTitle">
          <div>
            <p>Your basket</p>
            <h1>Cart details</h1>
          </div>
          {items.length > 0 && (
            <button className="secondaryButton" onClick={() => dispatch(clearCart())}>
              Clear cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="emptyCart">
            <h2>Your cart is empty</h2>
            <p>Add products from the user shopping page to see price, quantity, discounts, and checkout total.</p>
            <Link className="primaryButton" to="/">Start shopping</Link>
          </div>
        ) : (
          <div className="cartGrid">
            <div className="cartItems">
              {items.map((item) => (
                <article className="cartItem" key={item.id}>
                  <Link to={`/products/${item.id}`} className="cartArt" style={{ background: item.color }}>
                    <span>{item.emoji}</span>
                  </Link>
                  <div>
                    <Link to={`/products/${item.id}`}>
                      <h2>{item.name}</h2>
                    </Link>
                    <p>{item.unit} · {item.brand} · {item.seller}</p>
                    <strong>Rs {item.price}</strong>
                  </div>
                  <div className="qtyControl">
                    <button onClick={() => dispatch(decrementQuantity(item.id))} aria-label={`Decrease ${item.name}`}>
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => dispatch(incrementQuantity(item.id))} aria-label={`Increase ${item.name}`}>
                      <Plus size={15} />
                    </button>
                  </div>
                  <button className="iconButton" onClick={() => dispatch(removeFromCart(item.id))} aria-label={`Remove ${item.name}`}>
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
            </div>
            <aside className="cartSummary">
              <h2>Bill summary</h2>
              <div><span>Subtotal</span><strong>Rs {subtotal}</strong></div>
              <div><span>Referral discount 20%</span><strong>- Rs {referralDiscount}</strong></div>
              <div><span>Delivery fee</span><strong>Rs {deliveryFee}</strong></div>
              <div className="totalLine"><span>Total</span><strong>Rs {total}</strong></div>
              <button className="primaryButton payButton" onClick={handlePay} disabled={isPaying}>
                {isPaying && <span className="buttonSpinner" />}
                {isPaying ? "Creating order..." : "Proceed to pay"}
              </button>
              {checkoutError && <p className="formError">{checkoutError}</p>}
              <div className="orderStatusPanel">
                <div>
                  <h3>After checkout</h3>
                  <p>Your cart clears and this order moves to My orders with live tracking.</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
