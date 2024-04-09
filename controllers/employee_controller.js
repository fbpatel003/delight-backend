const postgre = require("../database");
const bcrypt = require("bcrypt");

const saltRounds = 11;

const employeeController = {
  addNewEmployee: async (req, res) => {
    try {
      const RefEmployeeId = req.session.employee.RefEmployeeId;
      const employeeType = req.body.employeeType;
      const name = req.body.name;
      const mobileNumber = req.body.mobileNumber;
      const email = req.body.email;
      const loginId = req.body.loginId.trim();
      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;
      const permissionCodes = req.body.permissionCodes;

      const permissionToAddEmployee = req.session.employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanAddNewEmployee");

      if (!permissionToAddEmployee)
        throw 'User is Unauthorized to add Employee';

      if (employeeType == null || employeeType.trim() == '')
        throw 'InValid Employee Type';

      if (name == null || name.trim() == '')
        throw 'Name can not be empty!'

      if (password != confirmPassword)
        throw 'Passwords does not match with Confirm Password!'

      if (password == null || password.trim() == '')
        throw 'Password can not be empty!'

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."RefEmployee" WHERE "EmployeeLoginId" = '${loginId}'`

      const { rows: row2 } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (row2 != null && row2.length > 0) {
        res.json({ isError: true, msg: "User with login id " + loginId + " already exists!" });
        return;
      }

      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
          throw err.toString();
        } else {
          const sql =
            `
              SELECT dbo.refemployee_insert(
                ${RefEmployeeId}, 
                '${permissionCodes}', 
                '${employeeType}', 
                '${name}', 
                '${mobileNumber}', 
                '${email}', 
                '${loginId}', 
                '${hash}'
              );
              `
            ;
          const { rows } = await postgre.query(sql);

          if (rows == null || rows.length == 0) {
            res.json({ isError: true, msg: "Something went wrong! could not added Employee" });
            return;
          } else {
            res.json({ isError: false, msg: `Employee Added Successfully, Please Refresh Deploy Link for ${name} to coninue.` });
            return;
          }
        }
      });

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getEmployeeMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;

      const permissionToAddEmployee = employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanAddNewEmployee");

      const deliveryPermission = [];
      const managingPermission = [];

      if (permissionToAddEmployee) {
        const sql1 = `
          SELECT
          *
          FROM dbo."RefEnumValue"
          WHERE "EnumTypeName" IN ('Delivery Employee Permission Type','Managing Employee Permission Type');
        `;
        const allPermissions = await postgre.query(sql1);

        allPermissions.rows.forEach(element => {
          if (element.EnumTypeName == 'Delivery Employee Permission Type')
            deliveryPermission.push(element);
          else
            managingPermission.push(element);
        });
      }

      const permissionToSeeAndUpdateEmployees = employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanSeeAndUpdateExistingEmployee");
      var employeeMasterData = [];

      if (permissionToSeeAndUpdateEmployees) {
        const sql2 = `
        SELECT 
        e."RefEmployeeId", 
        e."Name", 
        e."RefEmployeeTypeId", 
        e."EmployeeLoginId", 
        ad."Name" AS AddedByRefEmployee, 
        e."AddedOn", 
        lastEd."Name" AS LastEditedByRefEmployee, 
        e."LastEditedOn", 
        e."MobileNumber", 
        e."Email",
        t."Name" AS EmployeeType
        FROM dbo."RefEmployee" e
        INNER JOIN dbo."RefEmployeeType" t ON t."RefEmployeeTypeId" = e."RefEmployeeTypeId"
        INNER JOIN dbo."RefEmployee" ad ON ad."RefEmployeeId" = e."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" lastEd ON lastEd."RefEmployeeId" = e."LastEditedByRefEmployeeId"
        WHERE t."Code" IN ('DeliveryEmployee','ManagingEmployee');
      `;

        employeeMasterData = await postgre.query(sql2);
      }

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          employee,
          deliveryPermission,
          managingPermission,
          employeeMasterData: employeeMasterData.rows
        }
      })

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getEmployeeDetailsById: async (req, res) => {
    try {
      const RefEmployeeId = req.body.RefEmployeeId;

      const permissionToEditEmployee = req.session.employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanSeeAndUpdateExistingEmployee");

      if (!permissionToEditEmployee)
        throw 'User is Unauthorized to edit Employee';

      const sqlEmployee =
        `
      SELECT
        e."Name",
        ty."Name" AS EmployeeType,
        ty."Code" AS EmployeeTypeCode,
        e."EmployeeLoginId",
        e."MobileNumber",
        e."Email"
      FROM dbo."RefEmployee" e
      INNER JOIN dbo."RefEmployeeType" ty ON ty."RefEmployeeTypeId" = e."RefEmployeeTypeId"
      WHERE e."RefEmployeeId" = ${RefEmployeeId}
      `

      const { rows: row } = await postgre.query(sqlEmployee);

      if (row == null && row.length == 0) {
        throw 'Invalid EmployeeId!';
      }

      const sqlPermission =
      `
      SELECT
      v.*
      FROM dbo."SecEntityPermision" s
      INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = s."PermissionRefEnumValueId"
      WHERE s."EntityTypeCode" = 'E' AND s."EntityId" = ${RefEmployeeId}
      `

      const { rows: row2 } = await postgre.query(sqlPermission);

      res.json({ isError: false, msg: 'Data Loaded.', data: { employeeData: row, premissions: row2 } })

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  updateEmployeeDetails: async (req, res) => {
    try {
      const UserRefEmployeeId = req.session.employee.RefEmployeeId;
      const RefEmployeeId = req.body.RefEmployeeId;
      const employeeType = req.body.employeeType;
      const name = req.body.name;
      const mobileNumber = req.body.mobileNumber;
      const email = req.body.email;
      const loginId = req.body.loginId.trim();
      const permissionCodes = req.body.permissionCodes;

      const permissionToEditEmployee = req.session.employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanSeeAndUpdateExistingEmployee");

      if (!permissionToEditEmployee)
        throw 'User is Unauthorized to edit Employee';

      if (employeeType == null || employeeType.trim() == '')
        throw 'InValid Employee Type';

      if (name == null || name.trim() == '')
        throw 'Name can not be empty!'

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."RefEmployee" WHERE "EmployeeLoginId" = '${loginId} AND "RefEmployeeId" <> ${RefEmployeeId}'`
      const { rows: rows } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (rows != null && rows.length > 0) {
        res.json({ isError: true, msg: "User with login id " + loginId + " already exists!" });
        return;
      }

      const sqlEmployeeOld = `SELECT * FROM dbo."RefEmployee" WHERE "RefEmployeeId" = ${RefEmployeeId}`;
      const { rows: rows2 } = await postgre.query(sqlEmployeeOld);

      const sqlPermission =
      `
      SELECT
      v.*
      FROM dbo."SecEntityPermision" s
      INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = s."PermissionRefEnumValueId"
      WHERE s."EntityTypeCode" = 'E' AND s."EntityId" = ${RefEmployeeId}
      `
      const { rows: rows3 } = await postgre.query(sqlPermission);

      var permissionchanged = false;
      var detailschanged = false;

      const newPermissions = permissionCodes.toString().split(',');

      if(newPermissions.length != rows3.length)
        permissionchanged = true;

      if(!permissionchanged){
        const oldPermissions = rows3.map(obj=>obj.Code);

        const sortedArr1 = oldPermissions.slice().sort();
        const sortedArr2 = newPermissions.slice().sort();

        for (let i = 0; i < sortedArr1.length; i++) {
            if (sortedArr1[i] !== sortedArr2[i]) {
                permissionchanged = true; 
                break;
            }
        }
      }

      if(!permissionchanged){
        if(name != rows2.Name || mobileNumber != rows2.MobileNumber || email != rows2.Email || loginId != rows2.EmployeeLoginId){
          detailschanged = true;
        }
      }

      if(!permissionchanged && !detailschanged)
        throw `No details Changed of Employee : ${rows2.Name}!`

      

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = employeeController;
