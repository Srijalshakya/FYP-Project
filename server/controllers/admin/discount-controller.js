const Discount = require("../../models/Discount");

// Add a new discount
const addDiscount = async (req, res) => {
  try {
    const { categories, percentage, description, startDate, endDate } = req.body;

    // Validate input
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one category is required",
      });
    }
    if (!percentage || percentage <= 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        message: "Discount percentage must be between 1 and 100",
      });
    }
    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Discount description is required",
      });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const newDiscount = new Discount({
      categories,
      percentage,
      description,
      startDate,
      endDate,
    });

    await newDiscount.save();
    res.status(201).json({
      success: true,
      data: newDiscount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while adding discount",
    });
  }
};

// Fetch all discounts
const fetchAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find({});
    res.status(200).json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching discounts",
    });
  }
};

// Edit a discount
const editDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { categories, percentage, description, startDate, endDate } = req.body;

    const discount = await Discount.findById(id);
    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount not found",
      });
    }

    discount.categories = categories || discount.categories;
    discount.percentage = percentage || discount.percentage;
    discount.description = description || discount.description;
    discount.startDate = startDate || discount.startDate;
    discount.endDate = endDate || discount.endDate;

    await discount.save();
    res.status(200).json({
      success: true,
      data: discount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while editing discount",
    });
  }
};

// Delete a discount
const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const discount = await Discount.findByIdAndDelete(id);

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: "Discount not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Discount deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while deleting discount",
    });
  }
};

// Fetch active discounts (for frontend display)
const fetchActiveDiscounts = async (req, res) => {
  try {
    const currentDate = new Date();
    const activeDiscounts = await Discount.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    });

    res.status(200).json({
      success: true,
      data: activeDiscounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching active discounts",
    });
  }
};

module.exports = {
  addDiscount,
  fetchAllDiscounts,
  editDiscount,
  deleteDiscount,
  fetchActiveDiscounts,
};