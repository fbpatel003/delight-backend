const express = require("express")
const router = express.Router()

const BankAndAgentController = require('../controllers/bank_agent_controller.js')

const isAuthenticatedEmployee = (req, res, next) => {
    if (req.session.employee) {
      next(); // User is authenticated
    } else {
      res.json({isError: true, msg: "Employee is Unauthorized"})
    }
  };

router.post("/addBankOrAgent", isAuthenticatedEmployee, BankAndAgentController.addNewBankOrAgent);
router.post("/getBankAndAgentMasterData", isAuthenticatedEmployee, BankAndAgentController.getBankAndAgentMasterData);
router.post("/updateBankOrAgentDetails", isAuthenticatedEmployee, BankAndAgentController.updateBankOrAgentDetails);

module.exports = router