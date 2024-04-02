const express = require("express")
const router = express.Router()

const loginController = require('../controllers/login_session_controller.js')

router.post("/employee", loginController.loginEmployee)
// router.get("/a", loginController.getById)
// router.post("/cre", loginController.create)
// router.put("/b", loginController.updateById)
// router.delete("/c", loginController.deleteById)

module.exports = router