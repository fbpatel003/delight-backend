const postgre = require("../database");

const verifyDateRange = (fromDate, toDate) => {
  // Parse the input dates
  const from = new Date(fromDate);
  const to = new Date(toDate);

  // Check if the dates are valid
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error("Invalid date format");
  }

  // Calculate the difference in time
  const timeDifference = to - from;

  // Convert time difference from milliseconds to days
  const dayDifference = timeDifference / (1000 * 60 * 60 * 24);

  // Check if the difference is within 93 days
  if (dayDifference > 93) {
    throw new Error("Date range should be greater than 93 days!");
  }
};

const privateAccountController = {
  addTransaction: async (req, res) => {
    try {
      var { EntityTypeId, EntityId, Name, Amount, IsPaid, Notes } = req.body;
      const employeeId = req.session.employee.RefEmployeeId;

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

      if (Amount <= 0) throw new Error("Please enter a valid amount");

      if (EntityTypeId < 1 || EntityTypeId > 5)
        throw new Error("Invalid Entity Type");

      if (EntityTypeId == 1 && EntityId != 0)
        throw new Error("Invalid Entity Id");

      if (EntityTypeId == 1 && (!Name || Name.trim() == ""))
        throw new Error("Please enter the name of the party.");

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
        select *
        from dbo."CorePrivateAccountTransaction"
        order by "CorePrivateAccountTransactionId" desc
        fetch first 1 rows only
        `,
      );

      var lastBalance = 0;
      if (lastTransaction.rows.length > 0) {
        lastBalance = lastTransaction.rows[0].UpdatedBalance;
      }

      var updatedBalance = 0;
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
          ${Name ? "'" + Name + "'" : null},
          ${IsPaid},
          ${Amount},
          ${Notes ? "'" + Notes + "'" : null},
          ${updatedBalance},
          now(),
          ${employeeId},
          now(),
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
      verifyDateRange(fromDate, toDate);

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
      verifyDateRange(fromDate, toDate);

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
  getPrivateAccountTransactionById: async (req, res) => {
    try {
      const { transactionId } = req.body;

      const sql = `
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
        FROM dbo."CorePrivateAccountTransaction" tran 
        WHERE tran."CorePrivateAccountTransactionId" = ${transactionId};
        `;

      const { rows } = await postgre.query(sql);

      if (rows.length == 0) throw new Error("Invalid Transaction Id");

      res.json({
        isError: false,
        data: {
          PrivateAccountTransaaction: rows[0],
        },
        msg: "Data Loaded Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  updatePrivateAccountTransaction: async (req, res) => {
    try {
      var { transactionId, Amount, Notes } = req.body;
      const employeeId = req.session.employee.RefEmployeeId;

      var privateTransactionId = Number(transactionId);
      var NewAmount = Number(Amount);
      var NewNotes = Notes ? Notes.trim() : "";

      if (
        typeof privateTransactionId != "number" ||
        typeof NewAmount != "number"
      )
        throw new Error("Please enter all the required fields");

      if (NewAmount <= 0) throw new Error("Please enter a valid amount");

      const oldTransactionsrow = await postgre.query(
        `
        SELECT
        tran."EntityType",
        tran."EntityId",
        tran."PartyName",
        tran."IsPaid",
        tran."Amount",
        coalesce(tran."Notes") AS "Notes",
        tran."UpdatedBalance"
        FROM dbo."CorePrivateAccountTransaction" tran 
        WHERE tran."CorePrivateAccountTransactionId" = ${privateTransactionId};
        `,
      );

      if (oldTransactionsrow.rows.length == 0)
        throw new Error("Invalid Transaction Id");

      const oldTransaction = oldTransactionsrow.rows[0];

      if (
        oldTransaction.Amount == NewAmount &&
        oldTransaction.Notes == NewNotes
      )
        throw new Error("Nothing to update.");

      if (
        oldTransaction.Amount == NewAmount &&
        oldTransaction.Notes != NewNotes
      ) {
        const sql = `
        UPDATE dbo."CorePrivateAccountTransaction"
        SET "Notes" = ${NewNotes && NewNotes.trim() != "" ? "'" + NewNotes + "'" : null},
        "LastEditedOn" = now(),
        "LastEditedByRefEmployeeId" = ${employeeId}
        WHERE "CorePrivateAccountTransactionId" = ${privateTransactionId};
        `;

        await postgre.query(sql);

        res.json({
          isError: false,
          data: {},
          msg: "Data Updated Successfully!",
        });
        return;
      } else {
        var pieceToAddInSubsequientTransactions = 0;

        if (oldTransaction.IsPaid) {
          if (NewAmount >= oldTransaction.Amount) {
            pieceToAddInSubsequientTransactions =
              (NewAmount - oldTransaction.Amount) * -1;
          } else {
            pieceToAddInSubsequientTransactions =
              (NewAmount - oldTransaction.Amount) * -1;
          }
        } else {
          if (NewAmount >= oldTransaction.Amount) {
            pieceToAddInSubsequientTransactions =
              NewAmount - oldTransaction.Amount;
          } else {
            pieceToAddInSubsequientTransactions =
              (oldTransaction.Amount - NewAmount) * -1;
          }
        }

        const sql = `
        UPDATE dbo."CorePrivateAccountTransaction"
        SET "Amount" = ${NewAmount},
        "Notes" = ${NewNotes && NewNotes.trim() != "" ? "'" + NewNotes + "'" : null},
        "UpdatedBalance" = ${pieceToAddInSubsequientTransactions >= 0 ? '"UpdatedBalance" + ' + pieceToAddInSubsequientTransactions.toString() : '"UpdatedBalance" - ' + (pieceToAddInSubsequientTransactions * -1).toString()},
        "LastEditedOn" = now(),
        "LastEditedByRefEmployeeId" = ${employeeId}
        WHERE "CorePrivateAccountTransactionId" = ${privateTransactionId};

        UPDATE dbo."CorePrivateAccountTransaction"
        SET "UpdatedBalance" = ${pieceToAddInSubsequientTransactions >= 0 ? '"UpdatedBalance" + ' + pieceToAddInSubsequientTransactions.toString() : '"UpdatedBalance" - ' + (pieceToAddInSubsequientTransactions * -1).toString()}
        WHERE "CorePrivateAccountTransactionId" > ${privateTransactionId};
        `;

        await postgre.query(sql);

        res.json({
          isError: false,
          data: {},
          msg: "Data Updated Successfully!",
        });
        return;
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  deletePrivateAccountTransaction: async (req, res) => {
    try {
      var { transactionId } = req.body;

      var privateTransactionId = Number(transactionId);

      if (typeof privateTransactionId != "number")
        throw new Error("Invalid Transaction Id");

      const oldTransactionsrow = await postgre.query(
        `
        SELECT
        tran."EntityType",
        tran."EntityId",
        tran."PartyName",
        tran."IsPaid",
        tran."Amount",
        tran."UpdatedBalance"
        FROM dbo."CorePrivateAccountTransaction" tran 
        WHERE tran."CorePrivateAccountTransactionId" = ${privateTransactionId};
        `,
      );

      if (oldTransactionsrow.rows.length == 0)
        throw new Error("Invalid Transaction Id");

      const oldTransaction = oldTransactionsrow.rows[0];

      var pieceToAddInSubsequientTransactions = 0;

      if (oldTransaction.IsPaid) {
        pieceToAddInSubsequientTransactions = oldTransaction.Amount;
      } else {
        pieceToAddInSubsequientTransactions = -oldTransaction.Amount;
      }

      const sql = `
        DELETE FROM dbo."CorePrivateAccountTransaction"
        WHERE "CorePrivateAccountTransactionId" = ${privateTransactionId};

        UPDATE dbo."CorePrivateAccountTransaction"
        SET "UpdatedBalance" = ${pieceToAddInSubsequientTransactions >= 0 ? '"UpdatedBalance" + ' + pieceToAddInSubsequientTransactions.toString() : '"UpdatedBalance" - ' + (pieceToAddInSubsequientTransactions * -1).toString()}
        WHERE "CorePrivateAccountTransactionId" > ${privateTransactionId};
        `;

      await postgre.query(sql);

      res.json({
        isError: false,
        data: {},
        msg: "Transaction Deleted Successfully!",
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = privateAccountController;
