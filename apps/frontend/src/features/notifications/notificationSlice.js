import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [
      { id: 1, title: "Referral unlocked", message: "20% off is ready for your next order." },
      { id: 2, title: "Delivery nearby", message: "Your basket can arrive in 11 minutes." }
    ]
  },
  reducers: {
    pushNotification(state, action) {
      state.items.unshift(action.payload);
    },
    clearNotifications(state) {
      state.items = [];
    }
  }
});

export const { pushNotification, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
