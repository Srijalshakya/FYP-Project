const paypal = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");

const createOrder = async (req, res) => {
  try {
    // Log the incoming request body for debugging
    console.log("Order creation request received:", JSON.stringify(req.body, null, 2));
    
    const {
      userId,
      cartId,
      cartItems,
      shippingAddress, // From frontend
      paymentMethod,
      paymentStatus,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      orderStatus,
    } = req.body;

    // Validate required fields with detailed errors
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

    // Calculate total amount if not provided
    const calculatedTotal = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );
    const totalAmount = totalPrice || itemsPrice || calculatedTotal;

    // For Cash on Delivery, create order directly
    if (paymentMethod === "cod") {
      try {
        // Create new order document
        const newOrder = new Order({
          userId,
          cartId,
          cartItems,
          addressInfo: shippingAddress, // Map frontend field to backend schema field
          orderStatus: orderStatus || "pending",
          paymentMethod,
          paymentStatus: paymentStatus || "pending",
          totalAmount: totalAmount,
          taxPrice: taxPrice || 0,
          shippingPrice: shippingPrice || 0,
          orderDate: new Date(),
          orderUpdateDate: new Date(),
        });

        const savedOrder = await newOrder.save();
        console.log("COD order created successfully:", savedOrder._id);
        
        // Optional: Update product stock
        try {
          for (let item of cartItems) {
            let product = await Product.findById(item.productId);
            if (!product) {
              console.log(`Product not found: ${item.productId}`);
              continue; // Skip this item if product not found
            }
            
            // Check if we have enough stock
            if (product.totalStock < item.quantity) {
              console.log(`Insufficient stock for product: ${product.title}`);
              // We'll continue anyway for COD orders, but log the issue
            }
            
            product.totalStock -= item.quantity;
            await product.save();
          }
        } catch (inventoryError) {
          console.error("Error updating inventory:", inventoryError);
          // We don't fail the order creation if inventory update fails
          // Just log the error and continue
        }

        // Optional: Clear cart after successful order
        if (cartId) {
          try {
            await Cart.findByIdAndDelete(cartId);
          } catch (cartError) {
            console.error("Error deleting cart:", cartError);
            // Don't fail if cart deletion fails
          }
        }

        return res.status(201).json({
          success: true,
          message: "Order created successfully",
          order: savedOrder,
          orderId: savedOrder._id // Adding orderId to match expected response format
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
      // Existing PayPal payment flow
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
              addressInfo: shippingAddress, // Map frontend field to backend schema field
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
    } else {
      // Handle other payment methods
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

    // Update product inventory
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

    // Delete the cart
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

module.exports = {
  createOrder,
  capturePayment,
  getAllOrdersByUser,
  getOrderDetails,
};