import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
  error: null
};

export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/shop/order/create",
        orderData
      );
      return response.data;
    } catch (error) {
      console.error("Order creation error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to create order" }
      );
    }
  }
);

export const verifyKhaltiPayment = createAsyncThunk(
  "/order/verifyKhaltiPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const { orderId } = paymentData;
      // Since the backend now handles redirects, we only need to fetch the latest order details
      const orderResponse = await axios.get(
        `http://localhost:5000/api/shop/order/details/${orderId}`
      );
      console.log("Fetched order details after verification:", orderResponse.data.data);
      return { success: true, order: orderResponse.data.data };
    } catch (error) {
      console.error("Order fetch error:", error.response?.data || error.message);
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to fetch order details" }
      );
    }
  }
);

export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/shop/order/list/${userId}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to fetch orders" }
      );
    }
  }
);

export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/shop/order/details/${id}`
      );
      console.log("Fetched order details:", response.data.data);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: error.message || "Failed to fetch order details" }
      );
    }
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
    clearOrderErrors: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.orderId = action.payload.orderId;
        state.orderDetails = action.payload.order;
        sessionStorage.setItem(
          "currentOrderId",
          JSON.stringify(action.payload.orderId)
        );
      })
      .addCase(createNewOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.orderId = null;
        state.error = action.payload || { message: "Failed to create order" };
      })
      .addCase(verifyKhaltiPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyKhaltiPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.order;
        state.error = null;
      })
      .addCase(verifyKhaltiPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || { message: "Failed to fetch order details" };
      })
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.orderList = [];
        state.error = action.payload || { message: "Failed to fetch orders" };
      })
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.orderDetails = null;
        state.error = action.payload || { message: "Failed to fetch order details" };
      });
  },
});

export const { resetOrderDetails, clearOrderErrors } = shoppingOrderSlice.actions;

export default shoppingOrderSlice.reducer;