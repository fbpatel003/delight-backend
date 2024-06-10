const postgre = require("../database");

const EntityNameDetailsData = async () => {
  const sqlToGetCustomerEntityEnumTypes = `
    SELECT * from dbo."RefEnumValue" WHERE "EnumTypeName" = 'EntityType';
    `;

  const EnumTypes = await postgre.query(sqlToGetCustomerEntityEnumTypes);
  const customerTypeRefEnumValueId = EnumTypes.rows.find(
    (x) => x.Code == "Customer",
  ).RefEnumValueId;
  const agentTypeRefEnumValueId = EnumTypes.rows.find(
    (x) => x.Code == "Agent",
  ).RefEnumValueId;
  const bankTypeRefEnumValueId = EnumTypes.rows.find(
    (x) => x.Code == "Bank",
  ).RefEnumValueId;

  const sqlToGetEntityNameDetails = `
  SELECT
  ac."RefEntityAccountId",
  ac."EntityTypeRefEnumValueId",
  enu."Code",
  ac."EntityId",
  CASE
    WHEN ac."EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} THEN cust."Name"
    WHEN ac."EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId} THEN bank."Name"
    WHEN ac."EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} THEN agent."Name"
  END AS EntityName
  FROM dbo."RefEntityAccount" ac
  INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
  LEFT JOIN dbo."RefCRMCustomer" cust ON ac."EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} AND cust."RefCRMCustomerId" = ac."EntityId"
  LEFT JOIN dbo."RefBank" bank ON ac."EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId} AND bank."RefBankId" = ac."EntityId"
  LEFT JOIN dbo."RefAgent" agent ON ac."EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} AND agent."RefAgentId" = ac."EntityId"
  WHERE cust."RefCRMCustomerId" IS NOT NULL OR bank."RefBankId" IS NOT NULL OR agent."RefAgentId" IS NOT NULL;
    `;

  const EntityNameDetails = await postgre.query(sqlToGetEntityNameDetails);
  return EntityNameDetails;
};

const LedgerController = {
  getLedgerMasterData: async (req, res) => {
    try {
      const sqlToGetCustomerEntityEnumTypes = `
        SELECT * from dbo."RefEnumValue" WHERE "EnumTypeName" = 'EntityType';
        `;

      const EnumTypes = await postgre.query(sqlToGetCustomerEntityEnumTypes);
      const customerTypeRefEnumValueId = EnumTypes.rows.find(
        (x) => x.Code == "Customer",
      ).RefEnumValueId;
      const agentTypeRefEnumValueId = EnumTypes.rows.find(
        (x) => x.Code == "Agent",
      ).RefEnumValueId;
      const bankTypeRefEnumValueId = EnumTypes.rows.find(
        (x) => x.Code == "Bank",
      ).RefEnumValueId;

      const sqlToGetEntityNameDetails = `
      SELECT
      ac."RefEntityAccountId",
      ac."EntityTypeRefEnumValueId" AS "EntityTypeId",
      enu."Code" AS "EntityTypeCode",
      ac."EntityId",
      CASE
        WHEN ac."EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} THEN cust."Name"
        WHEN ac."EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId} THEN bank."Name"
        WHEN ac."EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} THEN agent."Name"
      END AS "EntityName"
      FROM dbo."RefEntityAccount" ac
      INNER JOIN dbo."RefEnumValue" enu ON enu."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
      LEFT JOIN dbo."RefCRMCustomer" cust ON ac."EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} AND cust."RefCRMCustomerId" = ac."EntityId"
      LEFT JOIN dbo."RefBank" bank ON ac."EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId} AND bank."RefBankId" = ac."EntityId"
      LEFT JOIN dbo."RefAgent" agent ON ac."EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} AND agent."RefAgentId" = ac."EntityId"
      WHERE cust."RefCRMCustomerId" IS NOT NULL OR bank."RefBankId" IS NOT NULL OR agent."RefAgentId" IS NOT NULL;
        `;

      const EntityNameDetails = await postgre.query(sqlToGetEntityNameDetails);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          EntityDetails: EntityNameDetails.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getEntityLedgerData: async (req, res) => {
    try {
      const { fromDate, toDate, EntityTypeId, EntityId } = req.body;

      if (
        !EntityId ||
        !EntityTypeId ||
        typeof EntityTypeId !== "number" ||
        typeof EntityId !== "number"
      )
        throw new Error("Invalid Parameters");

      const sqlToGetAccountId = `
        SELECT
        "RefEntityAccountId"
        FROM dbo."RefEntityAccount"
        WHERE "EntityTypeRefEnumValueId" = ${EntityTypeId} AND "EntityId" = ${EntityId};
        `;
      const AccountId = await postgre.query(sqlToGetAccountId);

      const sqlToGetTransactions = `
      WITH ids AS (
      SELECT
      "CoreTransactionDetailId"
      FROM dbo."CoreTransactionDetail"
      WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' AND ("FromAccountId" = ${AccountId.rows[0].RefEntityAccountId} OR "ToAccountId" = ${AccountId.rows[0].RefEntityAccountId})
      ) 
      SELECT
      tran."CoreTransactionDetailId",
      tran."FromAccountId" AS fromaccountid,
      tran."ToAccountId" AS toaccountid,
      tran."Amount",
      tran."Comission",
      tran."Charges",
      tran."Notes",
      tran."AddedOn",
      tran."DepositDate",
      CASE WHEN tran."FromAccountId" = ${AccountId.rows[0].RefEntityAccountId} THEn tran."FromEntityUpdatedBalance" ELSE tran."ToEntityUpdatedBalance" END AS "UpdatedBalance"
      FROM ids idss
      INNER JOIN dbo."CoreTransactionDetail" tran ON tran."CoreTransactionDetailId" = idss."CoreTransactionDetailId"
      ORDER BY tran."CoreTransactionDetailId" DESC;
                `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          Transactions: Transactions.rows,
          AccountId: AccountId.rows[0].RefEntityAccountId,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getSearchTransactionsData: async (req, res) => {
    try {
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      const fromEntity = req.body.fromEntity;
      const toEntity = req.body.toEntity;
      const Amount = req.body.Amount;
      const Notes = req.body.Notes;

      const EntityNameDetails = await EntityNameDetailsData();

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      var fromAccountId = 0;
      var toAccountId = 0;
      if (fromEntity && fromEntity.EntityTypeCode && fromEntity.EntityId) {
        var account = EntityNameDetails.rows.find(
          (x) =>
            x.Code == fromEntity.EntityTypeCode &&
            x.EntityId == fromEntity.EntityId,
        );
        fromAccountId = account.RefEntityAccountId;
      }
      if (toEntity && toEntity.EntityTypeCode && toEntity.EntityId) {
        var account = EntityNameDetails.rows.find(
          (x) =>
            x.Code == toEntity.EntityTypeCode &&
            x.EntityId == toEntity.EntityId,
        );
        toAccountId = account.RefEntityAccountId;
      }

      isAmountAvailable = Amount && typeof Amount == "number" && Amount > 0;
      isNotesAvailable =
        Notes && typeof Notes == "string" && Notes.trim().length > 0;

      const sqlToGetTransactions = `
      WITH ids AS (
      SELECT
      "CoreTransactionDetailId"
      FROM dbo."CoreTransactionDetail"
      WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' 
      ${fromAccountId != 0 ? ` AND "FromAccountId" = ${fromAccountId} ` : ""} 
      ${toAccountId != 0 ? ` AND "ToAccountId" = ${toAccountId} ` : ""}
      ${isAmountAvailable ? ` AND "Amount" >= ${Amount} ` : ""}
      ${isNotesAvailable ? ` AND "Notes" LIKE '%${Notes.trim()}%' ` : ""}
      )
        SELECT
        tran."CoreTransactionDetailId",
        tran."FromAccountId" AS FromAccountId,
        tran."ToAccountId" AS ToAccountId,
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
        FROM ids idss
        INNER JOIN dbo."CoreTransactionDetail" tran ON tran."CoreTransactionDetailId" = idss."CoreTransactionDetailId"
        INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
        LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
        ORDER BY tran."CoreTransactionDetailId" DESC;
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
  getSearchTotals: async (req, res) => {
    try {
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      const fromEntity = req.body.fromEntity;
      const toEntity = req.body.toEntity;
      const Amount = req.body.Amount;
      const Notes = req.body.Notes;

      const EntityNameDetails = await EntityNameDetailsData();

      var fromAccountId = 0;
      var toAccountId = 0;
      if (fromEntity && fromEntity.EntityTypeCode && fromEntity.EntityId) {
        var account = EntityNameDetails.rows.find(
          (x) =>
            x.Code == fromEntity.EntityTypeCode &&
            x.EntityId == fromEntity.EntityId,
        );
        fromAccountId = account.RefEntityAccountId;
      }
      if (toEntity && toEntity.EntityTypeCode && toEntity.EntityId) {
        var account = EntityNameDetails.rows.find(
          (x) =>
            x.Code == toEntity.EntityTypeCode &&
            x.EntityId == toEntity.EntityId,
        );
        toAccountId = account.RefEntityAccountId;
      }

      if (fromAccountId == 0 && toAccountId == 0)
        throw new Error("Invalid Parameters");

      isAmountAvailable = Amount && typeof Amount == "number" && Amount > 0;
      isNotesAvailable =
        Notes && typeof Notes == "string" && Notes.trim().length > 0;

      const sqlToGetTransactions = `
      WITH ids AS (
      SELECT
      "CoreTransactionDetailId"
      FROM dbo."CoreTransactionDetail"
      WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' 
      ${fromAccountId != 0 ? ` AND "FromAccountId" = ${fromAccountId} ` : ""} 
      ${toAccountId != 0 ? ` AND "ToAccountId" = ${toAccountId} ` : ""}
      ${isAmountAvailable ? ` AND "Amount" >= ${Amount} ` : ""}
      ${isNotesAvailable ? ` AND "Notes" LIKE '%${Notes.trim()}%' ` : ""}
      )
        SELECT
          COUNT(tran."CoreTransactionDetailId") AS "TotalTransactions",
          SUM(tran."Amount") AS "TotalAmount",
          SUM(tran."Comission") AS "TotalComission",
          SUM(tran."Charges") AS "TotalCharges"
        FROM ids idss
        INNER JOIN dbo."CoreTransactionDetail" tran ON tran."CoreTransactionDetailId" = idss."CoreTransactionDetailId"
        `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          Transactions: Transactions.rows,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = LedgerController;
