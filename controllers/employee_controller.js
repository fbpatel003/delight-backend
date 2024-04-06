const postgre = require("../database");
const bcrypt = require("bcrypt");

const saltRounds = 11;

const employeeController = {
  addNewEmployee: async (req, res) => {
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

      // bcrypt.hash(password, saltRounds, async (err, hash)=>{
      //     if(err){
      //         console.log(err);
      //     } else {
      //         console.log(hash);
      //     }
      // });
      var employee = rows[0];

      bcrypt.compare(password, employee.Password, async (error, response) => {
        if (error) {
          console.log(error);
          throw error.message;
        }
        if (!error) {
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
};

module.exports = employeeController;
