const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const TransactionController = require("../controllers/transaction_controller.js");

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

const isAuthenticatedDeliveryEmployee = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ isError: true, msg: "Token not found!" });

  try {
    const decoded = jwt.verify(token, process.env["JWT_SECRET"]);
    req.session = { employee: decoded };
    if (
      req.session.employee &&
      req.session.employee.EmployeeType == "DeliveryEmployee" &&
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
  "/getTransactionMasterData",
  isAuthenticatedEmployee,
  TransactionController.getTransactionMasterData,
);
router.post(
  "/getPendingDeliveriesMasterData",
  isAuthenticatedEmployee,
  TransactionController.getPendingDeliveriesMasterData,
);
router.post(
  "/addNewTransaction",
  isAuthenticatedEmployee,
  TransactionController.addNewTransaction,
);
router.post(
  "/getTransactionDataByDate",
  isAuthenticatedEmployee,
  TransactionController.getTransactionDataByDate,
);
router.post(
  "/getDeliveryTransactionDataByDate",
  isAuthenticatedEmployee,
  TransactionController.getDeliveryTransactionDataByDate,
);
router.post(
  "/getTransactionDetailById",
  isAuthenticatedEmployee,
  TransactionController.getTransactionDetailById,
);
router.post(
  "/getPendingDeliveryTransactionData",
  isAuthenticatedDeliveryEmployee,
  TransactionController.getPendingDeliveryTransactionsByDeliveryEmployeeId,
);
router.post(
  "/getDeliveredTransactionData",
  isAuthenticatedDeliveryEmployee,
  TransactionController.getDeliveryTransactionsByDeliveryEmployeeId,
);
router.post(
  "/acceptPendingDeliveryTransactionEmployee",
  isAuthenticatedDeliveryEmployee,
  TransactionController.acceptPendingDeliveryFromDeliveryEmployee,
);
router.post(
  "/getCustomerTransactionData",
  isAuthenticatedCustomer,
  TransactionController.getCustomerTransactionData,
);
router.post(
  "/getCustomerDeliveryTransactionData",
  isAuthenticatedCustomer,
  TransactionController.getCustomerDeliveryTransactionData,
);
router.post(
  "/acceptPendingDeliveryTransactionCustomer",
  isAuthenticatedCustomer,
  TransactionController.acceptPendingDeliveryFromCustomer,
);
router.post(
  "/getDeliveryTransactionDetailById",
  isAuthenticatedEmployee,
  TransactionController.getDeliveryTransactionDetailById,
);
router.post(
  "/updateDeliveryTransaction",
  isAuthenticatedEmployee,
  TransactionController.updateDeliveryTransaction,
);
router.post(
  "/getAddTransactionData",
  isAuthenticatedEmployee,
  TransactionController.getAddTransactionData,
);
router.post(
  "/deleteDeliveryTransaction",
  isAuthenticatedEmployee,
  TransactionController.deleteDeliveryTransaction,
);
router.post(
  "/updateTransaction",
  isAuthenticatedEmployee,
  TransactionController.updateTransaction,
);

module.exports = router;
