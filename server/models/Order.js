const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: "Cart", required: true },
  cartItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      title: String,
      image: String,
      price: Number,
      quantity: Number,
    },
  ],
  shippingAddress: {
    address: String,
    city: String,
    postalCode: String,
    country: String,
    phone: String,
  },
  paymentProof: { type: String, required: true }, // Cloudinary Image URL
  itemsPrice: Number,
  shippingPrice: Number,
  taxPrice: Number,
  totalPrice: Number,
  paymentStatus: { type: String, default: "pending" },
  orderStatus: { type: String, default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
