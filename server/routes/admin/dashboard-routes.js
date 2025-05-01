const express = require("express");
const router = express.Router();
const { getDashboardMetrics } = require("../../controllers/admin/dashboard-controller");

router.get("/dashboard-metrics", getDashboardMetrics);

module.exports = router;