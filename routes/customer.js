const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const customerController = require("../controllers/customer_controller.js");

const isAuthenticatedEmployee = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ isError: true, msg: "Token not found!" });

  try {
    const decoded = jwt.verify(token, process.env["JWT_SECRET"]);
    req.session = { employee: decoded };
    next();
  } catch (error) {
    res.json({ isError: true, msg: error });
  }
};

router.post(
  "/getCustomerMasterData",
  isAuthenticatedEmployee,
  customerController.getCustomerMasterData,
);
router.post(
  "/addNewCustomer",
  isAuthenticatedEmployee,
  customerController.addNewCustomer,
);
router.post(
  "/getCustomerDetailsById",
  isAuthenticatedEmployee,
  customerController.getCustomerDetailsById,
);
router.post(
  "/updateCustomerDetails",
  isAuthenticatedEmployee,
  customerController.updateCustomerDetails,
);

module.exports = router;
