const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const axios = require("axios");

const createOrder = async (req, res) => {
  try {
    console.log("Order creation request received:", JSON.stringify(req.body, null, 2));
    
    const {
      userId,
      cartId,
      cartItems,
      shippingAddress,
      paymentMethod,
      paymentStatus,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      orderStatus,
      isPaid
    } = req.body;

    const missingFields = [];
    if (!userId) missingFields.push("userId");
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) missingFields.push("cartItems");
    if (!shippingAddress) missingFields.push("shippingAddress");
    if (!paymentMethod) missingFields.push("paymentMethod");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    const totalAmount = totalPrice || itemsPrice || calculatedTotal;

    const newOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo: shippingAddress,
      orderStatus: orderStatus || "pending",
      paymentMethod: paymentMethod.toLowerCase(),
      paymentStatus: paymentStatus || "pending",
      totalAmount: totalAmount,
      taxPrice: taxPrice || 0,
      shippingPrice: shippingPrice || 0,
      orderDate: new Date(),
      orderUpdateDate: new Date(),
      isPaid: isPaid || false,
    });

    const savedOrder = await newOrder.save();
    console.log(`${paymentMethod} order created successfully:`, savedOrder._id);

    if (paymentMethod.toLowerCase() === "cod") {
      try {
        for (let item of cartItems) {
          let product = await Product.findById(item.productId);
          if (!product) {
            console.log(`Product not found: ${item.productId}`);
            return res.status(404).json({
              success: false,
              message: `Product not found: ${item.productId}`,
            });
          }
          
          if (product.totalStock < item.quantity) {
            console.log(`Insufficient stock for product: ${product.title}`);
            return res.status(400).json({
              success: false,
              message: `Insufficient stock for product: ${product.title}`,
            });
          }
          
          product.totalStock -= item.quantity;
          await product.save();
        }

        if (cartId) {
          try {
            await Cart.findByIdAndDelete(cartId);
          } catch (cartError) {
            console.error("Error deleting cart:", cartError);
          }
        }

        return res.status(201).json({
          success: true,
          message: "Order created successfully",
          order: savedOrder,
          orderId: savedOrder._id
        });
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        return res.status(500).json({
          success: false,
          message: "Failed to create order in database",
          error: dbError.message
        });
      }
    } else if (paymentMethod.toLowerCase() === "khalti") {
      try {
        const khaltiItems = cartItems.map((item) => ({
          itemId: item.productId,
          quantity: item.quantity,
        }));

        const khaltiResponse = await axios.post(
          "http://localhost:5000/api/payment/initialize-khalti",
          {
            items: khaltiItems,
            website_url: "http://localhost:5173",
            return_url: "http://localhost:5173/shop/payment-success",
            cancel_url: "http://localhost:5173/shop/payment-cancel",
            shippingAddress: {
              name: req.body.user?.userName || "FitMart Customer",
              email: req.body.user?.email || "customer@fitmart.com",
              phone: shippingAddress.phone || "9800000000",
              address: shippingAddress.address,
              city: shippingAddress.city,
              postalCode: shippingAddress.postalCode,
            },
          }
        );

        if (khaltiResponse.data.success) {
          return res.status(201).json({
            success: true,
            payment_url: khaltiResponse.data.payment_url,
            orderId: savedOrder._id,
          });
        } else {
          throw new Error(khaltiResponse.data.message || "Failed to initialize Khalti payment");
        }
      } catch (error) {
        console.error("Khalti payment initialization error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to initialize Khalti payment",
          error: error.message,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: `Payment method '${paymentMethod}' is not supported`,
      });
    }
  } catch (e) {
    console.error("Order creation error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to process order",
      error: e.message
    });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const orders = await Order.find({ userId }).sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found",
      });
    }

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.error("Get orders error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: e.message
    });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.error("Get order details error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve order details",
      error: e.message
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    order.orderStatus = "cancelled";
    order.orderUpdateDate = new Date();
    await order.save();

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);
      if (product) {
        product.totalStock += item.quantity;
        await product.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (e) {
    console.error("Cancel order error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: e.message
    });
  }
};

module.exports = {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  cancelOrder,
};