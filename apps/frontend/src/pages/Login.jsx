import { motion } from "framer-motion";
import { Smartphone, Mail, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../components/Header.jsx";
import { loginUser, registerUser } from "../features/auth/authSlice.js";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    identifier: "",
    email: "",
    phone: "",
    password: ""
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((state) => state.auth);
  const isLoading = status === "loading";
  const redirectTo = searchParams.get("redirect") || "/console";
  const pendingCheckout = searchParams.get("checkout") === "1";
  const title = useMemo(() => (mode === "login" ? "Sign in with email or phone" : "Create user account"), [mode]);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const action =
      mode === "login"
        ? loginUser({ identifier: form.identifier, password: form.password })
        : registerUser({
            name: form.name,
            email: form.email || undefined,
            phone: form.phone || undefined,
            password: form.password,
            role: "user"
          });
    const result = await dispatch(action);
    if (!result.error) {
      if (pendingCheckout) sessionStorage.setItem("flipzon_pending_checkout", "1");
      navigate(redirectTo);
    }
  };

  return (
    <main>
      <Header />
      <section className="authPage">
        <motion.form className="authForm" onSubmit={submit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="eyebrow">
            <ShieldCheck size={16} /> Central login
          </p>
          <h1>{title}</h1>
          {pendingCheckout && (
            <p className="formNotice">Login or create a user account to continue payment for your cart.</p>
          )}
          <div className="roleTabs authTabs">
            <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
              Login
            </button>
            <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
              Register
            </button>
          </div>

          {mode === "register" && (
            <>
              <label>
                <span>Name</span>
                <input name="name" value={form.name} onChange={update} placeholder="Your name" required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" value={form.email} onChange={update} placeholder="you@flipzon.com" />
              </label>
              <label>
                <span>Phone</span>
                <input name="phone" value={form.phone} onChange={update} placeholder="9876543210" />
              </label>
            </>
          )}

          {mode === "login" && (
            <label>
              <span>Email or phone</span>
              <div className="inputWithIcon">
                <Mail size={18} />
                <input
                  name="identifier"
                  value={form.identifier}
                  onChange={update}
                  placeholder="you@flipzon.com or 9876543210"
                  required
                />
              </div>
            </label>
          )}
          <label>
            <span>Password</span>
            <input name="password" value={form.password} onChange={update} type="password" placeholder="Enter password" required />
          </label>
          {error && <p className="formError">{error}</p>}
          {user && <p className="formSuccess">Logged in as {user.role.replace("_", " ")}</p>}
          <button className="primaryButton" type="submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
          <button className="secondaryButton" type="button" onClick={() => window.alert("OTP endpoint is ready: POST /api/auth/otp/request")}>
            <Smartphone size={17} /> Send phone OTP
          </button>
          <Link className="textLink" to="/">
            Continue shopping
          </Link>
        </motion.form>
      </section>
      <Footer />
    </main>
  );
}
