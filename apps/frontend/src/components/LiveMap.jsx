import { LocateFixed, Navigation } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveMap() {
  return (
    <section className="mapPanel">
      <div className="mapHeader">
        <div>
          <p>Live delivery</p>
          <h2>Track every order like Blinkit</h2>
        </div>
        <button className="iconButton" aria-label="Center map">
          <LocateFixed size={18} />
        </button>
      </div>
      <div className="mapCanvas">
        <span className="road roadOne" />
        <span className="road roadTwo" />
        <span className="pin userPin">You</span>
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
