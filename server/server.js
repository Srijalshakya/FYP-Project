require('dotenv').config({ path: require('path').resolve(__dirname, '.env'), debug: true });
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const authRouter = require("./routes/auth/auth-routes");
const adminProductsRouter = require("./routes/admin/products-routes");
const adminOrderRouter = require("./routes/admin/order-routes");
const adminDashboardRouter = require("./routes/admin/dashboard-routes");
const shopProductsRouter = require("./routes/shop/products-routes");
const shopCartRouter = require("./routes/shop/cart-routes");
const shopAddressRouter = require("./routes/shop/address-routes");
const shopOrderRouter = require("./routes/shop/order-routes");
const shopReviewRouter = require("./routes/shop/review-routes");
const shopContactRouter = require("./routes/shop/contact-router");
const commonFeatureRouter = require("./routes/common/feature-routes");
const khaltiRouter = require("./routes/shop/khalti-payment-router");
const adminDiscountRouter = require("./routes/admin/discount-routes");

console.log('Loaded Environment Variables:');
console.log('EMAIL_USERNAME:', process.env.EMAIL_USERNAME || 'NOT SET');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set (hidden)' : 'NOT SET');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (hidden)' : 'NOT SET');
console.log('PORT:', process.env.PORT || 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI not set. Cannot connect to MongoDB.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set. Using default secret.');
}
if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
  console.error('ERROR: EMAIL_USERNAME or EMAIL_PASSWORD not set. Email functionality will not work.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://your-production-domain.com',
  'https://fitmart-backend.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked:", origin);
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

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

const apiRouter = express.Router();

console.log('Mounting auth routes at /api/auth');
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin/products", adminProductsRouter);
apiRouter.use("/admin/orders", adminOrderRouter);
apiRouter.use("/admin", adminDashboardRouter);
apiRouter.use("/admin/discounts", adminDiscountRouter);
apiRouter.use("/shop/products", shopProductsRouter);
apiRouter.use("/shop/cart", shopCartRouter);
apiRouter.use("/shop/address", shopAddressRouter);
apiRouter.use("/shop/order", shopOrderRouter);
apiRouter.use("/shop/review", shopReviewRouter);
apiRouter.use("/shop/contact", shopContactRouter);
apiRouter.use("/common/feature", commonFeatureRouter);
apiRouter.use("/payment", khaltiRouter);

app.use("/api", apiRouter);

app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`Registered route: ${middleware.route.path} [${Object.keys(middleware.route.methods).join(', ')}]`);
  } else if (middleware.name === 'router' && middleware.handle.stack) {
    middleware.handle.stack.forEach((handler) => {
      if (handler.route) {
        console.log(`Registered route: ${handler.route.path} [${Object.keys(handler.route.methods).join(', ')}]`);
      }
    });
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message, err.stack);
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
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});