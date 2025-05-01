const express = require("express");
const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  cancelOrder,
  updateOrderStatus, // Import the new function
} = require("../../controllers/shop/order-controller");

const router = express.Router();

router.post("/create", createOrder);
router.get("/list/:userId", getAllOrdersByUser);
router.get("/details/:id", getOrderDetails);
router.put("/cancel/:id", cancelOrder);
router.put("/status/:id", updateOrderStatus); // New route for updating order status

module.exports = router;