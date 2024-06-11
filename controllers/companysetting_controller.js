const postgre = require("../database");
const bcrypt = require("bcrypt");
const saltRounds = 11;
const https = require("https");

const companySettingController = {
  getAllCompanySettings: async (req, res) => {
    try {
      const sql = `
        SELECT
        f.*,
        e."Name" AS AddedByEmployeeName
        FROM dbo."RefComissionProfile" f
        INNER JOIN dbo."RefEmployee" e ON e."RefEmployeeId" = f."AddedByRefEmployeeId"   
        ORDER BY f."Name", f."OrderById"     
        `;

      const { rows } = await postgre.query(sql);

      res.json({
        isError: false,
        data: { comissionProfiles: rows },
        msg: "Data Loaded Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  addNewComissionProfile: async (req, res) => {
    try {
      const employee = req.session.employee;
      const profileName = req.body.profileName.trim();
      const comissionProfileValues = req.body.comissionProfileValues;

      if (!profileName || profileName == null || profileName.trim() == "")
        throw "Profile Name cannot be Empty!";

      if (!comissionProfileValues || comissionProfileValues == null)
        throw "Invalid data passed!";

      const sqlDuplicateName = `
      SELECT
      *
      FROM dbo."RefComissionProfile"
      WHERE "Name" = '${profileName}'
      `;

      const { rows: dup } = await postgre.query(sqlDuplicateName);

      if (dup && dup.length > 0) {
        throw `Profile with Name ${profileName} already exists!`;
      }

      //#region validation
      comissionProfileValues.sort((a, b) => a.OrderById - b.OrderById);
      var lastValue = 0;

      for (var i = 0; i < comissionProfileValues.length; i++) {
        const current = comissionProfileValues[i];

        if (i === 0) {
          if (current.FromValue !== 0) {
            throw "From Value of the first line should be 0!";
          }
        } else if (i === comissionProfileValues.length - 1) {
          if (current.ToValue !== 100000000) {
            throw "To Value of the last line should be Ten Cr (100000000)!";
          }
        } else {
          if (current.FromValue !== lastValue + 1) {
            throw "Invalid data passed!";
          }
        }

        if (current.InPercent !== 0 && current.InRupees !== 0) {
          throw "Invalid data passed!";
        }

        lastValue = current.ToValue;
      }

      //#endregion

      var sql = `
        INSERT INTO dbo."RefComissionProfile"(
          "Name", 
          "FromValue", 
          "ToValue", 
          "InPercent", 
          "InRupees", 
          "AddedOn", 
          "AddedByRefEmployeeId",
          "OrderById"
          )
          VALUES           
        `;

      for (var i = 0; i < comissionProfileValues.length; i++) {
        const current = comissionProfileValues[i];

        sql += `('${profileName}',${current.FromValue},${current.ToValue},${current.InPercent},${current.InRupees},now(),${employee.RefEmployeeId},${current.OrderById})`;

        if (i != comissionProfileValues.length - 1) sql += ",";
      }

      await postgre.query(sql);

      res.json({
        isError: false,
        msg: "New Comission Profile Added Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDynamicPagesCustomerIds: async (req, res) => {
    try {
      const sqlToGetCustomerIds = `
      SELECT
      cast("RefCRMCustomerId" as varchar) AS customerid
      FROM dbo."RefCRMCustomer"
      `;

      const { rows } = await postgre.query(sqlToGetCustomerIds);

      res.json({
        isError: false,
        data: rows,
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDynamicPagesEmployeeIds: async (req, res) => {
    try {
      const sqlToGetCustomerIds = `
      SELECT
      cast("RefEmployeeId" as varchar) AS employeeid
      FROM dbo."RefEmployee"
      `;

      const { rows } = await postgre.query(sqlToGetCustomerIds);

      res.json({
        isError: false,
        data: rows,
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDynamicPagesDeliveryEmployeeIds: async (req, res) => {
    try {
      const sqlToGetCustomerIds = `
      SELECT
      cast(e."RefEmployeeId" as varchar) AS employeeid
      FROM dbo."RefEmployee" e
      INNER JOIN dbo."RefEmployeeType" et ON et."RefEmployeeTypeId" = e."RefEmployeeTypeId"
      WHERE et."Code" = 'DeliveryEmployee'
      `;

      const { rows } = await postgre.query(sqlToGetCustomerIds);

      res.json({
        isError: false,
        data: rows,
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDynamicPagesManagingAndAdminEmployeeIds: async (req, res) => {
    try {
      const sqlToGetCustomerIds = `
      SELECT
      cast(e."RefEmployeeId" as varchar) AS employeeid
      FROM dbo."RefEmployee" e
      INNER JOIN dbo."RefEmployeeType" et ON et."RefEmployeeTypeId" = e."RefEmployeeTypeId"
      WHERE et."Code" = 'ManagingEmployee' OR et."Code" = 'Admin'
      `;

      const { rows } = await postgre.query(sqlToGetCustomerIds);

      res.json({
        isError: false,
        data: rows,
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDynamicPagesAdminEmployeeIds: async (req, res) => {
    try {
      const sqlToGetCustomerIds = `
      SELECT
      cast(e."RefEmployeeId" as varchar) AS employeeid
      FROM dbo."RefEmployee" e
      INNER JOIN dbo."RefEmployeeType" et ON et."RefEmployeeTypeId" = e."RefEmployeeTypeId"
      WHERE et."Code" = 'Admin'
      `;

      const { rows } = await postgre.query(sqlToGetCustomerIds);

      res.json({
        isError: false,
        data: rows,
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getBasicDetails: async (req, res) => {
    try {
      const type = req.body.type;

      if (type != "customer" && type != "employee")
        throw "Invalid type passed!";

      if (type == "customer") {
        const sqlToGetCustomerDetails = `
            SELECT
            "RefCRMCustomerId" AS "Id",
            "Name"
            FROM dbo."RefCRMCustomer"
      `;

        const { rows } = await postgre.query(sqlToGetCustomerDetails);

        res.json({
          isError: false,
          msg: "data loaded successfully",
          data: { details: rows },
        });
        return;
      } else {
        const sqlToGetEmployeeDetails = `
          SELECT
          "RefEmployeeId" AS "Id",
          e."Name"
          FROM dbo."RefEmployee" e
          INNER JOIN dbo."RefEmployeeType" et ON et."RefEmployeeTypeId" = e."RefEmployeeTypeId"
          WHERE et."Code" <> 'Admin'
          `;

        const { rows } = await postgre.query(sqlToGetEmployeeDetails);

        res.json({
          isError: false,
          msg: "data loaded successfully",
          data: { details: rows },
        });
        return;
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  updatePassword: async (req, res) => {
    try {
      const type = req.body.type;
      const password = req.body.password;
      const passwordConfirm = req.body.confirmPassword;
      const Id = req.body.Id;

      if (type != "customer" && type != "employee")
        throw "Invalid type passed!";

      if (typeof Id != "number" || Id == 0) throw "Invalid Id passed!";

      if (!password || typeof password != "string" || password.trim() == "")
        throw "Password cannot be empty!";

      if (password !== passwordConfirm) throw "Passwords do not match!";

      if (type == "customer") {
        const sqlToCheckIfCustomerExists = `
          SELECT * FROM dbo."RefCRMCustomer" WHERE "RefCRMCustomerId" = ${Id}
          `;
        const { rows: check } = await postgre.query(sqlToCheckIfCustomerExists);
        if (check.length == 0) throw "Customer does not exist!";

        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.log(err);
            throw err.toString();
          } else {
            const sqlToUpdatePassword = `
            UPDATE dbo."RefCRMCustomer" SET "Password" = '${hash}' WHERE "RefCRMCustomerId" = ${Id}
            `;
            await postgre.query(sqlToUpdatePassword);

            res.json({
              isError: false,
              msg: `Password updated successfully!`,
            });
            return;
          }
        });
      } else {
        const sqlToCheckIfEmployeeExists = `
          SELECT * FROM dbo."RefEmployee" WHERE "RefEmployeeId" = ${Id}
          `;
        const { rows: check } = await postgre.query(sqlToCheckIfEmployeeExists);
        if (check.length == 0) throw "Employee does not exist!";

        bcrypt.hash(password, saltRounds, async (err, hash) => {
          if (err) {
            console.log(err);
            throw err.toString();
          } else {
            const sqlToUpdatePassword = `
            UPDATE dbo."RefEmployee" SET "Password" = '${hash}' WHERE "RefEmployeeId" = ${Id}
            `;
            await postgre.query(sqlToUpdatePassword);

            res.json({
              isError: false,
              msg: `Password updated successfully!`,
            });
            return;
          }
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  redeployFrontend: async (req,res)=>{
    try {
      https.get('https://api.render.com/deploy/srv-cp43bev79t8c73e9r9e0?key=GmIiVlk6GDw', (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received.
        resp.on('end', () => {
            console.log('Response data:', JSON.parse(data));
        });

      }).on('error', (error) => {
        console.error('Error making GET request:', error);
        throw error.toString();
      });

      res.json({ isError: false, msg: 'Deployment started. your website will be redeployed in few minutes.' });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  }
};

module.exports = companySettingController;
