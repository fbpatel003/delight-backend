const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const GeneratePdfController = require("../controllers/generate_pdf_controller.js");

const isAuthenticatedEmployee = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ isError: true, msg: "Token not found!" });

  try {
    const decoded = jwt.verify(token, process.env["JWT_SECRET"]);
    req.session = { employee: decoded };
    if (
      req.session.employee &&
      (req.session.employee.EmployeeType == "Admin" ||
        req.session.employee.EmployeeType == "ManagingEmployee") &&
      req.session.employee.RefEmployeeId &&
      req.session.employee.permissions
    )
      next();
    else throw new Error("Invalid Token!");
  } catch (error) {
    res.json({ isError: true, msg: error.message });
  }
};

const isAuthenticatedCustomer = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ isError: true, msg: "Token not found!" });

  try {
    const decoded = jwt.verify(token, process.env["JWT_SECRET"]);
    req.session = { customer: decoded };

    if (
      req.session.customer &&
      req.session.customer.RefCRMCustomerId &&
      req.session.customer.permissions
    )
      next();
    else throw new Error("Invalid Token!");
  } catch (error) {
    res.json({ isError: true, msg: error.message });
  }
};

router.post(
  "/getCustomerTransactionsPdf",
  isAuthenticatedCustomer,
  GeneratePdfController.getCustomerTransactionsPdf,
);
router.post(
  "/getLedgerTransactionsPdf",
  isAuthenticatedEmployee,
  GeneratePdfController.getLedgerTransactionsPdf,
);

module.exports = router;
