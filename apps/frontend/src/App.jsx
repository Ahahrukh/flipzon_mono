import { Route, Routes } from "react-router-dom";
import Cart from "./pages/Cart.jsx";
import ChatBot from "./components/ChatBot.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Login from "./pages/Login.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import RoleConsole from "./pages/RoleConsole.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/console" element={<RoleConsole />} />
      </Routes>
      <ChatBot />
    </>
  );
}
