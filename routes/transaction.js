const express = require("express")
const router = express.Router()

const TransactionController = require('../controllers/transaction_controller.js')

const isAuthenticatedEmployee = (req, res, next) => {
    if (req.session.employee) {
      next(); // User is authenticated
    } else {
      res.json({isError: true, msg: "Employee is Unauthorized"})
    }
  };

router.post("/getTransactionMasterData", isAuthenticatedEmployee, TransactionController.getTransactionMasterData);

module.exports = router