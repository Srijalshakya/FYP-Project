const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

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

    if (paymentMethod === "COD" || paymentMethod === "cod") {
      try {
        const newOrder = new Order({
          userId,
          cartId,
          cartItems,
          addressInfo: shippingAddress,
          orderStatus: orderStatus || "pending",
          paymentMethod: "COD",
          paymentStatus: paymentStatus || "pending",
          totalAmount: totalAmount,
          taxPrice: taxPrice || 0,
          shippingPrice: shippingPrice || 0,
          orderDate: new Date(),
          orderUpdateDate: new Date(),
          isPaid: false,
        });

        const savedOrder = await newOrder.save();
        console.log("COD order created successfully:", savedOrder._id);
        
        try {
          for (let item of cartItems) {
            let product = await Product.findById(item.productId);
            if (!product) {
              console.log(`Product not found: ${item.productId}`);
              continue;
            }
            
            if (product.totalStock < item.quantity) {
              console.log(`Insufficient stock for product: ${product.title}`);
            }
            
            product.totalStock -= item.quantity;
            await product.save();
          }
        } catch (inventoryError) {
          console.error("Error updating inventory:", inventoryError);
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
    } else if (paymentMethod === "paypal") {
      const create_payment_json = {
        intent: "sale",
        payer: {
          payment_method: "paypal",
        },
        redirect_urls: {
          return_url: "http://localhost:5173/shop/paypal-return",
          cancel_url: "http://localhost:5173/shop/paypal-cancel",
        },
        transactions: [
          {
            item_list: {
              items: cartItems.map((item) => ({
                name: item.title,
                sku: item.productId,
                price: (item.price).toFixed(2),
                currency: "USD",
                quantity: item.quantity,
              })),
            },
            amount: {
              currency: "USD",
              total: totalAmount.toFixed(2),
            },
            description: "Purchase from our store",
          },
        ],
      };

      paypal.payment.create(create_payment_json, async (error, paymentInfo) => {
        if (error) {
          console.log("PayPal payment creation error:", error);
          return res.status(500).json({
            success: false,
            message: "Error while creating paypal payment",
            error: error.message
          });
        } else {
          try {
            const newlyCreatedOrder = new Order({
              userId,
              cartId,
              cartItems,
              addressInfo: shippingAddress,
              orderStatus: orderStatus || "processing",
              paymentMethod,
              paymentStatus: paymentStatus || "pending",
              totalAmount: totalAmount,
              taxPrice: taxPrice || 0,
              shippingPrice: shippingPrice || 0,
              orderDate: new Date(),
              orderUpdateDate: new Date(),
            });

            await newlyCreatedOrder.save();

            const approvalURL = paymentInfo.links.find(
              (link) => link.rel === "approval_url"
            ).href;

            return res.status(201).json({
              success: true,
              approvalURL,
              orderId: newlyCreatedOrder._id,
            });
          } catch (saveError) {
            console.error("Failed to save PayPal order:", saveError);
            return res.status(500).json({
              success: false,
              message: "Failed to save order after PayPal payment creation",
              error: saveError.message
            });
          }
        }
      });
    } else if (paymentMethod === "khalti") {
      return res.status(400).json({
        success: false,
        message: "Khalti payment method is not implemented yet"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Payment method '${paymentMethod}' is not supported`
      });
    }
  } catch (e) {
    console.error("Order creation error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to process order",
      error: e.message
    });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { paymentId, payerId, orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    let order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order cannot be found",
      });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;
    order.orderUpdateDate = new Date();
    order.isPaid = true;

    for (let item of order.cartItems) {
      let product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.totalStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.title}`,
        });
      }

      product.totalStock -= item.quantity;
      await product.save();
    }

    if (order.cartId) {
      await Cart.findByIdAndDelete(order.cartId);
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmed",
      data: order,
    });
  } catch (e) {
    console.error("Payment capture error:", e);
    res.status(500).json({
      success: false,
      message: "Failed to capture payment",
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

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (e) {
    console.error("Get orders error:", e);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (e) {
    console.error("Get order details error:", e);
    res.status(500).json({
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

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
  cancelOrder,
};