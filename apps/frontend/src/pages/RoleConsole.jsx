import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import LiveMap from "../components/LiveMap.jsx";
import { apiRequest } from "../services/api.js";

const money = (value = 0) => `Rs ${Math.round(value)}`;

export default function RoleConsole() {
  const { token, user } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const role = user?.role || "user";
  const [message, setMessage] = useState("");

  return (
    <main>
      <Header />
      <section className="consolePage">
        <div className="sectionTitle">
          <div>
            <p>{user ? `${role.replace("_", " ")} workspace` : "User workspace"}</p>
            <h1>{user ? `Welcome, ${user.name}` : "Login as user first"}</h1>
          </div>
          {role === "user" && <Link className="secondaryButton" to="/">Back to shop</Link>}
        </div>

        {!user && (
          <div className="loginNotice">
            <span>Default signup creates a user account. Admin can manually update roles in database.</span>
            <Link to="/login">Login or create user account</Link>
          </div>
        )}

        {message && <p className="formSuccess">{message}</p>}
        {role === "admin" && <AdminConsole token={token} setMessage={setMessage} />}
        {role === "seller" && <SellerConsole token={token} setMessage={setMessage} />}
        {role === "delivery_partner" && <DeliveryConsole token={token} setMessage={setMessage} />}
        {role === "user" && <UserConsole user={user} token={token} initialTab={searchParams.get("tab")} initialOrderId={searchParams.get("order")} setMessage={setMessage} />}
      </section>
      <Footer />
    </main>
  );
}

function UserConsole({ user, token, initialTab, initialOrderId, setMessage }) {
  const [tab, setTab] = useState(initialTab === "orders" ? "orders" : "dashboard");
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId || "");
  const selectedOrder = useMemo(() => orders.find((order) => order._id === selectedOrderId) || orders[0], [orders, selectedOrderId]);

  const loadOrders = async () => {
    if (!token) return;
    const data = await apiRequest("/orders/mine", { token });
    setOrders(data.orders || []);
    if (!selectedOrderId && data.orders?.[0]) setSelectedOrderId(data.orders[0]._id);
  };

  useEffect(() => {
    if (token) loadOrders().catch((error) => setMessage(error.message));
  }, [token]);

  useEffect(() => {
    if (initialTab === "orders") setTab("orders");
    if (initialOrderId) setSelectedOrderId(initialOrderId);
  }, [initialOrderId, initialTab]);

  return (
    <>
      <div className="sellerTabs">
        {["dashboard", "orders", "tracking", "referral", "tickets"].map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="consoleGrid">
          <article className="consoleCard wide">
            <h2>Orders and checkout</h2>
            <p>Shop products, review cart, pay online, and track delivery after order assignment.</p>
            <Link className="primaryButton" to="/">Start shopping</Link>
          </article>
          <article className="consoleCard">
            <h2>My orders</h2>
            <p>{orders.length} orders placed</p>
            <button onClick={() => setTab("orders")}>View orders</button>
          </article>
          <article className="consoleCard">
            <h2>Referral</h2>
            <p>Your code: {user?.referralCode || "Login to generate code"}</p>
          </article>
        </div>
      )}

      {tab === "orders" && (
        <article className="opsPanel wide">
          <h2>My orders</h2>
          <div className="orderList">
            {orders.map((order) => (
              <button
                className={selectedOrder?._id === order._id ? "active" : ""}
                key={order._id}
                onClick={() => {
                  setSelectedOrderId(order._id);
                  setTab("tracking");
                }}
              >
                <span>#{order._id.slice(-8)}</span>
                <strong>{money(order.total)}</strong>
                <small>{order.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}</small>
                <em>{order.delivery?.status || "placed"}</em>
              </button>
            ))}
            {orders.length === 0 && <p>No orders yet. Place an order from the cart and it will appear here.</p>}
          </div>
        </article>
      )}

      {tab === "tracking" && (
        <div className="trackingGrid">
          <article className="opsPanel">
            <h2>Track your order</h2>
            {selectedOrder ? (
              <div className="trackingDetails">
                <strong>#{selectedOrder._id.slice(-8)}</strong>
                <span>{selectedOrder.items.map((item) => `${item.name} x${item.quantity}`).join(", ")}</span>
                <span>Payment: {selectedOrder.payment?.status || "pending"}</span>
                <span>Delivery: {selectedOrder.delivery?.status || "placed"}</span>
                <span>ETA: {selectedOrder.delivery?.etaMinutes || 12} min</span>
              </div>
            ) : (
              <p>No order selected.</p>
            )}
          </article>
          <LiveMap order={selectedOrder} />
        </div>
      )}

      {tab === "referral" && <article className="opsPanel wide"><h2>Referral</h2><p>Your code: {user?.referralCode || "Login to generate code"}</p></article>}
      {tab === "tickets" && <article className="opsPanel wide"><h2>Tickets</h2><p>Support ticket creation is available from the order flow.</p></article>}
    </>
  );
}

function AdminConsole({ token, setMessage }) {
  const [tab, setTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState("");
  const [offer, setOffer] = useState({ title: "", code: "", discountValue: 10 });

  const load = async () => {
    const [userData, productData, sellerData, partnerData, orderData, ticketData, withdrawalData, applicationData] = await Promise.all([
      apiRequest("/admin/users", { token }),
      apiRequest("/admin/products", { token }),
      apiRequest("/admin/sellers", { token }),
      apiRequest("/admin/delivery-partners", { token }),
      apiRequest("/admin/orders", { token }),
      apiRequest("/admin/tickets", { token }),
      apiRequest("/admin/withdrawals", { token }),
      apiRequest(`/admin/partner-applications${applicationStatus ? `?status=${applicationStatus}` : ""}`, { token })
    ]);
    setUsers(userData.users || []);
    setProducts(productData.products || []);
    setSellers(sellerData.sellers || []);
    setPartners(partnerData.partners || []);
    setOrders(orderData.orders || []);
    setTickets(ticketData.tickets || []);
    setWithdrawals(withdrawalData.withdrawals || []);
    setApplications(applicationData.applications || []);
  };

  useEffect(() => {
    if (token) load().catch((error) => setMessage(error.message));
  }, [token, applicationStatus]);

  const createOffer = async (event) => {
    event.preventDefault();
    await apiRequest("/admin/offers", {
      method: "POST",
      token,
      body: JSON.stringify({ ...offer, code: offer.code.toUpperCase(), discountType: "percentage" })
    });
    setOffer({ title: "", code: "", discountValue: 10 });
    setMessage("Offer created and users notified.");
  };

  const toggleSeller = async (seller) => {
    await apiRequest(`/admin/sellers/${seller.id || seller._id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ isActive: !seller.isActive })
    });
    setMessage("Seller status updated.");
    await load();
  };

  const updateApplication = async (application, status) => {
    await apiRequest(`/admin/partner-applications/${application._id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ ...application, status })
    });
    setMessage(`Application ${status}.`);
    await load();
  };

  return (
    <>
      <div className="sellerTabs">
        {["dashboard", "applications", "users", "sellers", "delivery", "products", "orders", "tickets", "offers", "withdrawals"].map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "dashboard" && (
        <div className="opsGrid">
          <article className="opsPanel"><h2>Users</h2><p>{users.length}</p></article>
          <article className="opsPanel"><h2>Sellers</h2><p>{sellers.length}</p></article>
          <article className="opsPanel"><h2>Products</h2><p>{products.length}</p></article>
          <article className="opsPanel"><h2>Orders</h2><p>{orders.length}</p></article>
          <article className="opsPanel"><h2>Tickets</h2><p>{tickets.length}</p></article>
          <article className="opsPanel"><h2>Withdrawals</h2><p>{withdrawals.length}</p></article>
          <article className="opsPanel"><h2>Access requests</h2><p>{applications.filter((item) => item.status === "pending").length} pending</p><button onClick={() => setTab("applications")}>Review requests</button></article>
        </div>
      )}
      {tab === "applications" && (
        <article className="opsPanel wide">
          <h2>Seller and delivery requests</h2>
          <select value={applicationStatus} onChange={(event) => setApplicationStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="sellerTable applicationTable">
            {applications.map((application) => (
              <div key={application._id}>
                <span>{application.name}</span>
                <span>{application.email || application.phone}</span>
                <span>{application.requestedRole.replace("_", " ")}</span>
                <span>{application.city || application.storeName || application.vehicleType || "No details"}</span>
                <span>{application.status}</span>
                <button onClick={() => updateApplication(application, "approved")}>Approve</button>
                <button onClick={() => updateApplication(application, "pending")}>Pending</button>
                <button onClick={() => updateApplication(application, "rejected")}>Reject</button>
              </div>
            ))}
            {applications.length === 0 && <p>No access requests yet.</p>}
          </div>
        </article>
      )}
      {tab === "users" && <AdminList title="All users" rows={users.map((u) => `${u.name} · ${u.email || u.phone} · ${u.role} · ${u.isActive ? "active" : "disabled"}`)} />}
      {tab === "sellers" && (
        <article className="opsPanel wide">
          <h2>Seller control</h2>
          <div className="opsList">
            {sellers.map((seller) => (
              <button key={seller._id} onClick={() => toggleSeller(seller)}>
                {seller.name} · {seller.sellerProfile?.isOnline === false ? "offline" : "online"} · {seller.isActive ? "Disable" : "Enable"}
              </button>
            ))}
            {sellers.length === 0 && <span>No sellers yet.</span>}
          </div>
        </article>
      )}
      {tab === "delivery" && <AdminList title="Delivery partners" rows={partners.map((p) => `${p.name} · ${p.email || p.phone} · ${p.isActive ? "active" : "disabled"}`)} />}
      {tab === "products" && <AdminList title="Product audit" rows={products.map((p) => `${p.name} · ${money(p.price)} · ${p.seller?.name || "Seller"} · ${p.status}`)} />}
      {tab === "orders" && <AdminList title="Order operations" rows={orders.map((o) => `${o._id.slice(-8)} · ${money(o.total)} · ${o.payment?.status} · ${o.delivery?.status}`)} />}
      {tab === "tickets" && <AdminList title="Support tickets" rows={tickets.map((t) => `${t.subject} · ${t.user?.name || "User"} · ${t.status}`)} />}
      {tab === "offers" && (
        <form className="opsPanel wide" onSubmit={createOffer}>
          <h2>Create offer</h2>
          <input value={offer.title} onChange={(e) => setOffer((current) => ({ ...current, title: e.target.value }))} placeholder="Offer title" required />
          <input value={offer.code} onChange={(e) => setOffer((current) => ({ ...current, code: e.target.value }))} placeholder="Code" required />
          <input type="number" value={offer.discountValue} onChange={(e) => setOffer((current) => ({ ...current, discountValue: Number(e.target.value) }))} />
          <button className="primaryButton">Create offer</button>
        </form>
      )}
      {tab === "withdrawals" && <AdminList title="Withdrawal requests" rows={withdrawals.map((w) => `${w.seller?.name || "Seller"} · ${money(w.amount)} · ${w.status}`)} />}
    </>
  );
}

function AdminList({ title, rows }) {
  return (
    <article className="opsPanel wide">
      <h2>{title}</h2>
      <div className="opsList">
        {rows.map((row, index) => <span key={`${row}-${index}`}>{row}</span>)}
        {rows.length === 0 && <span>No records yet.</span>}
      </div>
    </article>
  );
}

function SellerConsole({ token, setMessage }) {
  const [tab, setTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [earnings, setEarnings] = useState({ summary: { grossAmount: 0, netAmount: 0 }, rows: [] });
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalStatus, setWithdrawalStatus] = useState("");
  const [product, setProduct] = useState({ name: "", sku: "", category: "Fruits", price: 1, stock: 1, unit: "piece" });
  const [editingId, setEditingId] = useState("");
  const [withdrawal, setWithdrawal] = useState({ amount: 1, note: "" });
  const [csvFile, setCsvFile] = useState(null);

  const load = async () => {
    const [productData, earningData, withdrawalData] = await Promise.all([
      apiRequest("/seller/products", { token }),
      apiRequest("/seller/earnings", { token }),
      apiRequest(`/seller/withdrawals${withdrawalStatus ? `?status=${withdrawalStatus}` : ""}`, { token })
    ]);
    setProducts(productData.products || []);
    setEarnings(earningData);
    setWithdrawals(withdrawalData.withdrawals || []);
  };

  useEffect(() => {
    if (token) load().catch((error) => setMessage(error.message));
  }, [token, withdrawalStatus]);

  const addProduct = async (event) => {
    event.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    const path = editingId ? `/products/${editingId}` : "/products";
    await apiRequest(path, { method, token, body: JSON.stringify(product) });
    setProduct({ name: "", sku: "", category: "Fruits", price: 1, stock: 1, unit: "piece" });
    setEditingId("");
    setMessage(editingId ? "Product updated." : "Product added.");
    await load();
  };

  const editProduct = (item) => {
    setEditingId(item._id);
    setProduct({
      name: item.name,
      sku: item.sku,
      category: item.category,
      price: item.price,
      stock: item.stock,
      unit: item.unit || "piece",
      status: item.status
    });
    setTab("products");
  };

  const deleteProduct = async (id) => {
    await apiRequest(`/products/${id}`, { method: "DELETE", token });
    setMessage("Product deleted.");
    await load();
  };

  const uploadCsv = async (event) => {
    event.preventDefault();
    if (!csvFile) return setMessage("Choose a CSV file first.");
    const body = new FormData();
    body.append("file", csvFile);
    const result = await apiRequest("/products/bulk-csv", { method: "POST", token, body });
    setMessage(`${result.imported} products imported.`);
    setCsvFile(null);
    await load();
  };

  const requestWithdrawal = async (event) => {
    event.preventDefault();
    await apiRequest("/seller/withdrawals", { method: "POST", token, body: JSON.stringify(withdrawal) });
    setWithdrawal({ amount: 1, note: "" });
    setMessage("Withdrawal request sent to admin.");
    await load();
  };

  return (
    <>
      <div className="sellerTabs">
        {["dashboard", "products", "earnings", "withdrawals", "csv"].map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="opsGrid">
          <article className="opsPanel"><h2>Total products</h2><p>{products.length}</p><button onClick={() => setTab("products")}>Manage products</button></article>
          <article className="opsPanel"><h2>Total earning</h2><p>{money(earnings.summary?.netAmount)}</p><button onClick={() => setTab("earnings")}>Open earnings page</button></article>
          <article className="opsPanel"><h2>Withdrawals</h2><p>{withdrawals.length} requests</p><button onClick={() => setTab("withdrawals")}>View withdrawals</button></article>
          <article className="opsPanel"><h2>CSV upload</h2><p>Bulk import product catalog.</p><button onClick={() => setTab("csv")}>Upload CSV</button></article>
        </div>
      )}

      {tab === "products" && (
        <div className="opsGrid sellerProductsGrid">
          <form className="opsPanel" onSubmit={addProduct}>
            <h2>{editingId ? "Edit product" : "Add single product"}</h2>
            <input value={product.name} onChange={(e) => setProduct((current) => ({ ...current, name: e.target.value }))} placeholder="Product name" required />
            <input value={product.sku} onChange={(e) => setProduct((current) => ({ ...current, sku: e.target.value }))} placeholder="SKU" required />
            <input value={product.category} onChange={(e) => setProduct((current) => ({ ...current, category: e.target.value }))} placeholder="Category" required />
            <input type="number" value={product.price} onChange={(e) => setProduct((current) => ({ ...current, price: Number(e.target.value) }))} />
            <input type="number" value={product.stock} onChange={(e) => setProduct((current) => ({ ...current, stock: Number(e.target.value) }))} />
            <select value={product.status || "active"} onChange={(e) => setProduct((current) => ({ ...current, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="disabled">Disabled</option>
            </select>
            <button className="primaryButton">{editingId ? "Update product" : "Add product"}</button>
          </form>
          <article className="opsPanel wide">
            <h2>Product list</h2>
            <div className="sellerTable">
              {products.map((item) => (
                <div key={item._id}>
                  <span>{item.name}</span><span>{money(item.price)}</span><span>{item.stock} stock</span><span>{item.status}</span>
                  <button onClick={() => editProduct(item)}>Edit</button><button onClick={() => deleteProduct(item._id)}>Delete</button>
                </div>
              ))}
              {products.length === 0 && <p>No products added yet.</p>}
            </div>
          </article>
        </div>
      )}

      {tab === "earnings" && <div className="opsGrid"><article className="opsPanel wide"><h2>Total earning</h2><p>Gross {money(earnings.summary?.grossAmount)} · Platform fee {money(earnings.summary?.platformFee)} · Net {money(earnings.summary?.netAmount)}</p></article></div>}

      {tab === "withdrawals" && (
        <div className="opsGrid">
          <form className="opsPanel" onSubmit={requestWithdrawal}>
            <h2>Request withdrawal</h2>
            <input type="number" value={withdrawal.amount} onChange={(e) => setWithdrawal((current) => ({ ...current, amount: Number(e.target.value) }))} />
            <input value={withdrawal.note} onChange={(e) => setWithdrawal((current) => ({ ...current, note: e.target.value }))} placeholder="Note" />
            <button className="primaryButton">Request withdrawal</button>
          </form>
          <article className="opsPanel wide">
            <h2>Withdrawal list</h2>
            <select value={withdrawalStatus} onChange={(e) => setWithdrawalStatus(e.target.value)}>
              <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="paid">Paid</option>
            </select>
            <div className="opsList">{withdrawals.map((item) => <span key={item._id}>{money(item.amount)} · {item.status} · {new Date(item.createdAt).toLocaleDateString()}</span>)}</div>
          </article>
        </div>
      )}

      {tab === "csv" && (
        <form className="opsPanel wide" onSubmit={uploadCsv}>
          <h2>Upload products CSV</h2>
          <p>Required columns: name, sku, category, price. Optional: description, brand, imageUrl, mrp, stock, unit, status.</p>
          <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0])} />
          <button className="primaryButton">Upload file</button>
        </form>
      )}
    </>
  );
}

function DeliveryConsole({ token, setMessage }) {
  const [tab, setTab] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [location, setLocation] = useState({ orderId: "", lat: "19.0596", lng: "72.8295", etaMinutes: 12 });
  const assignedOrder = useMemo(() => orders.find((order) => order._id === location.orderId), [location.orderId, orders]);

  const load = async () => {
    const data = await apiRequest("/delivery/orders", { token });
    setOrders(data.orders || []);
  };

  useEffect(() => {
    if (token) load().catch((error) => setMessage(error.message));
  }, [token]);

  const updateLocation = async (event) => {
    event.preventDefault();
    if (!location.orderId) {
      setMessage("Select an assigned order first.");
      return;
    }
    await apiRequest(`/delivery/orders/${location.orderId}/location`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ lat: Number(location.lat), lng: Number(location.lng), etaMinutes: Number(location.etaMinutes) })
    });
    setMessage("Live location updated and user notified.");
    await load();
  };

  return (
    <>
      <div className="sellerTabs">
        {["dashboard", "assigned", "active", "location", "history", "notifications"].map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "dashboard" && (
        <div className="opsGrid">
          <article className="opsPanel"><h2>Assigned orders</h2><p>{orders.length}</p><button onClick={() => setTab("assigned")}>Open assignments</button></article>
          <article className="opsPanel"><h2>Active delivery</h2><p>{orders.filter((order) => order.delivery?.status === "out_for_delivery").length}</p><button onClick={() => setTab("active")}>View active</button></article>
          <article className="opsPanel"><h2>Location</h2><p>Update lat, lng and ETA for selected order.</p><button onClick={() => setTab("location")}>Update location</button></article>
        </div>
      )}
      {tab === "assigned" && <DeliveryOrderList orders={orders} setLocation={setLocation} />}
      {tab === "active" && <DeliveryOrderList orders={orders.filter((order) => order.delivery?.status === "out_for_delivery")} setLocation={setLocation} />}
      {tab === "location" && (
        <form className="opsPanel wide" onSubmit={updateLocation}>
          <h2>Update live location</h2>
          <select value={location.orderId} onChange={(e) => setLocation((current) => ({ ...current, orderId: e.target.value }))}>
            <option value="">Select assigned order</option>
            {orders.map((order) => <option key={order._id} value={order._id}>{order._id.slice(-8)}</option>)}
          </select>
          <input value={location.lat} onChange={(e) => setLocation((current) => ({ ...current, lat: e.target.value }))} placeholder="Latitude" />
          <input value={location.lng} onChange={(e) => setLocation((current) => ({ ...current, lng: e.target.value }))} placeholder="Longitude" />
          <input type="number" value={location.etaMinutes} onChange={(e) => setLocation((current) => ({ ...current, etaMinutes: Number(e.target.value) }))} />
          <button className="primaryButton">Send location</button>
        </form>
      )}
      {tab === "history" && <DeliveryOrderList orders={orders.filter((order) => ["delivered", "cancelled"].includes(order.delivery?.status))} setLocation={setLocation} />}
      {tab === "notifications" && <article className="opsPanel wide"><h2>Notifications</h2><p>Pickup, drop, and location update notifications arrive in real-time via Socket.IO.</p></article>}
      {assignedOrder && <article className="opsPanel wide"><h2>Selected assignment</h2><p>{assignedOrder._id.slice(-8)} · {assignedOrder.items?.length || 0} items · {assignedOrder.delivery?.status}</p></article>}
    </>
  );
}

function DeliveryOrderList({ orders, setLocation }) {
  return (
    <article className="opsPanel wide">
      <h2>Orders</h2>
      <div className="opsList">
        {orders.map((order) => (
          <button key={order._id} onClick={() => setLocation((current) => ({ ...current, orderId: order._id }))}>
            {order._id.slice(-8)} · {money(order.total)} · {order.delivery?.status}
          </button>
        ))}
        {orders.length === 0 && <span>No orders in this view.</span>}
      </div>
    </article>
  );
}
