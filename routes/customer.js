const express = require("express")
const router = express.Router()

const customerController = require('../controllers/customer_controller.js')

const isAuthenticatedEmployee = (req, res, next) => {
    if (req.session.employee) {
      next(); // User is authenticated
    } else {
      res.json({isError: true, msg: "Employee is Unauthorized"})
    }
  };

router.post("/getCustomerMasterData", isAuthenticatedEmployee, customerController.getCustomerMasterData);

module.exports = router