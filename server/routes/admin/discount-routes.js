const express = require("express");
const {
  addDiscount,
  fetchAllDiscounts,
  editDiscount,
  deleteDiscount,
  fetchActiveDiscounts,
} = require("../../controllers/admin/discount-controller");

const router = express.Router();

router.post("/add", addDiscount);
router.get("/get", fetchAllDiscounts);
router.put("/edit/:id", editDiscount);
router.delete("/delete/:id", deleteDiscount);
router.get("/active", fetchActiveDiscounts);

module.exports = router;