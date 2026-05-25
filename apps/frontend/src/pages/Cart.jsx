import { LocateFixed, Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import { clearCart, decrementQuantity, incrementQuantity, removeFromCart } from "../features/cart/cartSlice.js";
import { apiRequest } from "../services/api.js";
import { getCurrentLocation } from "../utils/location.js";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [locationStatus, setLocationStatus] = useState("Optional: use current location for more accurate ETA.");
  const [address, setAddress] = useState({ line1: "Bandra West", city: "Mumbai", state: "Maharashtra", pincode: "400050", coordinates: null });
  const items = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const referralDiscount = subtotal > 0 ? Math.round(subtotal * 0.2) : 0;
  const deliveryFee = subtotal > 499 || subtotal === 0 ? 0 : 25;
  const total = subtotal - referralDiscount + deliveryFee;

  const captureLocation = useCallback(async () => {
    setIsLocating(true);
    try {
      const coordinates = await getCurrentLocation({ onStatus: setLocationStatus });
      setAddress((current) => ({ ...current, coordinates }));
      setLocationStatus(`Location captured: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
      return coordinates;
    } finally {
      setIsLocating(false);
    }
  }, []);

  const handlePay = useCallback(async () => {
    if (!user) {
      sessionStorage.setItem("VDelivery_pending_checkout", "1");
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
            ...address,
            ...(address.coordinates ? { coordinates: address.coordinates } : {})
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
  }, [address, captureLocation, dispatch, items, navigate, token, user]);

  useEffect(() => {
    const shouldResume = sessionStorage.getItem("VDelivery_pending_checkout") === "1";
    if (user && shouldResume && items.length > 0) {
      sessionStorage.removeItem("VDelivery_pending_checkout");
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
              <div className="addressBox">
                <h3>Delivery address</h3>
                <input value={address.line1} onChange={(event) => setAddress((current) => ({ ...current, line1: event.target.value }))} placeholder="Area / street" />
                <input value={address.city} onChange={(event) => setAddress((current) => ({ ...current, city: event.target.value }))} placeholder="City" />
                <input value={address.state} onChange={(event) => setAddress((current) => ({ ...current, state: event.target.value }))} placeholder="State" />
                <input value={address.pincode} onChange={(event) => setAddress((current) => ({ ...current, pincode: event.target.value }))} placeholder="Pincode" />
                <button className="secondaryButton locationButton" type="button" disabled={isLocating} onClick={() => {
                  setCheckoutError("");
                  captureLocation().catch((error) => {
                    setLocationStatus("Typed address will be used for delivery ETA.");
                    setCheckoutError(error.message);
                  });
                }}>
                  <LocateFixed size={17} />
                  {isLocating ? "Getting location..." : "Use my current location"}
                </button>
                <p className={address.coordinates ? "geoStatus success" : "geoStatus"}>{locationStatus}</p>
              </div>
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
