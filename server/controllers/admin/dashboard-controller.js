const Order = require("../../models/Order");
const User = require("../../models/User");

async function getDashboardMetrics(req, res) {
  try {
    // Log all delivered orders to debug
    const deliveredOrders = await Order.find({ orderStatus: "delivered", isPaid: true });
    console.log("Delivered Orders:", deliveredOrders);

    // Calculate total sales for delivered and paid orders
    const totalSalesResult = await Order.aggregate([
      { $match: { orderStatus: "delivered", isPaid: true } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].total : 0;

    // Count total orders and users
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    // Fetch all revenue data (no date restriction), ensuring UTC timezone handling
    const revenueResult = await Order.aggregate([
      {
        $match: {
          orderStatus: "delivered",
          isPaid: true,
        },
      },
      {
        // Adjust for timezone by converting orderDate to UTC
        $project: {
          totalAmount: 1,
          utcDate: {
            $dateToParts: {
              date: "$orderDate",
              timezone: "UTC",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            day: "$utcDate.day",
            month: "$utcDate.month",
            year: "$utcDate.year",
          },
          total: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ]);

    // Format revenue data for frontend
    const dailyRevenue = revenueResult.map((result) => ({
      day: `${result._id.day}/${result._id.month}/${result._id.year}`,
      total: result.total,
    }));

    // Debug: Log the daily revenue to verify 27 April 2025 is included
    console.log("Total Sales:", totalSales);
    console.log("Daily Revenue:", dailyRevenue);

    res.status(200).json({
      totalSales,
      totalOrders,
      totalUsers,
      dailyRevenue,
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error.message);
    res.status(500).json({ message: "Failed to fetch dashboard metrics" });
  }
}

module.exports = { getDashboardMetrics };