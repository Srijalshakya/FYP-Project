const express = require("express");
const { updateUser } = require("../controllers/user-controller");

const router = express.Router();
router.put("/update/:id", updateUser);

module.exports = router;