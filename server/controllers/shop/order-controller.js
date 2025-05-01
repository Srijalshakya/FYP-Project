const mongoose = require("mongoose");
const Order = require("../../models/Order");
const User = require("../../models/User");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const axios = require("axios");
const sendOrderStatusEmail = require("../../utils/sendOrderStatusEmail");

// Conversion rate: 1 USD = 135 NPR
const NPR_TO_USD_RATE = 135;

// Helper function to convert NPR to USD and round to 2 decimal places
const convertNprToUsd = (priceInNpr) => {
  return Number((priceInNpr / NPR_TO_USD_RATE).toFixed(2));
};

// Helper function to convert paisa to NPR
const convertPaisaToNpr = (priceInPaisa) => {
  return Number((priceInPaisa / 100).toFixed(2));
};

// Helper function to convert NPR to paisa (for Khalti)
const convertNprToPaisa = (priceInNpr) => {
  return Number((priceInNpr * 100).toFixed(0));
};

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
      isPaid,
      user
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

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log(`Invalid userId format: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    const userDoc = await User.findById(userId);
    if (!userDoc) {
      console.log(`User not found for userId: ${userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Calculate totals from request body (in paisa for Khalti, otherwise in USD)
    let totalAmountInPaisa = totalPrice || itemsPrice || cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let totalAmountInNpr = paymentMethod.toLowerCase() === "khalti" ? convertPaisaToNpr(totalAmountInPaisa) : totalAmountInPaisa;
    let adjustedTotalAmount = paymentMethod.toLowerCase() === "khalti" ? convertNprToUsd(totalAmountInNpr) : totalAmountInNpr; // Store in USD

    // Adjust cartItems prices to match totalAmountInNpr proportionally
    let adjustedCartItems = cartItems.map(item => {
      let itemPriceInNpr;
      if (paymentMethod.toLowerCase() === "khalti") {
        // For Khalti, item.price is in paisa; convert to NPR
        itemPriceInNpr = convertPaisaToNpr(item.price);
        console.log(`Cart item ${item.title}: price in paisa = ${item.price}, NPR = ${itemPriceInNpr}`);
      } else {
        itemPriceInNpr = item.price; // For COD, assume price is already in USD
      }

      // Adjust item price to match totalAmountInNpr proportionally based on quantity
      const totalQuantity = cartItems.reduce((sum, i) => sum + i.quantity, 0);
      const expectedItemPriceInNpr = (item.quantity / totalQuantity) * totalAmountInNpr;
      if (Math.abs(itemPriceInNpr - expectedItemPriceInNpr) > 0.01) {
        console.log(`Adjusting item price for ${item.title}: expected NPR ${expectedItemPriceInNpr}, found NPR ${itemPriceInNpr}`);
        itemPriceInNpr = expectedItemPriceInNpr;
      }

      const itemPriceInUsd = convertNprToUsd(itemPriceInNpr);
      console.log(`Cart item ${item.title}: adjusted price in USD = ${itemPriceInUsd}`);
      return {
        ...item,
        price: itemPriceInUsd, // Store in USD
      };
    });

    let adjustedTaxPrice = taxPrice ? (paymentMethod.toLowerCase() === "khalti" ? convertNprToUsd(convertPaisaToNpr(taxPrice)) : taxPrice) : 0;
    let adjustedShippingPrice = shippingPrice ? (paymentMethod.toLowerCase() === "khalti" ? convertNprToUsd(convertPaisaToNpr(shippingPrice)) : shippingPrice) : 0;

    const newOrder = new Order({
      userId: new mongoose.Types.ObjectId(userId),
      cartId,
      cartItems: adjustedCartItems,
      addressInfo: shippingAddress,
      orderStatus: orderStatus || "pending",
      paymentMethod: paymentMethod.toLowerCase(),
      paymentStatus: paymentStatus || "pending",
      totalAmount: adjustedTotalAmount, // Stored in USD
      taxPrice: adjustedTaxPrice,
      shippingPrice: adjustedShippingPrice,
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

        if (userDoc.email) {
          const emailSent = await sendOrderStatusEmail({
            email: userDoc.email,
            userName: userDoc.userName,
            orderId: savedOrder._id,
            orderStatus: savedOrder.orderStatus,
            equipment: savedOrder.cartItems?.[0]?.title || "Your Equipment",
            triggeredBy: "customer",
          });
          if (!emailSent) {
            console.warn(`Failed to send order placement email to ${userDoc.email} for order ${savedOrder._id}`);
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
        // Prepare items for Khalti in paisa
        const khaltiItems = cartItems.map((item) => {
          const itemPriceInPaisa = convertNprToPaisa(convertPaisaToNpr(item.price));
          console.log(`Khalti item ${item.title}: price in paisa = ${itemPriceInPaisa}`);
          return {
            itemId: item.productId,
            quantity: item.quantity,
            unitPrice: itemPriceInPaisa, // Send to Khalti in paisa
          };
        });

        // Send the total amount to Khalti in paisa
        const khaltiAmountInPaisa = convertNprToPaisa(totalAmountInNpr);
        console.log(`Khalti total amount: ${totalAmountInNpr} NPR -> ${khaltiAmountInPaisa} paisa`);

        const khaltiPayload = {
          items: khaltiItems,
          amount: khaltiAmountInPaisa, // Send in paisa to Khalti
          website_url: "http://localhost:5173",
          return_url: "http://localhost:5173/shop/payment-success",
          cancel_url: "http://localhost:5173/shop/payment-cancel",
          shippingAddress: {
            name: user?.userName || "FitMart Customer",
            email: user?.email || "customer@fitmart.com",
            phone: shippingAddress.phone || "9800000000",
            address: shippingAddress.address,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
          },
          orderId: savedOrder._id.toString(),
        };
        console.log("Khalti payload:", JSON.stringify(khaltiPayload, null, 2));

        const khaltiResponse = await axios.post(
          "http://localhost:5000/api/payment/initialize-khalti",
          khaltiPayload
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
        console.error("Khalti payment initialization error:", error.message);
        console.error("Khalti response (if available):", error.response?.data);
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

// Rest of the file remains unchanged
const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const orders = await Order.find({ userId }).populate("userId", "userName email").sort({ orderDate: -1 });

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

    const order = await Order.findById(id).populate("userId", "userName email");

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
    const order = await Order.findById(id).populate("userId", "userName email");

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

    if (order.userId && order.userId.email) {
      const emailSent = await sendOrderStatusEmail({
        email: order.userId.email,
        userName: order.userId.userName,
        orderId: order._id,
        orderStatus: "cancelled",
        equipment: order.cartItems?.[0]?.title || "Your Equipment",
        triggeredBy: "customer",
      });
      if (!emailSent) {
        console.warn(`Failed to send cancellation email to ${order.userId.email} for order ${order._id}`);
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

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: "Order status is required",
      });
    }

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "rejected",
      "confirmed",
      "inProcess",
      "inShipping"
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const order = await Order.findById(id).populate("userId", "userName email");

    if (!order) {
      return res.status(400).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update status of a cancelled order",
      });
    }

    order.orderStatus = orderStatus;
    order.orderUpdateDate = new Date();
    await order.save();

    if (order.userId && order.userId.email) {
      const emailSent = await sendOrderStatusEmail({
        email: order.userId.email,
        userName: order.userId.userName,
        orderId: order._id,
        orderStatus,
        equipment: order.cartItems?.[0]?.title || "Your Equipment",
        triggeredBy: "admin",
      });
      if (!emailSent) {
        console.warn(`Failed to send status update email to ${order.userId.email} for order ${order._id}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (e) {
    console.error("Update order status error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: e.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  cancelOrder,
  updateOrderStatus,
};