import { PackagePlus, ShoppingBag, Truck } from "lucide-react";
import { useState } from "react";

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
    body: "Apply to sell products on Flipzon. Admin will review and manually update your role after approval.",
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
  const [request, setRequest] = useState({ type: "seller", name: "", phone: "", note: "" });
  const submitRequest = (event) => {
    event.preventDefault();
    window.alert(`Your ${request.type.replace("_", " ")} request is captured. Admin can verify it and update the role manually in database.`);
    setRequest({ type: request.type, name: "", phone: "", note: "" });
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
          <select value={request.type} onChange={(event) => setRequest((current) => ({ ...current, type: event.target.value }))}>
            <option value="seller">Become a seller</option>
            <option value="delivery_partner">Become a delivery partner</option>
          </select>
        </label>
        <label>
          Name
          <input value={request.name} onChange={(event) => setRequest((current) => ({ ...current, name: event.target.value }))} placeholder="Your name" required />
        </label>
        <label>
          Phone
          <input value={request.phone} onChange={(event) => setRequest((current) => ({ ...current, phone: event.target.value }))} placeholder="9876543210" required />
        </label>
        <label>
          Details
          <input value={request.note} onChange={(event) => setRequest((current) => ({ ...current, note: event.target.value }))} placeholder="Store name, vehicle type, city..." />
        </label>
        <button className="primaryButton" type="submit">Submit request</button>
      </form>
    </section>
  );
}
