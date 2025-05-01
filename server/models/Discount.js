const mongoose = require("mongoose");

const DiscountSchema = new mongoose.Schema(
  {
    categories: [{ type: String, required: true }], // Categories the discount applies to
    percentage: { type: Number, required: true, min: 0, max: 100 }, // Discount percentage
    description: { type: String, required: true }, // e.g., "Spring Sale on Strength Equipment!"
    startDate: { type: Date, required: true }, // Start date of the discount
    endDate: { type: Date, required: true }, // End date of the discount
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discount", DiscountSchema);