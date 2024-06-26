const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(
    cors({
        // origin: [
        //     // "https://stccjj-3000.csb.app/",
        //     // "https://stccjj-3000.csb.app",
        //     "http://192.168.123.27:3000",
        //     // "http://192.168.123.27",
        // ], // Frontend origin
        methods: ["GET", "POST"],
    }),
);

app.get("/", (req, res) => {
    res.send(
        '<body style="padding:10px; background-color:rgb(36, 36, 36); color:rgb(204, 255, 234);"><h1>Dynamic Enterprise API v1.0.0</h6><h4>Created By FB</h6><p style="color:white">bcrypt: v5.1.1<br/>cors: v2.8.5<br/>dotenv: v16.4.5<br/>exceljs: v4.4.0<br/>express: v4.19.2<br/>jsonwebtoken: v9.0.2<br/>pdfkit: v0.15.0<br/>pg: v8.11.4<br/>puppeteer: v22.10.0<br/></p></body>',
    );
});

const loginRouter = require("./routes/login.js");
app.use("/api/login", loginRouter);

const employeeRouter = require("./routes/employee.js");
app.use("/api/employee", employeeRouter);

const companysettingRouter = require("./routes/companysetting.js");
app.use("/api/companySetting", companysettingRouter);

const customerRouter = require("./routes/customer.js");
app.use("/api/customer", customerRouter);

const bankAgentRouter = require("./routes/bankandagent.js");
app.use("/api/bankagent", bankAgentRouter);

const transactionRouter = require("./routes/transaction.js");
app.use("/api/transaction", transactionRouter);

const generateExcelRouter = require("./routes/generateExcel.js");
app.use("/api/generate", generateExcelRouter);

const ledgerRouter = require("./routes/ledger.js");
app.use("/api/ledger", ledgerRouter);

const customerTransactionsChangeLogRouter = require("./routes/customertransactionchangelog.js");
app.use("/api/changelog", customerTransactionsChangeLogRouter);

const generatePdfRouter = require("./routes/generatePdf.js");
app.use("/api/generatePdf", generatePdfRouter);

const privateAccountRouter = require("./routes/privateaccount.js");
app.use("/api/privateaccount", privateAccountRouter);

app.listen(15047, () => console.log("Server is running on port 15047"));
