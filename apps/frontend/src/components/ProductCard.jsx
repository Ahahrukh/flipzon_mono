import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, decrementQuantity, incrementQuantity } from "../features/cart/cartSlice.js";

export default function ProductCard({ product }) {
  const dispatch = useDispatch();
  const cartItem = useSelector((state) => state.cart.items.find((item) => item.id === product.id));

  return (
    <motion.article className="productCard" whileHover={{ y: -4 }} layout>
      <Link to={`/products/${product.id}`} className="productArt" style={{ background: product.color }}>
        <span>{product.emoji}</span>
      </Link>
      <div className="productMeta">
        <p>{product.time}</p>
        <Link to={`/products/${product.id}`}>
          <h3>{product.name}</h3>
        </Link>
        <span>{product.unit}</span>
        <small>{product.brand} · {product.rating} rating</small>
      </div>
      <div className="productBuy">
        <strong>Rs {product.price}</strong>
        {cartItem ? (
          <div className="qtyControl">
            <button onClick={() => dispatch(decrementQuantity(product.id))} aria-label={`Remove one ${product.name}`}>
              <Minus size={15} />
            </button>
            <span>{cartItem.quantity}</span>
            <button onClick={() => dispatch(incrementQuantity(product.id))} aria-label={`Add one ${product.name}`}>
              <Plus size={15} />
            </button>
          </div>
        ) : (
          <button onClick={() => dispatch(addToCart(product))} aria-label={`Add ${product.name}`}>
            <Plus size={17} />
          </button>
        )}
      </div>
    </motion.article>
  );
}
