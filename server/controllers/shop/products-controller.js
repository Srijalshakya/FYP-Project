const Product = require("../../models/Product");
const Discount = require("../../models/Discount");

const getFilteredProducts = async (req, res) => {
  try {
    const { category = [], brand = [], sortBy = "price-lowtohigh", search = "" } = req.query;

    let filters = {};

    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    if (brand.length) {
      filters.brand = { $in: brand.split(",") };
    }

    if (search) {
      filters.title = { $regex: search, $options: "i" };
    }

    let sort = {};

    switch (sortBy) {
      case "price-lowtohigh":
        sort.price = 1;
        break;
      case "price-hightolow":
        sort.price = -1;
        break;
      case "title-atoz":
        sort.title = 1;
        break;
      case "title-ztoa":
        sort.title = -1;
        break;
      default:
        sort.price = 1;
        break;
    }

    const products = await Product.find(filters).sort(sort);

    // Fetch active discounts
    const currentDate = new Date();
    const activeDiscounts = await Discount.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Apply discounts to products
    const productsWithDiscounts = products.map((product) => {
      const applicableDiscounts = activeDiscounts
        .filter((discount) => discount.categories.includes(product.category))
        .sort((a, b) => b.percentage - a.percentage); // Sort by percentage (highest first)

      const discount = applicableDiscounts[0]; // Take the highest discount if multiple exist
      if (discount) {
        const discountedPrice = product.price * (1 - discount.percentage / 100);
        return {
          ...product._doc,
          originalPrice: product.price,
          discountedPrice: Number(discountedPrice.toFixed(2)),
          discountPercentage: discount.percentage,
          discountDescription: discount.description,
        };
      }
      return {
        ...product._doc,
        originalPrice: product.price,
        discountedPrice: null,
        discountPercentage: null,
        discountDescription: null,
      };
    });

    res.status(200).json({
      success: true,
      data: productsWithDiscounts,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found!",
      });
    }

    // Fetch active discounts
    const currentDate = new Date();
    const activeDiscounts = await Discount.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    // Apply discount if applicable
    const applicableDiscounts = activeDiscounts
      .filter((discount) => discount.categories.includes(product.category))
      .sort((a, b) => b.percentage - a.percentage);

    const discount = applicableDiscounts[0];
    let productData = { ...product._doc };
    if (discount) {
      const discountedPrice = product.price * (1 - discount.percentage / 100);
      productData = {
        ...product._doc,
        originalPrice: product.price,
        discountedPrice: Number(discountedPrice.toFixed(2)),
        discountPercentage: discount.percentage,
        discountDescription: discount.description,
      };
    } else {
      productData = {
        ...product._doc,
        originalPrice: product.price,
        discountedPrice: null,
        discountPercentage: null,
        discountDescription: null,
      };
    }

    res.status(200).json({
      success: true,
      data: productData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

module.exports = { getFilteredProducts, getProductDetails };