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

const CustomerTransactionChangeLog = {
  getChangeLogData: async (req, res) => {
    try {
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;

      const EntityNameDetails = await EntityNameDetailsData();

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const sqlToGetData = `
        SELECT 
        ch."CoreCustomerTransactionsChangeLogActionableId", 
        ch."CoreTransactionDetailId", 
        ctd."FromAccountId",
        ctd."ToAccountId",
        ch."FromAmount", 
        ch."ToAmount", 
        ch."FromComission", 
        ch."ToComission", 
        ch."FromCharges", 
        ch."ToCharges", 
        ch."From500RupeesNotes", 
        ch."To500RupeesNotes", 
        ch."From200RupeesNotes", 
        ch."To200RupeesNotes", 
        ch."From100RupeesNotes", 
        ch."To100RupeesNotes", 
        ch."From50RupeesNotes", 
        ch."To50RupeesNotes", 
        ch."From20RupeesNotes", 
        ch."To20RupeesNotes", 
        ch."From10RupeesNotes", 
        ch."To10RupeesNotes", 
        ch."StatusUpdatedByCustomer", 
        e."Name" AS "AddedByEmployeeName",
        ch."AddedOn"
        FROM dbo."CoreCustomerTransactionsChangeLogActionable" ch
        INNER JOIN dbo."CoreTransactionDetail" ctd ON ctd."CoreTransactionDetailId" = ch."CoreTransactionDetailId"
        INNER JOIN dbo."RefEmployee" e ON e."RefEmployeeId" = ch."AddedByRefEmployeeId"
        WHERE date(ch."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        `;

      const ChangeLogData = await postgre.query(sqlToGetData);

      res.json({
        isError: false,
        msg: `Data Loaded Successfully.`,
        data: {
          ChangeLogData: ChangeLogData.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
        },
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = CustomerTransactionChangeLog;
