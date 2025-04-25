require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopSearchRouter = require("./routes/shop/search-routes");
const shopReviewRouter = require("./routes/shop/review-routes");
const commonFeatureRouter = require("./routes/common/feature-routes");
const khaltiRouter = require("./routes/shop/khalti-payment-router");

console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET');
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('Email Provider:', process.env.EMAIL_USER ? 'Set (hidden for security)' : 'NOT SET');
console.log('Khalti Secret Key:', process.env.KHALTI_SECRET_KEY ? 'Set (hidden for security)' : 'NOT SET');
console.log('Khalti Gateway URL:', process.env.KHALTI_GATEWAY_URL || 'NOT SET');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('WARNING: EMAIL_USER or EMAIL_PASS environment variables not set. OTP email functionality will not work!');
}

if (!process.env.KHALTI_SECRET_KEY || !process.env.KHALTI_GATEWAY_URL) {
  console.warn('WARNING: KHALTI_SECRET_KEY or KHALTI_GATEWAY_URL not set. Khalti payment functionality will not work!');
}

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://your-production-domain.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Origin blocked by CORS:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "Accept",
      "Cache-Control",
      "X-CSRF-Token"
    ]
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

const apiRouter = express.Router();
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/products", adminProductsRouter);
apiRouter.use("/admin/orders", adminOrderRouter);
apiRouter.use("/shop/products", shopProductsRouter);
apiRouter.use("/shop/cart", shopCartRouter);
apiRouter.use("/shop/address", shopAddressRouter);
apiRouter.use("/shop/order", shopOrderRouter);
apiRouter.use("/shop/search", shopSearchRouter);
apiRouter.use("/shop/review", shopReviewRouter);
apiRouter.use("/common/feature", commonFeatureRouter);
apiRouter.use("/payment", khaltiRouter);
app.use("/api", apiRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));
  })
  .catch((error) => {
    console.log("MongoDB connection error: ", error);
    process.exit(1);
  });

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});