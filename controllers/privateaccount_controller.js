const postgre = require("../database");

const privateAccountController = {
  addTransaction: async (req, res) => {
    try {
      var { EntityTypeId, EntityId, Name, Amount, IsPaid, Notes } = req.body;
      const employeeId = req.session.employee.RefEmployeeId;

      if (!EntityTypeId || !EntityId || !Name || !Amount || !IsPaid || !Notes)
        throw new Error("Please enter all the required fields");

      var EntityTypeId = Number(EntityTypeId);
      var EntityId = Number(EntityId);
      var Amount = Number(Amount);
      var IsPaid = Boolean(IsPaid);
      var Name = Name && Name.trim() != "" ? Name.trim() : null;
      var Notes = Notes && Notes.trim() != "" ? Notes.trim() : null;

      if (
        typeof EntityTypeId != "number" ||
        typeof EntityId != "number" ||
        typeof Amount != "number" ||
        typeof IsPaid != "boolean"
      )
        throw new Error("Please enter all the required fields");

      if (EntityTypeId < 1 || EntityTypeId > 5)
        throw new Error("Invalid Entity Type");

      if (EntityTypeId == 1 && EntityId != 0)
        throw new Error("Invalid Entity Id");

      if (EntityTypeId == 2) {
        const account = await postgre.query(`
        SELECT "RefEmployeeId" FROM dbo."RefEmployee" WHERE "RefEmployeeId" = ${EntityId}
        `);

        if (account.rows.length == 0) throw new Error("Invalid Entity Id");
      }

      if (EntityTypeId == 3) {
        const account = await postgre.query(`
        SELECT "RefCRMCustomerId" FROM dbo."RefCRMCustomer" WHERE "RefCRMCustomerId" = ${EntityId}
        `);

        if (account.rows.length == 0) throw new Error("Invalid Entity Id");
      }

      if (EntityTypeId == 4) {
        const account = await postgre.query(`
        SELECT "RefAgentId" FROM dbo."RefAgent" WHERE "RefAgentId" = ${EntityId}
        `);

        if (account.rows.length == 0) throw new Error("Invalid Entity Id");
      }

      if (EntityTypeId == 5) {
        const account = await postgre.query(`
        SELECT "RefBankId" FROM dbo."RefBank" WHERE "RefBankId" = ${EntityId}
        `);

        if (account.rows.length == 0) throw new Error("Invalid Entity Id");
      }

      const lastTransaction = await postgre.query(
        `
        SELECT TOP 1
        *
        FROM dbo."CorePrivateAccountTransaction"
        ORDER BY "CorePrivateAccountTransactionId" DESC
        `,
      );

      const lastBalance = 0;
      if (lastTransaction.rows.length > 0) {
        lastBalance = lastTransaction.rows[0].UpdatedBalance;
      }

      const updatedBalance = 0;
      if (IsPaid) {
        updatedBalance = lastBalance - Amount;
      } else {
        updatedBalance = lastBalance + Amount;
      }

      const sql = `
        INSERT INTO dbo."CorePrivateAccountTransaction"(
        	"EntityType", 
        	"EntityId", 
        	"PartyName", 
        	"IsPaid", 
        	"Amount", 
        	"Notes", 
        	"UpdatedBalance", 
        	"AddedOn", 
        	"AddedByRefEmployeeId", 
        	"LastEditedOn", 
        	"LastEditedByRefEmployeeId"
        	)
        	VALUES (
        	${EntityTypeId},
          ${EntityId && EntityId > 0 ? EntityId : null},
          '${Name ? "'" + Name + "'" : null}',
          ${IsPaid},
          ${Amount},
          ${Notes ? "'" + Notes + "'" : null},
          ${updatedBalance},
          GETDATE(),
          ${employeeId},
          GETDATE(),
          ${employeeId}
        	);
        `;

      const { rows } = await postgre.query(sql);

      res.json({
        isError: false,
        data: { comissionProfiles: rows },
        msg: "Transaction Added Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getPrivateAccountMasterData: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      if (!fromDate || !toDate)
        throw new Error("Please enter all the required fields");

      const sql = `
        WITH ids AS (
      	SELECT
      	"CorePrivateAccountTransactionId"
      	FROM dbo."CorePrivateAccountTransaction"
      	WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        )
        SELECT
        tran."CorePrivateAccountTransactionId",
        tran."EntityType",
        tran."EntityId",
        tran."PartyName",
        tran."IsPaid",
        tran."Amount",
        tran."Notes",
        tran."UpdatedBalance",
        tran."AddedOn",
        tran."AddedByRefEmployeeId",
        tran."LastEditedOn",
        tran."LastEditedByRefEmployeeId"
        FROM ids idss
        INNER JOIN dbo."CorePrivateAccountTransaction" tran ON tran."CorePrivateAccountTransactionId" = idss."CorePrivateAccountTransactionId"
        ORDER BY tran."CorePrivateAccountTransactionId" DESC;
        `;

      const { rows } = await postgre.query(sql);

      const employeeDetails = await postgre.query(
        `
      SELECT
        "RefEmployeeId" AS "EntityId","Name" AS "EntityName"
      FROM dbo."RefEmployee"
      `,
      );

      const customerDetails = await postgre.query(
        `
      SELECT
        "RefCRMCustomerId" AS "EntityId","Name" AS "EntityName"
      FROM dbo."RefCRMCustomer"
      `,
      );

      const agentDetails = await postgre.query(
        `
      SELECT
        "RefAgentId" AS "EntityId","Name" AS "EntityName"
      FROM dbo."RefAgent"
      `,
      );

      const bankDetails = await postgre.query(
        `
      SELECT
        "RefBankId" AS "EntityId","Name" AS "EntityName"
      FROM dbo."RefBank"
      `,
      );

      res.json({
        isError: false,
        data: {
          PrivateAccountTransaactionData: rows,
          employeeDetails: employeeDetails.rows,
          bankDetails: bankDetails.rows,
          agentDetails: agentDetails.rows,
          customerDetails: customerDetails.rows,
        },
        msg: "Data Loaded Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getPrivateAccountTransactionDataByDate: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;

      if (!fromDate || !toDate)
        throw new Error("Please enter all the required fields");

      const sql = `
        WITH ids AS (
        SELECT
        "CorePrivateAccountTransactionId"
        FROM dbo."CorePrivateAccountTransaction"
        WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        )
        SELECT
        tran."CorePrivateAccountTransactionId",
        tran."EntityType",
        tran."EntityId",
        tran."PartyName",
        tran."IsPaid",
        tran."Amount",
        tran."Notes",
        tran."UpdatedBalance",
        tran."AddedOn",
        tran."AddedByRefEmployeeId",
        tran."LastEditedOn",
        tran."LastEditedByRefEmployeeId"
        FROM ids idss
        INNER JOIN dbo."CorePrivateAccountTransaction" tran ON tran."CorePrivateAccountTransactionId" = idss."CorePrivateAccountTransactionId"
        ORDER BY tran."CorePrivateAccountTransactionId" DESC;
        `;

      const { rows } = await postgre.query(sql);

      res.json({
        isError: false,
        data: {
          PrivateAccountTransaactionData: rows,
        },
        msg: "Data Loaded Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = privateAccountController;
