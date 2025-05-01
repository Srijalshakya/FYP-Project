const Order = require("../../models/Order");
const User = require("../../models/User");

const getAllOrdersOfAllUsers = async (req, res) => {
  try {
    const { page = 1, filter = "all" } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (filter === "recent") {
      query.orderDate = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    } else if (filter === "old") {
      query.orderDate = { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
    }

    const orders = await Order.find(query)
      .populate("userId", "userName email")
      .skip(skip)
      .limit(limit)
      .sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({
        success: false,
        message: "No orders found!",
      });
    }

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const getOrderDetailsForAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate("userId", "userName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    const order = await Order.findById(id).populate("userId", "userName email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    order.orderStatus = orderStatus;
    order.orderUpdateDate = new Date();

    // If orderStatus is "delivered", set isPaid to true
    if (orderStatus === "delivered") {
      order.isPaid = true;
      order.paymentStatus = "completed";
    }

    await order.save();

    // Send email notification
    if (order.userId && order.userId.email) {
      const sendOrderStatusEmail = require("../../utils/sendOrderStatusEmail");
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
    } else {
      console.log("Skipping email notification: userId or email not found for order", order._id);
    }

    res.status(200).json({
      success: true,
      message: "Order status is updated successfully!",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occurred!",
    });
  }
};

module.exports = {
  getAllOrdersOfAllUsers,
  getOrderDetailsForAdmin,
  updateOrderStatus,
};