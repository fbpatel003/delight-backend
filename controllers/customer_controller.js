const postgre = require("../database");
const bcrypt = require("bcrypt");

const saltRounds = 11;

const customerController = {
  addNewCustomer: async (req, res) => {
    try {
      const employee = req.session.employee;
      const RefEmployeeId = employee.RefEmployeeId;
      const name = req.body.name;
      const defaultProfile = req.body.defaultProfile;
      const mobileNumber = req.body.mobileNumber;
      const email = req.body.email;
      const loginId = req.body.loginId.trim();
      const password = req.body.password;
      const confirmPassword = req.body.confirmPassword;
      const permissionCodes = req.body.permissionCodes;

      const permissionToAddCustomer = employee.permissions.some(
        (obj) => obj.hasOwnProperty("Code") && obj.Code === "CanAddNewCustomer",
      );

      if (!permissionToAddCustomer)
        throw "User is Unauthorized to add Customer";

      if (name == null || name.trim() == "") throw "Name can not be empty!";

      if (password != confirmPassword)
        throw "Passwords does not match with Confirm Password!";

      if (password == null || password.trim() == "")
        throw "Password can not be empty!";

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."RefCRMCustomer" WHERE "CustomerLoginId" = '${loginId}'`;

      const { rows: row2 } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (row2 != null && row2.length > 0) {
        res.json({
          isError: true,
          msg: "Customer with login id " + loginId + " already exists!",
        });
        return;
      }

      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.log(err);
          throw err.toString();
        } else {
          const sql = `
            SELECT dbo.refcrmcustomer_insert(
              ${RefEmployeeId}, 
              '${permissionCodes}', 
              '${defaultProfile}', 
              '${name}', 
              '${mobileNumber}', 
              '${email}', 
              '${loginId}', 
              '${hash}'
            )
              `;
          const { rows } = await postgre.query(sql);

          if (rows == null || rows.length == 0) {
            res.json({
              isError: true,
              msg: "Something went wrong! could not added Customer",
            });
            return;
          } else {
            res.json({
              isError: false,
              msg: `Customer Added Successfully, Please Refresh Deploy Link for ${name} to coninue.`,
            });
            return;
          }
        }
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getCustomerMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;

      const permissionToAddCustomer = employee.permissions.some(
        (obj) => obj.hasOwnProperty("Code") && obj.Code === "CanAddNewCustomer",
      );

      var customerPermission = [];

      if (permissionToAddCustomer) {
        const sql1 = `
          SELECT
          *
          FROM dbo."RefEnumValue"
          WHERE "EnumTypeName" IN ('Customer Permission Type');
        `;
        const allPermissions = await postgre.query(sql1);

        customerPermission = [...allPermissions.rows];
      }

      const permissionToSeeAndUpdateCustomer = employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") &&
          obj.Code === "CanSeeAndUpdateExistingCustomer",
      );
      var customerMasterData = [];

      if (permissionToSeeAndUpdateCustomer) {
        const sql2 = `
        SELECT 
        cu."RefCRMCustomerId", 
        cu."Name", 
        cu."IsActive", 
        acc."CurrentBalance",
        emp."Name" AS AddedByRefEmployee, 
        cu."AddedOn", 
        lastEmp."Name" AS LastEditedByRefEmployee, 
        cu."LastEditedOn"
        FROM dbo."RefCRMCustomer" cu
        INNER JOIN dbo."RefEmployee" emp ON emp."RefEmployeeId" = cu."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" lastEmp ON lastEmp."RefEmployeeId" = cu."LastEditedByRefEmployeeId"
        INNER JOIN dbo."RefEntityAccount" acc ON acc."EntityId" = cu."RefCRMCustomerId"
        INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = acc."EntityTypeRefEnumValueId"
        WHERE enu."Code" = 'Customer'
        ORDER BY cu."RefCRMCustomerId"
      `;

        customerMasterData = await postgre.query(sql2);
      }

      const sqlprofile = `
      SELECT DISTINCT
      "Name"
      FROM dbo."RefComissionProfile"
      `;
      const profileNames = await postgre.query(sqlprofile);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          employee,
          customerPermission,
          profileNames: profileNames.rows,
          customerMasterData: customerMasterData.rows,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getCustomerDetailsById: async (req, res) => {
    try {
      const RefCRMCustomerId = req.body.RefCRMCustomerId;

      const permissionToEditCustomer = req.session.employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") &&
          obj.Code === "CanSeeAndUpdateExistingCustomer",
      );

      if (!permissionToEditCustomer)
        throw "User is Unauthorized to edit Customer";

      const sqlEmployee = `
        SELECT "RefCRMCustomerId", 
        "Name", 
        "MobileNumber", 
        "Email", 
        "CustomerLoginId", 
        "DefaultComissionProfileName", 
        "IsActive"
        FROM dbo."RefCRMCustomer"
        WHERE "RefCRMCustomerId" = ${RefCRMCustomerId}
        ;
      `;
      const { rows: row } = await postgre.query(sqlEmployee);

      if (row == null && row.length == 0) {
        throw "Invalid Customer Id!";
      }

      const sqlPermission = `
      SELECT
      v.*
      FROM dbo."SecEntityPermision" s
      INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = s."PermissionRefEnumValueId"
      WHERE s."EntityTypeCode" = 'C' AND s."EntityId" = ${RefCRMCustomerId}
      `;

      const { rows: row2 } = await postgre.query(sqlPermission);

      res.json({
        isError: false,
        msg: "Data Loaded.",
        data: { customerData: row, premissions: row2 },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  updateCustomerDetails: async (req, res) => {
    try {
      const UserRefEmployeeId = req.session.employee.RefEmployeeId;
      const RefCRMCustomerId = req.body.RefCRMCustomerId;
      const name = req.body.name;
      const mobileNumber = req.body.mobileNumber;
      const email = req.body.email;
      const loginId = req.body.loginId.trim();
      const permissionCodes = req.body.permissionCodes;
      const defaultProfile = req.body.defaultProfile;
      const IsActive = req.body.IsActive;

      const permissionToEditCustomer = req.session.employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") &&
          obj.Code === "CanSeeAndUpdateExistingCustomer",
      );

      if (!permissionToEditCustomer)
        throw "User is Unauthorized to edit Customer";

      if (name == null || name.trim() == "") throw "Name can not be empty!";

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."RefCRMCustomer" WHERE "CustomerLoginId" = '${loginId} AND "RefCRMCustomerId" <> ${RefCRMCustomerId}'`;
      const { rows: rows } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (rows != null && rows.length > 0) {
        res.json({
          isError: true,
          msg: "Customer with login id " + loginId + " already exists!",
        });
        return;
      }

      const sqlToUpdate = `
      SELECT dbo.refcrmcustomer_update(
        ${UserRefEmployeeId}, 
        '${permissionCodes}', 
        '${defaultProfile}',
        '${name}', 
        '${mobileNumber}', 
        '${email}', 
        '${loginId}',
        ${IsActive},
        ${RefCRMCustomerId}
      );
      `;
      const { rows: rows4 } = await postgre.query(sqlToUpdate);

      if (rows4 != null && rows4.length > 0)
        res.json({
          isError: false,
          msg: "Customer Details Updated Successfully.",
        });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = customerController;
