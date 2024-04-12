const express = require("express")
const router = express.Router()

const companySettingController = require('../controllers/companysetting_controller.js')

const isAuthenticatedEmployee = (req, res, next) => {
    if (req.session.employee && req.session.employee.EmployeeType == "Admin") {
      next(); // User is authenticated
    } else {
      res.json({isError: true, msg: "Employee is Unauthorized"})
    }
  };

router.post("/addCOmissionProfile", isAuthenticatedEmployee, companySettingController.addNewComissionProfile);

module.exports = router