const express = require("express")
const app = express()

require('dotenv').config()

app.use(express.json())

const loginRouter = require('./routes/login.js')

app.use("/api/login", loginRouter)

app.listen(process.env.PORT, () => console.log("Server is running on port 15047"))