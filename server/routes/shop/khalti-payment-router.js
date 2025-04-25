const express = require("express");
const axios = require("axios");
const Order = require("../../models/Order");

const router = express.Router();

router.post("/initialize-khalti", async (req, res) => {
  try {
    const { items, website_url, return_url, cancel_url, shippingAddress } = req.body;

    const khaltiResponse = await axios.post(
      process.env.KHALTI_GATEWAY_URL + "/api/v2/epayment/initiate/",
      {
        return_url: return_url || "http://localhost:5173/shop/khalti-return",
        cancel_url: cancel_url || "http://localhost:5173/shop/payment-cancel",
        website_url: website_url || "http://localhost:5173",
        amount: items.reduce((sum, item) => sum + item.quantity * 1000, 0) * 100, // Convert to paisa
        purchase_order_id: items[0].itemId,
        purchase_order_name: "Order Payment",
        customer_info: {
          name: shippingAddress.name || "FitMart Customer",
          email: shippingAddress.email || "customer@fitmart.com",
          phone: shippingAddress.phone || "9800000000",
        },
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Khalti initialization response:", khaltiResponse.data);

    if (khaltiResponse.data.pidx) {
      return res.status(200).json({
        success: true,
        payment_url: khaltiResponse.data.payment_url,
        pidx: khaltiResponse.data.pidx,
      });
    } else {
      throw new Error("Failed to initialize Khalti payment");
    }
  } catch (error) {
    console.error("Khalti initialization error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize Khalti payment",
      error: error.message,
    });
  }
});

router.get("/complete-khalti-payment", async (req, res) => {
  try {
    const { pidx, txnId, amount, purchase_order_id, transaction_id, status } = req.query;

    console.log("Processing Khalti payment verification for pidx:", pidx, "with query params:", req.query);

    // Check if the payment was explicitly canceled
    if (status === "User canceled" || status === "failed") {
      console.log("Payment canceled by user or failed.");
      const order = await Order.findById(purchase_order_id);
      if (order) {
        order.paymentStatus = "failed";
        order.orderUpdateDate = new Date();
        await order.save();
        console.log("Order updated after cancellation:", order);
      }
      return res.redirect(`/shop/payment-cancel?orderId=${purchase_order_id}&status=failed&reason=user_canceled`);
    }

    const lookupResponse = await axios.post(
      process.env.KHALTI_GATEWAY_URL + "/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Khalti lookup response for pidx", pidx, ":", lookupResponse.data);

    const order = await Order.findById(purchase_order_id);
    if (!order) {
      console.log("Order not found for purchase_order_id:", purchase_order_id);
      return res.redirect(`/shop/payment-cancel?orderId=${purchase_order_id}&status=failed&reason=order_not_found`);
    }

    if (lookupResponse.data.status === "Completed") {
      order.paymentStatus = "completed";
      order.isPaid = true;
      order.orderStatus = "confirmed";
      order.orderUpdateDate = new Date();
      await order.save();

      console.log("Order updated after successful payment:", order);

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

      return res.redirect(`/shop/payment-success?orderId=${purchase_order_id}`);
    } else if (["Canceled", "Failed", "Initiated", "Refunded"].includes(lookupResponse.data.status)) {
      console.log("Payment explicitly canceled or failed. Status:", lookupResponse.data.status);
      order.paymentStatus = "failed";
      order.orderUpdateDate = new Date();
      await order.save();
      console.log("Order updated after failed payment:", order);
      return res.redirect(`/shop/payment-cancel?orderId=${purchase_order_id}&status=failed&reason=payment_${lookupResponse.data.status.toLowerCase()}`);
    } else {
      console.log("Unexpected Khalti status:", lookupResponse.data.status);
      order.paymentStatus = "failed";
      order.orderUpdateDate = new Date();
      await order.save();
      console.log("Order updated after unexpected status:", order);
      return res.redirect(`/shop/payment-cancel?orderId=${purchase_order_id}&status=failed&reason=unexpected_status_${lookupResponse.data.status.toLowerCase()}`);
    }
  } catch (error) {
    console.error("Khalti verification error:", error.response?.data || error.message);
    return res.redirect(`/shop/payment-cancel?orderId=${purchase_order_id}&status=failed&reason=verification_failed`);
  }
});

module.exports = router;