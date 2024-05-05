const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const BankAndAgentController = require("../controllers/bank_agent_controller.js");

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
  "/addBankOrAgent",
  isAuthenticatedEmployee,
  BankAndAgentController.addNewBankOrAgent,
);
router.post(
  "/getBankAndAgentMasterData",
  isAuthenticatedEmployee,
  BankAndAgentController.getBankAndAgentMasterData,
);
router.post(
  "/updateBankOrAgentDetails",
  isAuthenticatedEmployee,
  BankAndAgentController.updateBankOrAgentDetails,
);

module.exports = router;
