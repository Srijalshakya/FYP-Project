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


// Verify environment variables are being read
console.log('MongoDB URI:', process.env.MONGO_URI);
console.log('Cloudinary Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log("MongoDB connection error: ", error));

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5173', 'https://your-production-domain.com'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

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

app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
  });
});