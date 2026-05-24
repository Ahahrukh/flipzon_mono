import { LocateFixed, Navigation } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveMap({ order }) {
  const currentLocation = order?.delivery?.currentLocation;
  const eta = order?.delivery?.etaMinutes || 12;
  const status = order?.delivery?.status || "placed";

  return (
    <section className="mapPanel">
      <div className="mapHeader">
        <div>
          <p>Live delivery</p>
          <h2>{order ? `Order #${order._id.slice(-8)}` : "Track every order like Blinkit"}</h2>
          <span>{status.replaceAll("_", " ")} · ETA {eta} min</span>
        </div>
        <button className="iconButton" aria-label="Center map">
          <LocateFixed size={18} />
        </button>
      </div>
      <div className="mapCanvas">
        <span className="road roadOne" />
        <span className="road roadTwo" />
        <span className="pin userPin">You</span>
        {currentLocation && <span className="pin riderPin">{currentLocation.lat.toFixed(2)}, {currentLocation.lng.toFixed(2)}</span>}
        <motion.span
          className="rider"
          animate={{ x: [0, 120, 180, 60, 0], y: [0, -30, 40, 72, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        >
          <Navigation size={18} />
        </motion.span>
      </div>
    </section>
  );
}
