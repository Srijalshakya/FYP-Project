import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import adminProductsSlice from "./admin/products-slice";
import adminOrderSlice from "./admin/order-slice";
import userSlice from "./admin/user-slice"; 
import adminDashboardSlice from "./admin/admin-dashboard-slice"; 

import shopProductsSlice from "./shop/products-slice";
import shopCartSlice from "./shop/cart-slice";
import shopAddressSlice from "./shop/address-slice";
import shopOrderSlice from "./shop/order-slice";
import shopReviewSlice from "./shop/review-slice";
import commonFeatureSlice from "./common-slice/index";
import adminDiscountSlice from "./admin/discount-slice"; 

const store = configureStore({
  reducer: {
    auth: authReducer,

    adminProducts: adminProductsSlice,
    adminOrder: adminOrderSlice,
    users: userSlice,
    adminDashboard: adminDashboardSlice, 

    shopProducts: shopProductsSlice,
    shopCart: shopCartSlice,
    shopAddress: shopAddressSlice,
    shopOrder: shopOrderSlice,
    shopReview: shopReviewSlice,

    commonFeature: commonFeatureSlice,


    adminDiscount: adminDiscountSlice, 
  },
});

export default store;