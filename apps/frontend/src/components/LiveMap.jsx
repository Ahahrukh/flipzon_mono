import { LocateFixed } from "lucide-react";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const socketUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/api\/?$/, "");
const fallbackCustomer = { lat: 19.0596, lng: 72.8295 };
const fallbackRider = { lat: 19.063, lng: 72.835 };

const makeIcon = (className, label) =>
  L.divIcon({
    className,
    html: `<span>${label}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });

const customerIcon = makeIcon("mapMarker customerMarker", "You");
const riderIcon = makeIcon("mapMarker riderMarker", "R");

export default function LiveMap({ order }) {
  const user = useSelector((state) => state.auth.user);
  const [liveOrder, setLiveOrder] = useState(order);
  const mapNodeRef = useRef(null);
  const mapRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const routeRef = useRef(null);

  useEffect(() => {
    setLiveOrder(order);
  }, [order]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const socket = io(socketUrl, { reconnectionAttempts: 5 });
    socket.on("connect", () => socket.emit("join:user", user.id));
    socket.on("notification:new", (notification) => {
      const data = notification?.data;
      if (data?.orderId && data.orderId === order?._id && data.currentLocation) {
        setLiveOrder((current) => ({
          ...current,
          delivery: {
            ...current.delivery,
            currentLocation: data.currentLocation,
            etaMinutes: data.etaMinutes,
            distanceMeters: data.distanceMeters,
            status: data.status || current.delivery?.status
          }
        }));
      }
    });
    return () => socket.disconnect();
  }, [order?._id, user?.id]);

  const customer = liveOrder?.delivery?.address?.coordinates || fallbackCustomer;
  const rider = liveOrder?.delivery?.currentLocation || fallbackRider;
  const eta = liveOrder?.delivery?.etaMinutes || 12;
  const distanceKm = liveOrder?.delivery?.distanceMeters ? (liveOrder.delivery.distanceMeters / 1000).toFixed(1) : "calculating";
  const status = liveOrder?.delivery?.status || "placed";
  const route = useMemo(() => [[rider.lat, rider.lng], [customer.lat, customer.lng]], [customer.lat, customer.lng, rider.lat, rider.lng]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;
    mapRef.current = L.map(mapNodeRef.current, { scrollWheelZoom: false }).setView([customer.lat, customer.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapRef.current);
    customerMarkerRef.current = L.marker([customer.lat, customer.lng], { icon: customerIcon }).addTo(mapRef.current).bindPopup("Delivery address");
    riderMarkerRef.current = L.marker([rider.lat, rider.lng], { icon: riderIcon }).addTo(mapRef.current).bindPopup(`Delivery partner · ETA ${eta} min`);
    routeRef.current = L.polyline(route, { color: "#173d2e", weight: 5, opacity: 0.75 }).addTo(mapRef.current);
    mapRef.current.fitBounds(route, { padding: [40, 40], maxZoom: 15 });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      customerMarkerRef.current = null;
      riderMarkerRef.current = null;
      routeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    customerMarkerRef.current?.setLatLng([customer.lat, customer.lng]);
    riderMarkerRef.current?.setLatLng([rider.lat, rider.lng]).setPopupContent(`Delivery partner · ETA ${eta} min`);
    routeRef.current?.setLatLngs(route);
    mapRef.current.fitBounds(route, { padding: [40, 40], maxZoom: 15 });
    window.setTimeout(() => mapRef.current?.invalidateSize(), 50);
  }, [customer.lat, customer.lng, eta, rider.lat, rider.lng, route]);

  const centerMap = () => {
    mapRef.current?.fitBounds(route, { padding: [40, 40], maxZoom: 15 });
  };

  return (
    <section className="mapPanel liveMapPanel">
      <div className="mapHeader">
        <div>
          <p>Live delivery</p>
          <h2>{liveOrder ? `Order #${liveOrder._id.slice(-8)}` : "Track every order"}</h2>
          <span>{status.replaceAll("_", " ")} · ETA {eta} min · {distanceKm} km</span>
        </div>
        <button className="iconButton" aria-label="Center map" type="button" onClick={centerMap}>
          <LocateFixed size={18} />
        </button>
      </div>
      <div className="leafletMap" ref={mapNodeRef} />
    </section>
  );
}
