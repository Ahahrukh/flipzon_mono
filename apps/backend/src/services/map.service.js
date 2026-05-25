import { env } from "../config/env.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OPEN_ROUTE_URL = "https://api.openrouteservice.org/v2/directions/driving-car";

const fallbackCoordinates = { lat: 19.0596, lng: 72.8295 };

export const geocodeAddress = async (address = {}) => {
  if (address.coordinates?.lat && address.coordinates?.lng) return address.coordinates;

  const query = [address.line1, address.city, address.state, address.pincode].filter(Boolean).join(", ");
  if (!query) return fallbackCoordinates;

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: { "User-Agent": "VDeliveryQuickCommerce/1.0" }
    });
    if (!response.ok) throw new Error("Address lookup failed");

    const results = await response.json();
    const match = results?.[0];
    if (!match) return fallbackCoordinates;

    return { lat: Number(match.lat), lng: Number(match.lon) };
  } catch (error) {
    console.error("Nominatim geocode failed:", error.message);
    return fallbackCoordinates;
  }
};

export const calculateRouteEta = async ({ rider, customer }) => {
  const to = customer || fallbackCoordinates;
  const from = rider || { lat: to.lat + 0.025, lng: to.lng + 0.025 };

  if (!env.openRouteServiceApiKey) {
    const distanceKm = Math.max(0.2, Math.hypot(from.lat - to.lat, from.lng - to.lng) * 111);
    const durationSeconds = Math.max(180, Math.round((distanceKm / 18) * 3600));
    return { distanceMeters: Math.round(distanceKm * 1000), durationSeconds };
  }

  try {
    const response = await fetch(OPEN_ROUTE_URL, {
      method: "POST",
      headers: {
        Authorization: env.openRouteServiceApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        coordinates: [
          [from.lng, from.lat],
          [to.lng, to.lat]
        ],
        instructions: false
      })
    });
    if (!response.ok) throw new Error(`OpenRouteService failed with ${response.status}`);

    const data = await response.json();
    const summary = data.routes?.[0]?.summary;
    if (!summary) throw new Error("OpenRouteService route summary missing");

    return {
      distanceMeters: Math.round(summary.distance),
      durationSeconds: Math.round(summary.duration)
    };
  } catch (error) {
    console.error("OpenRouteService ETA failed:", error.message);
    const distanceKm = Math.max(0.2, Math.hypot(from.lat - to.lat, from.lng - to.lng) * 111);
    const durationSeconds = Math.max(180, Math.round((distanceKm / 18) * 3600));
    return { distanceMeters: Math.round(distanceKm * 1000), durationSeconds };
  }
};
