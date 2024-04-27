const postgre = require("../database");
const bcrypt = require("bcrypt");

const saltRounds = 11;

const BankAndAgentController = {
  addNewBankOrAgent: async (req, res) => {
    try {
      const employee = req.session.employee;
      const RefEmployeeId = employee.RefEmployeeId;
      const name = req.body.name;
      const type = req.body.type;

      if(type !== "Bank" && type !== "Agent")
        throw `Invalid Type ${type}`;

      const permissionToAddBankOrAgent = employee.EmployeeType == "Admin";

      if (!permissionToAddBankOrAgent)
        throw `User is Unauthorized to add ${type}`;

      if (name == null || name.trim() == '')
        throw 'Name can not be empty!'

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."Ref${type}" WHERE "Name" = '${name}'`

      const { rows: row2 } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (row2 != null && row2.length > 0)
        throw `${type} with Name ${name} already exists!`;

      const sqltoAdd =
      `
      INSERT INTO dbo."Ref${type}"(
        "Name", 
        "IsActive", 
        "AddedByRefEmployeeId", 
        "AddedOn", 
        "LastEditedByRefEmployeeId", 
        "LastEditedOn"
        )
        VALUES (
        '${name}',
        true,
        ${RefEmployeeId},
        now(),
        ${RefEmployeeId},
        now()
        );

      
      `

      res.json({ isError: false, msg: `${type} : ${name} Added Successfully.` });
      return;

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getCustomerMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;

      const permissionToAddCustomer = employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanAddNewCustomer");

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

      const permissionToSeeAndUpdateCustomer = employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanSeeAndUpdateExistingCustomer");
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
        INNER JOIN dbo."RefEntityAccount" acc ON acc."EntityId" = emp."RefEmployeeId"
        INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = acc."EntityTypeRefEnumValueId"
        WHERE enu."Code" = 'Customer'
        ORDER BY cu."RefCRMCustomerId"
      `;

        customerMasterData = await postgre.query(sql2);
      }

      const sqlprofile =
        `
      SELECT DISTINCT
      "Name"
      FROM dbo."RefComissionProfile"
      `
      const profileNames = await postgre.query(sqlprofile);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          employee,
          customerPermission,
          profileNames: profileNames.rows,
          customerMasterData: customerMasterData.rows
        }
      })

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

      const permissionToEditCustomer = req.session.employee.permissions.some(obj => obj.hasOwnProperty('Code') && obj.Code === "CanSeeAndUpdateExistingCustomer");

      if (!permissionToEditCustomer)
        throw 'User is Unauthorized to edit Customer';

      if (name == null || name.trim() == '')
        throw 'Name can not be empty!'

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."RefCRMCustomer" WHERE "CustomerLoginId" = '${loginId} AND "RefCRMCustomerId" <> ${RefCRMCustomerId}'`
      const { rows: rows } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (rows != null && rows.length > 0) {
        res.json({ isError: true, msg: "Customer with login id " + loginId + " already exists!" });
        return;
      }

      const sqlToUpdate =
        `
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
      `
      const { rows: rows4 } = await postgre.query(sqlToUpdate);

      if (rows4 != null && rows4.length > 0)
        res.json({ isError: false, msg: 'Customer Details Updated Successfully.' });

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = BankAndAgentController;