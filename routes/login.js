const express = require("express")
const router = express.Router()

const loginController = require('../controllers/login_session_controller.js')

const isAuthenticatedEmployee = (req, res, next) => {
    if (req.session.employee) {
      next(); // User is authenticated
    } else {
      res.json({isError: true, msg: "Employee is Unauthorized"})
    }
  };

router.post("/employee", loginController.loginEmployee)
router.post("/employeeCheck", isAuthenticatedEmployee, loginController.checkIfLoggedIn)
router.post('/signout', isAuthenticatedEmployee, loginController.signOutEmployee)


module.exports = router