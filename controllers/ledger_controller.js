const postgre = require("../database");

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

      const sqlToGetTransactions = `
      WITH ids AS (
      SELECT
      "CoreTransactionDetailId"
      FROM dbo."CoreTransactionDetail"
      WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' AND (("FromEntityTypeRefEnumValueId" = ${EntityTypeId} AND "FromEntityId" = ${EntityId}) 
        OR ("ToEntityTypeRefEnumValueId" = ${EntityTypeId} AND "ToEntityId" = ${EntityId}))
      ) 
      SELECT
      tran."CoreTransactionDetailId",
      accFrom."RefEntityAccountId" AS fromaccountid,
      accTo."RefEntityAccountId" AS toaccountid,
      tran."Amount" + coalesce(tran."Comission",0) + coalesce(tran."Charges",0) AS "Amount",
      tran."Comission",
      tran."Charges",
      tran."Notes",
      tran."AddedOn",
      tran."DepositDate",
      CASE WHEN tran."FromEntityTypeRefEnumValueId" = ${EntityTypeId} THEn tran."FromEntityUpdatedBalance" ELSE tran."ToEntityUpdatedBalance" END AS "UpdatedBalance"
      FROM ids idss
      INNER JOIN dbo."CoreTransactionDetail" tran ON tran."CoreTransactionDetailId" = idss."CoreTransactionDetailId"
      INNER JOIN dbo."RefEntityAccount" accFrom ON accFrom."EntityTypeRefEnumValueId" = tran."FromEntityTypeRefEnumValueId" AND accFrom."EntityId" = tran."FromEntityId"
      INNER JOIN dbo."RefEntityAccount" accTo ON accTo."EntityTypeRefEnumValueId" = tran."ToEntityTypeRefEnumValueId" AND accTo."EntityId" = tran."ToEntityId"
      ORDER BY tran."CoreTransactionDetailId" DESC;
                `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      const sqlToGetAccountId = `
        SELECT
        "RefEntityAccountId"
        FROM dbo."RefEntityAccount"
        WHERE "EntityTypeRefEnumValueId" = ${EntityTypeId} AND "EntityId" = ${EntityId};
        `;
      const AccountId = await postgre.query(sqlToGetAccountId);

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
};

module.exports = LedgerController;
