import { Bell, MapPin, Search, ShoppingBag, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { logout, setSession } from "../features/auth/authSlice.js";
import { apiRequest } from "../services/api.js";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const notifications = useSelector((state) => state.notifications.items.length);
  const { token, user } = useSelector((state) => state.auth);
  const isShopper = !user || user.role === "user";
  const isSeller = user?.role === "seller";
  const sellerOnline = user?.sellerProfile?.isOnline !== false;
  const toggleOnline = async () => {
    if (!token) return;
    const data = await apiRequest("/seller/availability", {
      method: "PATCH",
      token,
      body: JSON.stringify({ isOnline: !sellerOnline })
    });
    dispatch(setSession({ user: data.user, token }));
  };

  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brandMark">FZ</span>
        <span>Flipzon</span>
      </Link>
      <div className="location">
        <MapPin size={18} />
        <span>Delivering to Bandra West</span>
      </div>
      <label className="searchBox">
        <Search size={18} />
        <input placeholder="Search milk, mango, chips, atta..." />
      </label>
      <nav className="navActions">
        <Link to={user ? "/console" : "/login"} className="iconButton" aria-label={user ? "My console" : "Login"}>
          <UserRound size={19} />
        </Link>
        <button className="iconButton" aria-label="Notifications">
          <Bell size={19} />
          {notifications > 0 && <span className="badge">{notifications}</span>}
        </button>
        {isSeller && (
          <button className={sellerOnline ? "onlineToggle active" : "onlineToggle"} onClick={toggleOnline}>
            {sellerOnline ? "Online" : "Offline"}
          </button>
        )}
        {isShopper && (
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link to="/cart" className="cartButton">
            <ShoppingBag size={19} />
            <span>{cartCount} items</span>
            </Link>
          </motion.div>
        )}
        {user ? (
          <button
            className="secondaryButton compact"
            onClick={() => {
              dispatch(logout());
              navigate("/");
            }}
          >
            Logout
          </button>
        ) : (
          <Link className="secondaryButton compact" to="/login">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
