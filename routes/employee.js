const express = require("express")
const router = express.Router()

const employeeController = require('../controllers/employee_controller.js')

const isAuthenticatedEmployee = (req, res, next) => {
    if (req.session.employee) {
      next(); // User is authenticated
    } else {
      res.json({isError: true, msg: "Employee is Unauthorized"})
    }
  };

router.post("/addNewEmployee", isAuthenticatedEmployee, employeeController.addNewEmployee);
router.post("/getEmployeeMasterData", isAuthenticatedEmployee, employeeController.getEmployeeMasterData);

module.exports = router