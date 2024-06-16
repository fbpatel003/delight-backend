const postgre = require("../database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginController = {
  loginEmployee: async (req, res) => {
    try {
      const userId = req.body.userName;
      const password = req.body.password;

      const sql =
        `
        SELECT 
            e."RefEmployeeId",
            e."Name",
            e."EmployeeLoginId",
            e."Password",
            e."RefEmployeeTypeId",
            ty."Name" AS "EmployeeTypeName",
            ty."Code" AS "EmployeeType"
        FROM dbo."RefEmployee" e 
        INNER JOIN dbo."RefEmployeeType" ty ON ty."RefEmployeeTypeId" = e."RefEmployeeTypeId"	
        WHERE e."EmployeeLoginId" = '` +
        userId +
        `'`;
      const { rows } = await postgre.query(sql);

      if (rows == null || rows.length == 0) {
        res.json({ isError: true, msg: "User " + userId + " Not Found!" });
        return;
      }

      var employee = rows[0];

      bcrypt.compare(password, employee.Password, async (error, response) => {
        if (error) {
          console.log(error);
          throw error.message;
        }

        if (!error && response) {
          const permissionSql = `
            SELECT
            en."RefEnumValueId",
            en."EnumTypeName",
            en."EnumValueName",
            en."Code"
            FROM dbo."SecEntityPermision" pe
            INNER JOIN dbo."RefEnumValue" en ON en."RefEnumValueId" = pe."PermissionRefEnumValueId"
            WHERE pe."EntityTypeCode" = 'E' AND pe."EntityId" = ${employee.RefEmployeeId}`;
          const permissions = await postgre.query(permissionSql);

          employee.Password = "";
          employee.permissions = permissions.rows;

          const token = jwt.sign(employee, process.env["JWT_SECRET"], {
            expiresIn: "24h",
          });

          res.json({
            isError: false,
            data: { employee, token },
            msg: "Logged In Successfully.",
          });
        } else {
          res.json({
            isError: true,
            msg: "Invalid Password !",
          });
        }
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  checkIfLoggedIn: async (req, res) => {
    try {
      res.json({
        isError: false,
        data: req.session.employee,
        msg: "Logged In Successfully.",
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  loginCustomer: async (req, res) => {
    try {
      const userId = req.body.userName;
      const password = req.body.password;

      if (
        !userId ||
        userId.trim() == "" ||
        !password ||
        password.trim() == ""
      ) {
        res.json({ isError: true, msg: "Please enter Username and Password" });
        return;
      }

      const sql = `
      SELECT
      "RefCRMCustomerId",
      "Name",
      "Password"
      FROM dbo."RefCRMCustomer"
      WHERE "IsActive" = true AND "CustomerLoginId" = '${userId}'`;
      const { rows } = await postgre.query(sql);

      if (rows == null || rows.length == 0) {
        res.json({ isError: true, msg: "User " + userId + " Not Found!" });
        return;
      }

      var customer = rows[0];

      bcrypt.compare(password, customer.Password, async (error, response) => {
        if (error) {
          console.log(error);
          throw error.message;
        }

        if (!error && response) {
          const permissionSql = `
          SELECT
          en."RefEnumValueId",
          en."EnumTypeName",
          en."EnumValueName",
          en."Code"
          FROM dbo."SecEntityPermision" pe
          INNER JOIN dbo."RefEnumValue" en ON en."RefEnumValueId" = pe."PermissionRefEnumValueId"
          WHERE pe."EntityTypeCode" = 'C' AND pe."EntityId" = ${customer.RefCRMCustomerId};`;
          const permissions = await postgre.query(permissionSql);

          customer.Password = "";
          customer.permissions = permissions.rows;

          const token = jwt.sign(customer, process.env["JWT_SECRET"], {
            expiresIn: "24h",
          });

          res.json({
            isError: false,
            data: { customer, token },
            msg: "Logged In Successfully.",
          });
        } else {
          res.json({
            isError: true,
            msg: "Invalid Password !",
          });
        }
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  checkIfCustomerLoggedIn: async (req, res) => {
    try {
      res.json({
        isError: false,
        data: req.session.customer,
        msg: "Logged In Successfully.",
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = loginController;
