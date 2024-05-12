const postgre = require("../database");

const TransactionController = {
  getTransactionMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      const sqlToGetActiveCustomer = `
        SELECT
        "RefCRMCustomerId",
        "Name",
        "DefaultComissionProfileName"
        FROM dbo."RefCRMCustomer"
        WHERE "IsActive" = true;
      `;
      const ActiveCustomers = await postgre.query(sqlToGetActiveCustomer);

      const sqlToGetActiveAgent = `
        SELECT
        "RefAgentId",
        "Name"
        FROM dbo."RefAgent"
        WHERE "IsActive" = true;
      `;
      const ActiveAgents = await postgre.query(sqlToGetActiveAgent);

      const sqlToGetActiveBank = `
        SELECT
        "RefBankId",
        "Name"
        FROM dbo."RefBank"
        WHERE "IsActive" = true;
      `;
      const ActiveBanks = await postgre.query(sqlToGetActiveBank);

      const sqlToGetDeliveryEmployee = `
        SELECT
        em."RefEmployeeId",
        em."Name"
        FROM dbo."RefEmployee" em
        INNER JOIN dbo."RefEmployeeType" ty ON ty."RefEmployeeTypeId" = em."RefEmployeeTypeId"
        WHERE ty."Code" = 'DeliveryEmployee';
      `;
      const ActiveDeliveryEmployee = await postgre.query(
        sqlToGetDeliveryEmployee,
      );

      const sqlToGetComissionProfiles = `
        SELECT
        "RefComissionProfileId",
        "Name",
        "FromValue",
        "ToValue",
        "InPercent",
        "InRupees"
      FROM dbo."RefComissionProfile"
      ORDER BY "Name", "RefComissionProfileId" ASC
      `;
      const ComissionProfiles = await postgre.query(sqlToGetComissionProfiles);

      const sqlToGetEntityNameDetails = `
      SELECT
      ac."RefEntityAccountId",
      ac."EntityTypeRefEnumValueId",
      enu."Code",
      ac."EntityId",
      CASE
        WHEN ac."EntityTypeRefEnumValueId" = 11 THEN cust."Name"
        WHEN ac."EntityTypeRefEnumValueId" = 12 THEN bank."Name"
        ELSE agent."Name"
      END AS EntityName
      FROM dbo."RefEntityAccount" ac
      INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
      LEFT JOIN dbo."RefCRMCustomer" cust ON ac."EntityTypeRefEnumValueId" = 11 AND cust."RefCRMCustomerId" = ac."EntityId"
      LEFT JOIN dbo."RefBank" bank ON ac."EntityTypeRefEnumValueId" = 12 AND bank."RefBankId" = ac."EntityId"
      LEFT JOIN dbo."RefAgent" agent ON ac."EntityTypeRefEnumValueId" = 13 AND agent."RefAgentId" = ac."EntityId"
      WHERE cust."RefCRMCustomerId" IS NOT NULL OR bank."RefBankId" IS NOT NULL OR agent."RefAgentId" IS NOT NULL;
        `;

      const EntityNameDetails = await postgre.query(sqlToGetEntityNameDetails);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const sqlToGetTransactions = `
        SELECT
        tran."CoreTransactionDetailId",
    		fromName."RefEntityAccountId" AS FromAccountId,
    		toName."RefEntityAccountId" AS ToAccountId,
        tran."Amount",
        tran."Comission",
        tran."Charges",
        tran."Notes",
        tran."IsDelivery",
        deli."Name" AS DeliveryEmployeeName,
        added."Name" AS AddedEmployeeName,
        tran."AddedOn",
        edited."Name" AS EditedEmployeeName,
        tran."LastEditedOn"
        FROM dbo."CoreTransactionDetail" tran
        INNER JOIN dbo."RefEntityAccount" fromName ON fromName."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND fromName."EntityId" = tran."FromEntityId"
        INNER JOIN dbo."RefEntityAccount" toName ON toName."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND toName."EntityId" = tran."ToEntityId"
        INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
        LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
        WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        ORDER BY tran."CoreTransactionDetailId" DESC;
        `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      const sqlToGetDeliveryTransactions = `
  SELECT
  tran."CoreDeliveryTransactionDetailId",
  fromName."RefEntityAccountId" AS FromAccountId,
  toName."RefEntityAccountId" AS ToAccountId,
  tran."Amount",
  tran."Comission",
  tran."Charges",
  tran."Notes",
  deli."Name" AS DeliveryEmployeeName,
  tran."AcceptedByCustomer",
  tran."AcceptedByEmployee",
  added."Name" AS AddedEmployeeName,
  tran."AddedOn",
  edited."Name" AS EditedEmployeeName,
  tran."LastEditedOn"
  FROM dbo."CoreDeliveryTransactionDetail" tran
        INNER JOIN dbo."RefEntityAccount" fromName ON fromName."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND fromName."EntityId" = tran."FromEntityId"
        INNER JOIN dbo."RefEntityAccount" toName ON toName."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND toName."EntityId" = tran."ToEntityId"
  INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
  INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
  LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
  WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
  ORDER BY tran."CoreDeliveryTransactionDetailId" DESC;
      `;

      const DeliveryTransactions = await postgre.query(
        sqlToGetDeliveryTransactions,
      );

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          ActiveCustomers: ActiveCustomers.rows,
          ActiveAgents: ActiveAgents.rows,
          ActiveBanks: ActiveBanks.rows,
          ActiveDeliveryEmployee: ActiveDeliveryEmployee.rows,
          ComissionProfiles: ComissionProfiles.rows,
          Transactions: Transactions.rows,
          DeliveryTransactions: DeliveryTransactions.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  addNewTransaction: async (req, res) => {
    try {
      const employee = req.session.employee;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      const {
        fromEntityType,
        fromEntityId,
        toEntityType,
        toEntityId,
        Amount,
        Comission,
        notes,
        Charges,
        isDelivery,
        DeliveryEmployeeId,
        Rupees500,
        Rupees200,
        Rupees100,
        Rupees50,
        Rupees20,
        Rupees10,
      } = req.body;

      if (
        fromEntityType != "Customer" &&
        fromEntityType != "Bank" &&
        fromEntityType != "Agent"
      )
        throw "Invalid from entity type";
      if (
        toEntityType != "Customer" &&
        toEntityType != "Bank" &&
        toEntityType != "Agent"
      )
        throw "Invalid to entity type";

      if (
        typeof Amount != "number" ||
        typeof fromEntityId != "number" ||
        typeof toEntityId != "number" ||
        typeof isDelivery != "boolean" ||
        typeof Rupees500 != "number" ||
        typeof Rupees200 != "number" ||
        typeof Rupees100 != "number" ||
        typeof Rupees50 != "number" ||
        typeof Rupees20 != "number" ||
        typeof Rupees10 != "number"
      )
        throw "Invalid data";

      if (isDelivery && typeof DeliveryEmployeeId != "number")
        throw "Invalid Delivery Employee Id";

      const totalAmount =
        Amount +
        (Comission && typeof Comission == "number" ? Comission : 0) +
        (Charges && typeof Charges == "number" ? Charges : 0);

      if (
        Math.abs(
          Rupees500 * 500 +
            Rupees200 * 200 +
            Rupees100 * 100 +
            Rupees50 * 50 +
            Rupees20 * 20 +
            Rupees10 * 10 -
            totalAmount,
        ) >= 10
      )
        throw "Invalid Notes Count !";

      if (!isDelivery) {
        const sql = `
          SELECT dbo.coretransactiondetail_insert(
            ${employee.RefEmployeeId}, 
            '${fromEntityType}', 
            ${fromEntityId}, 
            '${toEntityType}', 
            ${toEntityId}, 
            ${Amount}, 
            ${Comission && typeof Comission == "number" && Comission != 0 ? Comission : null}, 
            ${Charges && typeof Charges == "number" && Charges != 0 ? Charges : null}, 
            ${totalAmount}, 
            ${notes && typeof notes == "string" && notes.trim() != "" ? "'" + notes + "'" : null}, 
            ${Rupees500},
            ${Rupees200},
            ${Rupees100},
            ${Rupees50},
            ${Rupees20},
            ${Rupees10}
          );
        `;
        const result = await postgre.query(sql);
        if (result.rows == null || result.rows.length == 0)
          throw "Something went wrong! Transaction not added.";
      } else {
        const sql = `
          SELECT dbo.coredeliverytransactiondetail_insert(
            ${employee.RefEmployeeId}, 
            '${fromEntityType}', 
            ${fromEntityId}, 
            '${toEntityType}', 
            ${toEntityId}, 
            ${Amount}, 
            ${Comission && typeof Comission == "number" && Comission != 0 ? Comission : null}, 
            ${Charges && typeof Charges == "number" && Charges != 0 ? Charges : null}, 
            ${notes && typeof notes == "string" && notes.trim() != "" ? "'" + notes + "'" : null}, 
            ${Rupees500},
            ${Rupees200},
            ${Rupees100},
            ${Rupees50},
            ${Rupees20},
            ${Rupees10},
            ${DeliveryEmployeeId}
          );
        `;
        const result = await postgre.query(sql);
        if (result.rows == null || result.rows.length == 0)
          throw "Something went wrong! Transaction not added.";
      }

      res.json({
        isError: false,
        msg: "Transaction Added successfully",
        data: {},
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getTransactionDataByDate: async (req, res) => {
    try {
      const employee = req.session.employee;
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      const sqlToGetEntityNameDetails = `
      SELECT
      ac."RefEntityAccountId",
      ac."EntityTypeRefEnumValueId",
      enu."Code",
      ac."EntityId",
      CASE
        WHEN ac."EntityTypeRefEnumValueId" = 11 THEN cust."Name"
        WHEN ac."EntityTypeRefEnumValueId" = 12 THEN bank."Name"
        ELSE agent."Name"
      END AS EntityName
      FROM dbo."RefEntityAccount" ac
      INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
      LEFT JOIN dbo."RefCRMCustomer" cust ON ac."EntityTypeRefEnumValueId" = 11 AND cust."RefCRMCustomerId" = ac."EntityId"
      LEFT JOIN dbo."RefBank" bank ON ac."EntityTypeRefEnumValueId" = 12 AND bank."RefBankId" = ac."EntityId"
      LEFT JOIN dbo."RefAgent" agent ON ac."EntityTypeRefEnumValueId" = 13 AND agent."RefAgentId" = ac."EntityId"
      WHERE cust."RefCRMCustomerId" IS NOT NULL OR bank."RefBankId" IS NOT NULL OR agent."RefAgentId" IS NOT NULL;
        `;

      const EntityNameDetails = await postgre.query(sqlToGetEntityNameDetails);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const sqlToGetTransactions = `
        SELECT
        tran."CoreTransactionDetailId",
        fromName."RefEntityAccountId" AS FromAccountId,
        toName."RefEntityAccountId" AS ToAccountId,
        tran."Amount",
        tran."Comission",
        tran."Charges",
        tran."Notes",
        tran."IsDelivery",
        deli."Name" AS DeliveryEmployeeName,
        added."Name" AS AddedEmployeeName,
        tran."AddedOn",
        edited."Name" AS EditedEmployeeName,
        tran."LastEditedOn"
        FROM dbo."CoreTransactionDetail" tran
        INNER JOIN dbo."RefEntityAccount" fromName ON fromName."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND fromName."EntityId" = tran."FromEntityId"
        INNER JOIN dbo."RefEntityAccount" toName ON toName."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND toName."EntityId" = tran."ToEntityId"
        INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
        LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
        WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        ORDER BY tran."CoreTransactionDetailId" DESC;
        `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      const sqlToGetDeliveryTransactions = `
  SELECT
  tran."CoreDeliveryTransactionDetailId",
  fromName."RefEntityAccountId" AS FromAccountId,
  toName."RefEntityAccountId" AS ToAccountId,
  tran."Amount",
  tran."Comission",
  tran."Charges",
  tran."Notes",
  deli."Name" AS DeliveryEmployeeName,
  tran."AcceptedByCustomer",
  tran."AcceptedByEmployee",
  added."Name" AS AddedEmployeeName,
  tran."AddedOn",
  edited."Name" AS EditedEmployeeName,
  tran."LastEditedOn"
  FROM dbo."CoreDeliveryTransactionDetail" tran
        INNER JOIN dbo."RefEntityAccount" fromName ON fromName."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND fromName."EntityId" = tran."FromEntityId"
        INNER JOIN dbo."RefEntityAccount" toName ON toName."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND toName."EntityId" = tran."ToEntityId"
  INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
  INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
  LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
  WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
  ORDER BY tran."CoreDeliveryTransactionDetailId" DESC;
      `;

      const DeliveryTransactions = await postgre.query(
        sqlToGetDeliveryTransactions,
      );

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          Transactions: Transactions.rows,
          DeliveryTransactions: DeliveryTransactions.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getTransactionDetailById: async (req, res) => {
    try {
      const employee = req.session.employee;
      const transactionId = req.body.transactionId;

      const sqlToGetTransactions = `
SELECT
tran."CoreTransactionDetailId",
fromName."RefEntityAccountId" AS FromAccountId,
toName."RefEntityAccountId" AS ToAccountId,
tran."Amount",
tran."Comission",
tran."Charges",
tran."Notes",
tran."IsDelivery",
tran."CustomerNotes",
tran."EmployeeNotes",
tran."500RupeesNotes" AS rupees500,
tran."200RupeesNotes" AS rupees200,
tran."100RupeesNotes" AS rupees100,
tran."50RupeesNotes" AS rupees50,
tran."20RupeesNotes" AS rupees20,
tran."10RupeesNotes" AS rupees10,
deli."Name" AS DeliveryEmployeeName,
added."Name" AS AddedEmployeeName,
tran."AddedOn",
edited."Name" AS EditedEmployeeName,
tran."LastEditedOn",
tran."FromEntityUpdatedBalance",
tran."ToEntityUpdatedBalance"
FROM dbo."CoreTransactionDetail" tran
INNER JOIN dbo."RefEntityAccount" fromName ON fromName."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND fromName."EntityId" = tran."FromEntityId"
INNER JOIN dbo."RefEntityAccount" toName ON toName."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND toName."EntityId" = tran."ToEntityId"
INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
WHERE tran."CoreTransactionDetailId" = ${transactionId};
          `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      if (Transactions.rows.length == 0) throw "Invalid Transaction Id";

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          Transaction: Transactions.rows[0],
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getPendingDeliveryTransactionsByDeliveryEmployeeId: async (req, res) => {
    try {
      const employee = req.session.employee;
      const employeeId = employee.RefEmployeeId;

      const sqlToGetEntityNameDetails = `
      SELECT
      ac."RefEntityAccountId",
      ac."EntityTypeRefEnumValueId",
      enu."Code",
      ac."EntityId",
      CASE
        WHEN ac."EntityTypeRefEnumValueId" = 11 THEN cust."Name"
        WHEN ac."EntityTypeRefEnumValueId" = 12 THEN bank."Name"
        ELSE agent."Name"
      END AS EntityName
      FROM dbo."RefEntityAccount" ac
      INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
      LEFT JOIN dbo."RefCRMCustomer" cust ON ac."EntityTypeRefEnumValueId" = 11 AND cust."RefCRMCustomerId" = ac."EntityId"
      LEFT JOIN dbo."RefBank" bank ON ac."EntityTypeRefEnumValueId" = 12 AND bank."RefBankId" = ac."EntityId"
      LEFT JOIN dbo."RefAgent" agent ON ac."EntityTypeRefEnumValueId" = 13 AND agent."RefAgentId" = ac."EntityId"
      WHERE cust."RefCRMCustomerId" IS NOT NULL OR bank."RefBankId" IS NOT NULL OR agent."RefAgentId" IS NOT NULL;
        `;

      const EntityNameDetails = await postgre.query(sqlToGetEntityNameDetails);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const sqlToGetTransactions = `
  SELECT
  tran."CoreDeliveryTransactionDetailId",
  fromName."RefEntityAccountId" AS FromAccountId,
  toName."RefEntityAccountId" AS ToAccountId,
  tran."Amount",
  tran."Comission",
  tran."Charges",
  tran."AcceptedByCustomer",
  tran."AcceptedByEmployee",
  added."Name" AS AddedEmployeeName,
  tran."AddedOn",
  edited."Name" AS EditedEmployeeName,
  tran."LastEditedOn",
  tran."EmployeeNotes",
  tran."500RupeesNotes" AS rupees500notes,
  tran."200RupeesNotes" AS rupees200notes,
  tran."100RupeesNotes" AS rupees100notes,
  tran."50RupeesNotes" AS rupees50notes,
  tran."20RupeesNotes" AS rupees20notes,
  tran."10RupeesNotes" AS rupees10notes
  FROM dbo."CoreDeliveryTransactionDetail" tran
  INNER JOIN dbo."RefEntityAccount" fromName ON fromName."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND fromName."EntityId" = tran."FromEntityId"
  INNER JOIN dbo."RefEntityAccount" toName ON toName."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND toName."EntityId" = tran."ToEntityId"
  INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
  INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
  WHERE tran."DeliveryRefEmployeeId" = ${employeeId}
  ORDER BY tran."CoreDeliveryTransactionDetailId" DESC;
            `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          Transactions: Transactions.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  acceptPendingDeliveryFromDeliveryEmployee: async (req, res) => {
    try {
      const notes = req.body.notes;
      const transactionId = req.body.transactionId;

      const sqlToGetTransaction = `
        SELECT
        *
        FROM dbo."CoreDeliveryTransactionDetail"
        WHERE "CoreDeliveryTransactionDetailId" = ${transactionId};
        `;

      const Transactions = await postgre.query(sqlToGetTransaction);
      if (Transactions.rows == 0) throw "Invalid Transaction Id";

      const Transaction = Transactions.rows[0];
      if (Transaction.AcceptedByCustomer) {
        const sqlToTransferTransaction = `
          SELECT dbo.coretransactiondetail_transferfrom_coredeliverytransactiondetai(
            ${Transaction.AddedByRefEmployeeId}, 
            ${Transaction.CustomerNotes && Transaction.CustomerNotes.trim() != "" ? "'" + Transaction.CustomerNotes + "'" : null}, 
            ${notes && notes.trim() != "" ? "'" + notes + "'" : null}, 
            ${Transaction.Amount + (Transaction.Comission ? Transaction.Comission : 0) + (Transaction.Charges ? Transaction.Charges : 0)}, 
            ${Transaction.FromEntityTypeRefEnumValueId}, 
            ${Transaction.FromEntityId}, 
            ${Transaction.ToEntityTypeRefEnumValueId}, 
            ${Transaction.ToEntityId},
            ${Transaction.CoreDeliveryTransactionDetailId}
          );
          `;
        const addedTransactions = await postgre.query(sqlToTransferTransaction);

        if (addedTransactions.rows != 1) throw `Something went wrong!`;
      } else {
        const sqlToUpdateTransaction = `
          UPDATE dbo."CoreDeliveryTransactionDetail"
          SET "AcceptedByEmployee" = true,
          "EmployeeNotes" = ${notes && notes.trim() != "" ? "'" + notes + "'" : null}
          WHERE "CoreDeliveryTransactionDetailId" = ${transactionId}
          `;
        await postgre.query(sqlToUpdateTransaction);
        res.json({
          isError: false,
          msg: "Updated successfully",
          data: {},
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = TransactionController;
