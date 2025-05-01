import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  discountList: [],
  activeDiscountList: [],
};

export const addNewDiscount = createAsyncThunk(
  "/discounts/addNewDiscount",
  async (formData) => {
    const result = await axios.post(
      "http://localhost:5000/api/admin/discounts/add",
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return result?.data;
  }
);

export const fetchAllDiscounts = createAsyncThunk(
  "/discounts/fetchAllDiscounts",
  async () => {
    const result = await axios.get("http://localhost:5000/api/admin/discounts/get");
    return result?.data;
  }
);

export const editDiscount = createAsyncThunk(
  "/discounts/editDiscount",
  async ({ id, formData }) => {
    const result = await axios.put(
      `http://localhost:5000/api/admin/discounts/edit/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return result?.data;
  }
);

export const deleteDiscount = createAsyncThunk(
  "/discounts/deleteDiscount",
  async (id) => {
    const result = await axios.delete(
      `http://localhost:5000/api/admin/discounts/delete/${id}`
    );
    return result?.data;
  }
);

export const fetchActiveDiscounts = createAsyncThunk(
  "/discounts/fetchActiveDiscounts",
  async () => {
    const result = await axios.get("http://localhost:5000/api/admin/discounts/active");
    return result?.data;
  }
);

const AdminDiscountSlice = createSlice({
  name: "adminDiscounts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDiscounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllDiscounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.discountList = action.payload.data;
      })
      .addCase(fetchAllDiscounts.rejected, (state) => {
        state.isLoading = false;
        state.discountList = [];
      })
      .addCase(fetchActiveDiscounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchActiveDiscounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeDiscountList = action.payload.data;
      })
      .addCase(fetchActiveDiscounts.rejected, (state) => {
        state.isLoading = false;
        state.activeDiscountList = [];
      });
  },
});

export default AdminDiscountSlice.reducer;