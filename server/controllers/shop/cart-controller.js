const mongoose = require('mongoose'); // Add mongoose import for ObjectId validation
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Discount = require("../../models/Discount");

const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    // Validate ObjectId format for userId and productId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productId format",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Fetch active discounts
    const currentDate = new Date();
    const activeDiscounts = await Discount.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Apply discount if……

    const applicableDiscounts = activeDiscounts
      .filter((discount) => discount.categories.includes(product.category))
      .sort((a, b) => b.percentage - a.percentage);

    const discount = applicableDiscounts[0];
    let originalPrice = product.price;
    let discountedPrice = null;
    let discountPercentage = null;

    if (discount) {
      discountedPrice = product.price * (1 - discount.percentage / 100);
      discountedPrice = Number(discountedPrice.toFixed(2));
      discountPercentage = discount.percentage;
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (findCurrentProductIndex === -1) {
      cart.items.push({
        productId,
        quantity,
        originalPrice,
        discountedPrice,
        discountPercentage,
      });
    } else {
      cart.items[findCurrentProductIndex].quantity += quantity;
      cart.items[findCurrentProductIndex].originalPrice = originalPrice;
      cart.items[findCurrentProductIndex].discountedPrice = discountedPrice;
      cart.items[findCurrentProductIndex].discountPercentage = discountPercentage;
    }

    await cart.save();
    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("Error in addToCart:", error.message, error.stack); // Improved error logging
    res.status(500).json({
      success: false,
      message: "Error adding item to cart",
      error: error.message, // Include error message in response for debugging
    });
  }
};

const fetchCartItems = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User id is mandatory!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice category",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    const validItems = cart.items.filter(
      (productItem) => productItem.productId
    );

    if (validItems.length < cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Recalculate discounts for each item
    const currentDate = new Date();
    const activeDiscounts = await Discount.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const populateCartItems = validItems.map((item) => {
      const applicableDiscounts = activeDiscounts
        .filter((discount) => discount.categories.includes(item.productId.category))
        .sort((a, b) => b.percentage - a.percentage);

      const discount = applicableDiscounts[0];
      let originalPrice = item.productId.price;
      let discountedPrice = item.discountedPrice;
      let discountPercentage = item.discountPercentage;

      if (discount) {
        discountedPrice = item.productId.price * (1 - discount.percentage / 100);
        discountedPrice = Number(discountedPrice.toFixed(2));
        discountPercentage = discount.percentage;
      } else {
        discountedPrice = null;
        discountPercentage = null;
      }

      return {
        productId: item.productId._id,
        image: item.productId.image,
        title: item.productId.title,
        price: item.productId.price,
        salePrice: item.productId.salePrice,
        quantity: item.quantity,
        originalPrice,
        discountedPrice,
        discountPercentage,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const updateCartItemQty = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    const findCurrentProductIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (findCurrentProductIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Cart item not present!",
      });
    }

    const product = await Product.findById(productId);

    // Recalculate discount
    const currentDate = new Date();
    const activeDiscounts = await Discount.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    const applicableDiscounts = activeDiscounts
      .filter((discount) => discount.categories.includes(product.category))
      .sort((a, b) => b.percentage - a.percentage);

    const discount = applicableDiscounts[0];
    let originalPrice = product.price;
    let discountedPrice = null;
    let discountPercentage = null;

    if (discount) {
      discountedPrice = product.price * (1 - discount.percentage / 100);
      discountedPrice = Number(discountedPrice.toFixed(2));
      discountPercentage = discount.percentage;
    }

    cart.items[findCurrentProductIndex].quantity = quantity;
    cart.items[findCurrentProductIndex].originalPrice = originalPrice;
    cart.items[findCurrentProductIndex].discountedPrice = discountedPrice;
    cart.items[findCurrentProductIndex].discountPercentage = discountPercentage;

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId ? item.productId._id : null,
      image: item.productId ? item.productId.image : null,
      title: item.productId ? item.productId.title : "Product not found",
      price: item.productId ? item.productId.price : null,
      salePrice: item.productId ? item.productId.salePrice : null,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      discountedPrice: item.discountedPrice,
      discountPercentage: item.discountPercentage,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const deleteCartItem = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found!",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.productId._id.toString() !== productId
    );

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "image title price salePrice",
    });

    const populateCartItems = cart.items.map((item) => ({
      productId: item.productId ? item.productId._id : null,
      image: item.productId ? item.productId.image : null,
      title: item.productId ? item.productId.title : "Product not found",
      price: item.productId ? item.productId.price : null,
      salePrice: item.productId ? item.productId.salePrice : null,
      quantity: item.quantity,
      originalPrice: item.originalPrice,
      discountedPrice: item.discountedPrice,
      discountPercentage: item.discountPercentage,
    }));

    res.status(200).json({
      success: true,
      data: {
        ...cart._doc,
        items: populateCartItems,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = {
  addToCart,
  updateCartItemQty,
  deleteCartItem,
  fetchCartItems,
};