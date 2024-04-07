const postgre = require("../database");
const bcrypt = require("bcrypt");

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
        WHERE e."EmployeeLoginId" = '` + userId + `'`;
      const { rows } = await postgre.query(sql);

      if (rows == null || rows.length == 0) {
        res.json({ isError: true, msg: "User " +userId+ " Not Found!" });
        return;
      }

      var employee = rows[0];

      bcrypt.compare(password, employee.Password, async (error, response) => {
        if(error){
            console.log(error);
            throw error.message;
        }
        if (!error) {
            const permissionSql =
            `
            SELECT
            en."RefEnumValueId",
            en."EnumTypeName",
            en."EnumValueName",
            en."Code"
            FROM dbo."SecEntityPermision" pe
            INNER JOIN dbo."RefEnumValue" en ON en."RefEnumValueId" = pe."PermissionRefEnumValueId"
            WHERE pe."EntityTypeCode" = 'E' AND pe."EntityId" = ${employee.RefEmployeeId}`;
            const permissions = await postgre.query(permissionSql);

            employee.Password = '';
            employee.permissions = permissions.rows;
            req.session.employee = employee;
    
            res.json({
              isError: false,
              data: { employee },
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
  signOutEmployee: async (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        res.status(500).json({ isError: true, msg: "Failed to sign out" });
      } else {
        res.status(200).json({ isError: false, msg: "Signed Out..." });
      }
    });
  },
};

module.exports = loginController;
