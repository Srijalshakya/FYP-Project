const express = require("express");
const router = express.Router();
const { initializeKhaltiPayment, verifyKhaltiPayment } = require("./khalti");
const Payment = require("../../models/paymentmodel");
const PurchasedItem = require("../../models/purchaseitemmodel");
const productModel = require("../../models/Product");
const mongoose = require("mongoose");


// ✅ Route to initialize Khalti payment
router.post("/initialize-khalti", async (req, res) => {
  try {
    const { items, website_url, shippingAddress } = req.body;
    const websiteURL = website_url || "http://localhost:5000";

    // Validate items array
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ success: false, message: "Invalid items data" });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    // Create purchased items
    const purchasedItems = await Promise.all(items.map(async (item) => {
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
    }));

    const purchasedItemData = await PurchasedItem.create({
      items: purchasedItems,
      totalPrice: totalAmount * 100, // Khalti requires paisa
      paymentMethod: "khalti",
      status: "Completed",
      shippingAddress // Add shipping address to the purchase
    });

    const payment = await initializeKhaltiPayment({
      amount: totalAmount * 100,
      purchase_order_id: purchasedItemData._id.toString(),
      purchase_order_name: `Order ${purchasedItemData._id.toString()}`, // Or use first product name
      return_url: `${process.env.BACKEND_URI}/api/payment/complete-khalti-payment`,
      website_url: websiteURL,
    });

    return res.json({
      success: true,
      payment_url: payment.payment_url, // Make sure this matches Khalti's response
      purchase: purchasedItemData,
    });
  } catch (error) {
    console.error("Khalti Init Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Route to verify Khalti payment
router.get("/complete-khalti-payment", async (req, res) => {
  const {
    pidx,
    txnId,
    amount,
    mobile,
    purchase_order_id,
    purchase_order_name,
    transaction_id,
  } = req.query;

  try {
    const paymentInfo = await verifyKhaltiPayment(pidx);

    if (
      paymentInfo?.status !== "Completed" ||
      paymentInfo.transaction_id !== transaction_id ||
      Number(paymentInfo.total_amount) !== Number(amount)
    ) {
      return res.status(400).json({
        success: false,
        message: "Incomplete or mismatched payment information",
        paymentInfo,
      });
    }

    const purchasedItemData = await PurchasedItem.findOne({
      _id: new mongoose.Types.ObjectId(purchase_order_id),
      totalPrice: Number(amount),
    });

    if (!purchasedItemData) {
      return res.status(400).json({
        success: false,
        message: "Purchased item data not found",
      });
    }

    await PurchasedItem.findByIdAndUpdate(purchase_order_id, {
      $set: { status: "completed" },
    });

    const paymentData = await Payment.create({
      pidx,
      transactionId: transaction_id,
      productId: purchase_order_id,
      amount,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "khalti",
      status: "success",
    });

    res.json({
      success: true,
      message: "Payment Successful",
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
