const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
  },
  cartItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      image: {
        type: String,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    },
  ],
  addressInfo: {
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "Nepal",
    },
    phone: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ["COD", "paypal", "khalti", "card"],
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentId: {
    type: String,
  },
  payerId: {
    type: String,
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled", "rejected", "confirmed", "inProcess", "inShipping"],
    default: "pending",
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  taxPrice: {
    type: Number,
    default: 0.0,
  },
  shippingPrice: {
    type: Number,
    default: 0.0,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  orderUpdateDate: {
    type: Date,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;