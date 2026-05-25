import { PackagePlus, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { apiRequest } from "../services/api.js";

const roleSections = [
  {
    role: "user",
    title: "User shopping",
    body: "Browse products, apply referral discount, pay online, track orders, and raise tickets.",
    Icon: ShoppingBag
  },
  {
    role: "seller",
    title: "Become a seller",
    body: "Apply to sell products on VDelivery. Admin will review and manually update your role after approval.",
    Icon: PackagePlus
  },
  {
    role: "delivery_partner",
    title: "Become a delivery partner",
    body: "Apply for delivery work. Admin will verify details and manually enable delivery partner access.",
    Icon: Truck
  }
];

export default function RoleSections({ authenticated }) {
  const { token, user } = useSelector((state) => state.auth);
  const [request, setRequest] = useState({
    requestedRole: "seller",
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    city: "",
    storeName: "",
    vehicleType: "",
    note: ""
  });
  const [message, setMessage] = useState("");
  const submitRequest = async (event) => {
    event.preventDefault();
    await apiRequest("/partner-applications", {
      method: "POST",
      token,
      body: JSON.stringify(request)
    });
    setMessage("Request sent to admin for review.");
    setRequest((current) => ({
      requestedRole: current.requestedRole,
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      city: "",
      storeName: "",
      vehicleType: "",
      note: ""
    }));
  };

  return (
    <section className="roleSectionBand">
      <div className="sectionTitle">
        <div>
          <p>User flow</p>
          <h2>Shop first, request seller or delivery access later</h2>
        </div>
      </div>
      <div className="roleSectionGrid">
        {roleSections.map(({ role, title, body, Icon }) => (
          <article className="roleSectionCard" key={role}>
            <Icon size={24} />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <form className="partnerRequestForm" onSubmit={submitRequest}>
        <div>
          <p>Access request</p>
          <h3>Want to become a seller or delivery partner?</h3>
        </div>
        <label>
          Request type
          <select value={request.requestedRole} onChange={(event) => setRequest((current) => ({ ...current, requestedRole: event.target.value }))}>
            <option value="seller">Become a seller</option>
            <option value="delivery_partner">Become a delivery partner</option>
          </select>
        </label>
        <label>
          Name
          <input value={request.name} onChange={(event) => setRequest((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" required />
        </label>
        <label>
          Email
          <input type="email" value={request.email} onChange={(event) => setRequest((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" required />
        </label>
        <label>
          Phone
          <input value={request.phone} onChange={(event) => setRequest((current) => ({ ...current, phone: event.target.value }))} placeholder="9876543210" required />
        </label>
        <label>
          City
          <input value={request.city} onChange={(event) => setRequest((current) => ({ ...current, city: event.target.value }))} placeholder="Mumbai" required />
        </label>
        {request.requestedRole === "seller" && (
          <label>
            Store name
            <input value={request.storeName} onChange={(event) => setRequest((current) => ({ ...current, storeName: event.target.value }))} placeholder="Fresh Basket" required />
          </label>
        )}
        {request.requestedRole === "delivery_partner" && (
          <label>
            Vehicle type
            <input value={request.vehicleType} onChange={(event) => setRequest((current) => ({ ...current, vehicleType: event.target.value }))} placeholder="Bike, scooter, cycle" required />
          </label>
        )}
        <label>
          Details
          <input value={request.note} onChange={(event) => setRequest((current) => ({ ...current, note: event.target.value }))} placeholder="Extra information for admin" />
        </label>
        <button className="primaryButton" type="submit">Submit request</button>
        {message && <p className="formSuccess">{message}</p>}
      </form>
    </section>
  );
}
