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
    next();
  } catch (error) {
    res.json({ isError: true, msg: error });
  }
};

router.post(
  "/getTransactionMasterData",
  isAuthenticatedEmployee,
  TransactionController.getTransactionMasterData,
);

module.exports = router;
