import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import adminProductsSlice from "./admin/products-slice";
import adminOrderSlice from "./admin/order-slice";
import userSlice from "./admin/user-slice"; // Updated import path
import adminDashboardSlice from "./admin/admin-dashboard-slice"; // Add import

import shopProductsSlice from "./shop/products-slice";
import shopCartSlice from "./shop/cart-slice";
import shopAddressSlice from "./shop/address-slice";
import shopOrderSlice from "./shop/order-slice";
import shopSearchSlice from "./shop/search-slice";
import shopReviewSlice from "./shop/review-slice";
import commonFeatureSlice from "./common-slice/index";

// Import the adminDiscountSlice
import adminDiscountSlice from "./admin/discount-slice"; // Added import

const store = configureStore({
  reducer: {
    auth: authReducer,

    adminProducts: adminProductsSlice,
    adminOrder: adminOrderSlice,
    users: userSlice,
    adminDashboard: adminDashboardSlice, // Add reducer

    shopProducts: shopProductsSlice,
    shopCart: shopCartSlice,
    shopAddress: shopAddressSlice,
    shopOrder: shopOrderSlice,
    shopSearch: shopSearchSlice,
    shopReview: shopReviewSlice,

    commonFeature: commonFeatureSlice,

    // Add the adminDiscount reducer
    adminDiscount: adminDiscountSlice, // Added reducer
  },
});

export default store;