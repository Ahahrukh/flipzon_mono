import { Bell, MapPin, Search, ShoppingBag, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { logout, setSession } from "../features/auth/authSlice.js";
import { apiRequest } from "../services/api.js";

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
  const [showNotifications, setShowNotifications] = useState(false);
  const [serverNotifications, setServerNotifications] = useState([]);
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, item) => sum + item.quantity, 0));
  const localNotifications = useSelector((state) => state.notifications.items);
  const { token, user } = useSelector((state) => state.auth);
  const unreadCount = token ? serverNotifications.filter((item) => !item.readAt).length : localNotifications.length;
  const isShopper = !user || user.role === "user";
  const isSeller = user?.role === "seller";
  const sellerOnline = user?.sellerProfile?.isOnline !== false;
  const queryFromUrl = searchParams.get("q") || "";

  useEffect(() => {
    setSearchValue(queryFromUrl);
  }, [queryFromUrl]);

  const loadNotifications = async () => {
    if (!token) return;
    const data = await apiRequest("/notifications", { token });
    setServerNotifications(data.notifications || []);
  };

  useEffect(() => {
    if (token) loadNotifications().catch(() => setServerNotifications([]));
  }, [token]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchValue.trim();
    window.dispatchEvent(new CustomEvent("flipzon:search", { detail: query }));
    navigate(query ? `/?q=${encodeURIComponent(query)}` : "/");
  };

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
      <form className="searchBox" onSubmit={submitSearch}>
        <button className="searchSubmit" type="submit" aria-label="Search products">
          <Search size={18} />
        </button>
        <input
          value={searchValue}
          onChange={(event) => {
            setSearchValue(event.target.value);
            window.dispatchEvent(new CustomEvent("flipzon:search", { detail: event.target.value }));
          }}
          placeholder="Search milk, mango, chips, atta..."
        />
      </form>
      <nav className="navActions">
        <Link to={user ? "/console" : "/login"} className="iconButton" aria-label={user ? "My console" : "Login"}>
          <UserRound size={19} />
        </Link>
        <div className="notificationWrap">
          <button
            className="iconButton"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications((current) => !current);
              loadNotifications().catch(() => {});
            }}
            type="button"
          >
            <Bell size={19} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notificationPanel">
              <div className="notificationHead">
                <strong>Notifications</strong>
                {token && serverNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await apiRequest("/notifications/read", {
                        method: "PATCH",
                        token,
                        body: JSON.stringify({ ids: serverNotifications.map((item) => item._id) })
                      });
                      await loadNotifications();
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="notificationList">
                {(token ? serverNotifications : localNotifications).slice(0, 8).map((item) => (
                  <button
                    type="button"
                    key={item._id || item.id}
                    onClick={() => {
                      setShowNotifications(false);
                      if (item.type === "partner_application" || item.data?.applicationId) navigate("/console");
                    }}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.message}</span>
                  </button>
                ))}
                {(token ? serverNotifications : localNotifications).length === 0 && <span className="emptyNotice">No notifications yet.</span>}
              </div>
            </div>
          )}
        </div>
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
