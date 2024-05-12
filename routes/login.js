const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const loginController = require("../controllers/login_session_controller.js");

const isAuthenticatedEmployee = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.json({ isError: true, msg: "Token not found!" });

  try {
    const decoded = jwt.verify(token, process.env["JWT_SECRET"]);
    req.session = { employee: decoded };
    if (
      req.session.employee &&
      (req.session.employee.EmployeeType == "Admin" ||
        req.session.employee.EmployeeType == "ManagingEmployee" ||
        req.session.employee.EmployeeType == "DeliveryEmployee") &&
      req.session.employee.RefEmployeeId &&
      req.session.employee.permissions
    )
      next();
    else throw new Error("Invalid Token!");
  } catch (error) {
    res.json({ isError: true, msg: error.message });
  }
};

router.post("/employee", loginController.loginEmployee);
router.post(
  "/employeeCheck",
  isAuthenticatedEmployee,
  loginController.checkIfLoggedIn,
);

module.exports = router;
