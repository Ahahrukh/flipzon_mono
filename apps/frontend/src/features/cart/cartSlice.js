import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: []
  },
  reducers: {
    addToCart(state, action) {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) existing.quantity += 1;
      else state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
    },
    incrementQuantity(state, action) {
      const existing = state.items.find((item) => item.id === action.payload);
      if (existing) existing.quantity += 1;
    },
    decrementQuantity(state, action) {
      const existing = state.items.find((item) => item.id === action.payload);
      if (!existing) return;
      if (existing.quantity <= 1) state.items = state.items.filter((item) => item.id !== action.payload);
      else existing.quantity -= 1;
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    }
  }
});

export const { addToCart, clearCart, decrementQuantity, incrementQuantity, removeFromCart } = cartSlice.actions;
export default cartSlice.reducer;
