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
    next();
  } catch (error) {
    res.json({ isError: true, msg: error });
  }
};

router.post("/employee", loginController.loginEmployee);
router.post(
  "/employeeCheck",
  isAuthenticatedEmployee,
  loginController.checkIfLoggedIn,
);

module.exports = router;
