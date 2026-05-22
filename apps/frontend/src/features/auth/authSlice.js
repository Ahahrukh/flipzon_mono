import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiRequest } from "../../services/api.js";

const savedSession = JSON.parse(localStorage.getItem("flipzon_session") || "null");

const initialState = {
  user: savedSession?.user || null,
  token: savedSession?.token || null,
  role: savedSession?.user?.role || "user",
  status: "idle",
  error: ""
};

export const loginUser = createAsyncThunk("auth/login", async ({ identifier, password }) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password })
  });
});

export const registerUser = createAsyncThunk("auth/register", async (payload) => {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.user?.role || "user";
      state.error = "";
      localStorage.setItem("flipzon_session", JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.role = "user";
      state.status = "idle";
      state.error = "";
      localStorage.removeItem("flipzon_session");
    },
    previewRole(state, action) {
      state.role = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        localStorage.setItem("flipzon_session", JSON.stringify(action.payload));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      })
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
        localStorage.setItem("flipzon_session", JSON.stringify(action.payload));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "error";
        state.error = action.error.message;
      });
  }
});

export const { setSession, logout, previewRole } = authSlice.actions;
export default authSlice.reducer;
