import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footerBrand">
        <strong>VDelivery</strong>
        <p>Quick commerce with cart checkout, referrals, support tickets, notifications, seller requests, and delivery partner requests.</p>
      </div>
      <nav className="footerColumns">
        <div>
          <h3>Shop</h3>
          <Link to="/">Groceries</Link>
          <Link to="/">Fresh fruits</Link>
          <Link to="/">Dairy</Link>
          <Link to="/cart">Cart</Link>
        </div>
        <div>
          <h3>Account</h3>
          <Link to="/login">Login</Link>
          <Link to="/console">My console</Link>
          <Link to="/cart">Orders</Link>
          <Link to="/cart">Referral discount</Link>
        </div>
        <div>
          <h3>Support</h3>
          <Link to="/console">Raise ticket</Link>
          <Link to="/cart">Track order</Link>
          <Link to="/cart">Payment help</Link>
          <Link to="/">Notifications</Link>
        </div>
        <div>
          <h3>Partner</h3>
          <Link to="/">Become a seller</Link>
          <Link to="/">Become a delivery partner</Link>
          <Link to="/login">User signup</Link>
          <Link to="/">Contact admin</Link>
        </div>
      </nav>
    </footer>
  );
}
