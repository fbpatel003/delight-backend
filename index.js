const express = require("express")
const cors = require('cors')
require('dotenv').config()
const session = require("express-session")

const app = express()

app.use(express.json())
app.use(cors({
    //origin:["http://localhost:3000"],
    origin: 'http://localhost:3000', // Frontend origin
    methods:["GET","POST"],
    credentials:true
}))
app.use(session({
    secret: process.env.SECRET_KEY, // Change this to a secure random string
    resave: false,
    saveUninitialized: false,
    cookie:{
        maxAge:1000*60*60
    }
  }));

const loginRouter = require('./routes/login.js')
app.use("/api/login", loginRouter)

const employeeRouter = require('./routes/employee.js')
app.use('/api/employee', employeeRouter);

const companysettingRouter = require('./routes/companysetting.js')
app.use('/api/companySetting', companysettingRouter);

const customerRouter = require('./routes/customer.js')
app.use('/api/customer',customerRouter);

app.listen(process.env.PORT, () => console.log("Server is running on port 15047"))