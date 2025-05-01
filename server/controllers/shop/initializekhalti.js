const express = require("express");
const router = express.Router();
const { initializeKhaltiPayment, verifyKhaltiPayment } = require("./khalti");
const Payment = require("../models/paymentmodel");
const PurchasedItem = require("../models/purchaseitemmodel");
const productModel = require("../models/Product");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const sendOrderStatusEmail = require("../utils/sendOrderStatusEmail");

router.post("/initialize-khalti", async (req, res) => {
  try {
    const { items, website_url, return_url, cancel_url, shippingAddress, orderId } = req.body;
    const websiteURL = website_url || "http://localhost:5000";

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Invalid items data" });
    }
    if (!return_url || !cancel_url) {
      return res.status(400).json({ success: false, message: "return_url and cancel_url are required" });
    }
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid or missing orderId" });
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    const purchasedItems = await Promise.all(
      items.map(async (item) => {
        const productData = await productModel.findById(item.itemId);
        if (!productData) {
          throw new Error(`Product not found for ID: ${item.itemId}`);
        }
        return {
          productId: item.itemId,
          name: productData.title,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        };
      })
    );

    const purchasedItemData = await PurchasedItem.create({
      orderId: new mongoose.Types.ObjectId(orderId),
      items: purchasedItems,
      totalPrice: totalAmount * 100,
      paymentMethod: "khalti",
      status: "pending",
      shippingAddress,
    });

    const payment = await initializeKhaltiPayment({
      amount: totalAmount * 100,
      purchase_order_id: purchasedItemData._id.toString(),
      purchase_order_name: `Order ${purchasedItemData._id.toString()}`,
      return_url: return_url,
      website_url: websiteURL,
    });

    return res.json({
      success: true,
      payment_url: payment.payment_url,
      purchase: purchasedItemData,
    });
  } catch (error) {
    console.error("Khalti Init Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/verify-khalti-payment", async (req, res) => {
  try {
    const { pidx, orderId } = req.body;

    if (!pidx || !orderId) {
      return res.status(400).json({
        success: false,
        message: "pidx and orderId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid orderId format",
      });
    }

    const paymentInfo = await verifyKhaltiPayment(pidx);

    if (paymentInfo?.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        paymentInfo,
      });
    }

    const purchasedItemData = await PurchasedItem.findOne({
      _id: new mongoose.Types.ObjectId(paymentInfo.purchase_order_id),
      orderId: new mongoose.Types.ObjectId(orderId),
    });

    if (!purchasedItemData) {
      return res.status(400).json({
        success: false,
        message: "Purchased item data not found",
      });
    }

    await PurchasedItem.findByIdAndUpdate(paymentInfo.purchase_order_id, {
      $set: { status: "completed" },
    });

    const order = await Order.findById(orderId).populate("userId", "userName email");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.paymentStatus = "completed";
    order.isPaid = true;
    order.orderStatus = "confirmed";
    order.orderUpdateDate = new Date();
    await order.save();

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);
      if (product) {
        product.totalStock -= item.quantity;
        await product.save();
      }
    }

    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    const paymentData = await Payment.create({
      pidx,
      transactionId: paymentInfo.transaction_id,
      productId: paymentInfo.purchase_order_id,
      amount: paymentInfo.total_amount,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: { pidx, orderId },
      paymentGateway: "khalti",
      status: "success",
    });

    // Send "Payment Successful" email
    if (order.userId && order.userId.email) {
      const emailSent = await sendOrderStatusEmail({
        email: order.userId.email,
        userName: order.userId.userName,
        orderId: order._id,
        orderStatus: "Payment Successful",
        equipment: order.cartItems?.[0]?.title || "Your Equipment",
        triggeredBy: "customer",
      });
      if (!emailSent) {
        console.warn(`Failed to send payment successful email to ${order.userId.email} for order ${order._id}`);
      }
    }

    return res.json({
      success: true,
      message: "Payment verified and order updated successfully",
      paymentData,
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during verification",
      error: error.message,
    });
  }
});

module.exports = router;