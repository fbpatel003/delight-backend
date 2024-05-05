const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const employeeController = require("../controllers/employee_controller.js");

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
  "/addNewEmployee",
  isAuthenticatedEmployee,
  employeeController.addNewEmployee,
);
router.post(
  "/getEmployeeMasterData",
  isAuthenticatedEmployee,
  employeeController.getEmployeeMasterData,
);
router.post(
  "/getEmployeeDetailsById",
  isAuthenticatedEmployee,
  employeeController.getEmployeeDetailsById,
);
router.post(
  "/updateEmployeeDetails",
  isAuthenticatedEmployee,
  employeeController.updateEmployeeDetails,
);

module.exports = router;
