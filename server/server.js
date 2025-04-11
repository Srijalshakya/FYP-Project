require('dotenv').config(); // Load environment variables
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
const khalti = require("./controllers/shop/initializekhalti");

// Verify environment variables are being read
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET');
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('Email Provider:', process.env.EMAIL_USER ? 'Set (hidden for security)' : 'NOT SET'); 

// Verify essential email variables for OTP functionality
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('WARNING: EMAIL_USER or EMAIL_PASS environment variables not set. OTP email functionality will not work!');
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log("MongoDB connection error: ", error));

const app = express();
const PORT = process.env.PORT || 5000;

// Updated allowed origins to include both ports common for React development
const allowedOrigins = [
  'http://localhost:5173',  // Vite default
  'http://localhost:3000',  // Create React App default
  'http://127.0.0.1:5173',  // Alternative Vite URL
  'https://your-production-domain.com'
];

// CORS configuration - Fixed to properly handle preflight requests
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Origin blocked by CORS:", origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // This is crucial for cookies
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

// Increase JSON payload limit for file uploads if needed
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser middleware - BEFORE routes
app.use(cookieParser());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Now set up routes
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
apiRouter.use("/payment", khalti);
app.use("/api", apiRouter);

// Add a health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV !== 'production' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));

// Graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});