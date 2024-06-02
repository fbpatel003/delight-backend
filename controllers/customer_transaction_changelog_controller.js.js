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

const CustomerEntityNameDetailsData = async (RefCRMCustomerId) => {
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
  LEFT JOIN dbo."RefCRMCustomer" cust ON ac."EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} AND cust."RefCRMCustomerId" = ac."EntityId" AND cust."RefCRMCustomerId" = ${RefCRMCustomerId}
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
        ctd."IsDelivery",
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
        ORDER BY "CoreCustomerTransactionsChangeLogActionableId" DESC
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
  getCustomerTransactionsChangeLogData: async (req, res) => {
    try {
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      const customer = req.session.customer;

      const EntityNameDetails = await CustomerEntityNameDetailsData(
        customer.RefCRMCustomerId,
      );

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
        ctd."IsDelivery",
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
        WHERE ch."RefCRMCustomerId" = ${customer.RefCRMCustomerId} AND date(ch."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        ORDER BY "CoreCustomerTransactionsChangeLogActionableId" DESC
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
  updateChangeLogStatus: async (req, res) => {
    try {
      var CoreCustomerTransactionsChangeLogActionableId =
        req.body.CoreCustomerTransactionsChangeLogActionableId;
      const status = req.body.status;

      if (!(status == "Approved" || status == "Rejected"))
        throw new Error("Invalid Input");

      if (status == "Approved") {
        const sqlToGetOldData = `
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
          ch."AddedByRefEmployeeId"
          FROM dbo."CoreCustomerTransactionsChangeLogActionable" ch
          INNER JOIN dbo."CoreTransactionDetail" ctd ON ctd."CoreTransactionDetailId" = ch."CoreTransactionDetailId"
          WHERE "CoreCustomerTransactionsChangeLogActionableId" = ${CoreCustomerTransactionsChangeLogActionableId}
          `;

        const ChangeLogData = await postgre.query(sqlToGetOldData);

        if (ChangeLogData.rows == 0) throw new Error("Invalid Input");

        const ChangedLog = ChangeLogData.rows[0];
        const accountsData = await postgre.query(`
          SELECT
            ac."RefEntityAccountId",
            ac."CurrentBalance",
            v."Code",
            ac."EntityId"
          FROM dbo."RefEntityAccount" ac
          INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
          WHERE "RefEntityAccountId" IN (${ChangedLog.FromAccountId},${ChangedLog.ToAccountId})
        `);

        const fromAccount = accountsData.rows.find(
          (x) => x.RefEntityAccountId == ChangedLog.FromAccountId,
        );
        const toAccount = accountsData.rows.find(
          (x) => x.RefEntityAccountId == ChangedLog.ToAccountId,
        );

        const isAgentToCustomer =
          fromAccount.Code == "Agent" && toAccount.Code == "Customer";

        const isCustomerToBank =
          fromAccount.Code == "Customer" && toAccount.Code == "Bank";

        var oldFromFinalAmmountToDeduct = ChangedLog.FromAmount;
        var oldToFinalAmmountToAdd = ChangedLog.FromAmount;
        var newFromFinalAmmountToDeduct = ChangedLog.ToAmount;
        var newToFinalAmountToAdd = ChangedLog.ToAmount;

        if (isCustomerToBank) {
          oldFromFinalAmmountToDeduct =
            ChangedLog.FromAmount -
            (ChangedLog.FromComission ? ChangedLog.FromComission : 0);
          oldToFinalAmmountToAdd =
            ChangedLog.FromAmount -
            (ChangedLog.FromCharges ? ChangedLog.FromCharges : 0);
          newFromFinalAmmountToDeduct =
            ChangedLog.ToAmount -
            (ChangedLog.ToComission ? ChangedLog.ToComission : 0);
          newToFinalAmountToAdd =
            ChangedLog.ToAmount -
            (ChangedLog.ToCharges ? ChangedLog.ToCharges : 0);
        }

        var pieceToAddInFromBalance =
          newFromFinalAmmountToDeduct > oldFromFinalAmmountToDeduct
            ? oldFromFinalAmmountToDeduct - newFromFinalAmmountToDeduct
            : newFromFinalAmmountToDeduct - oldFromFinalAmmountToDeduct;

        var pieceToAddInToBalance =
          newToFinalAmountToAdd > oldToFinalAmmountToAdd
            ? newToFinalAmountToAdd - oldToFinalAmmountToAdd
            : oldToFinalAmmountToAdd - newToFinalAmountToAdd;

        if (newFromFinalAmmountToDeduct < oldFromFinalAmmountToDeduct)
          pieceToAddInFromBalance = pieceToAddInFromBalance * -1;
        if (newToFinalAmountToAdd < oldToFinalAmmountToAdd)
          pieceToAddInToBalance = pieceToAddInToBalance * -1;

        const currentDateString = new Date().toISOString();

        const sqlToUpdate = `
          UPDATE dbo."CoreTransactionDetail"
            SET
            "Amount"=${ChangedLog.ToAmount},
            "Comission"=${ChangedLog.ToComission ? ChangedLog.ToComission : null},
            "Charges"= ${ChangedLog.ToCharges ? ChangedLog.ToComission : null},
            "500RupeesNotes"=${isAgentToCustomer ? ChangedLog.To500RupeesNotes : null},
            "200RupeesNotes"=${isAgentToCustomer ? ChangedLog.To200RupeesNotes : null},
            "100RupeesNotes"=${isAgentToCustomer ? ChangedLog.To100RupeesNotes : null},
            "50RupeesNotes"=${isAgentToCustomer ? ChangedLog.To50RupeesNotes : null},
            "20RupeesNotes"=${isAgentToCustomer ? ChangedLog.To20RupeesNotes : null},
            "10RupeesNotes"=${isAgentToCustomer ? ChangedLog.To10RupeesNotes : null},
            "LastEditedByRefEmployeeId"=${ChangedLog.AddedByRefEmployeeId},
            "LastEditedOn"='${currentDateString}',
            "FromEntityUpdatedBalance" = "FromEntityUpdatedBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance},
            "ToEntityUpdatedBalance" = "ToEntityUpdatedBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
            WHERE "CoreTransactionDetailId" = ${ChangedLog.CoreTransactionDetailId};

          UPDATE dbo."CoreTransactionDetail"
          SET 
            "FromEntityUpdatedBalance" = 
              CASE WHEN "FromAccountId" = ${fromAccount.RefEntityAccountId} THEN "FromEntityUpdatedBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance}
              WHEN "FromAccountId" = ${toAccount.RefEntityAccountId} THEN "FromEntityUpdatedBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
              ELSE "FromEntityUpdatedBalance"
            END,
            "ToEntityUpdatedBalance" =
              CASE WHEN "ToAccountId" = ${fromAccount.RefEntityAccountId} THEN "ToEntityUpdatedBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance}
              WHEN "ToAccountId" = ${toAccount.RefEntityAccountId} THEN "ToEntityUpdatedBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
              ELSE "ToEntityUpdatedBalance"
            END,
            "LastEditedByRefEmployeeId"=${ChangedLog.AddedByRefEmployeeId},
            "LastEditedOn"='${currentDateString}'
          WHERE "CoreTransactionDetailId" > ${ChangedLog.CoreTransactionDetailId} AND ("FromAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId})
          OR "ToAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId}));

          update dbo."RefEntityAccount"
          SET "CurrentBalance" =
            CASE WHEN "RefEntityAccountId" = ${fromAccount.RefEntityAccountId} THEN "CurrentBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance}
            WHEN "RefEntityAccountId" = ${toAccount.RefEntityAccountId} THEN "CurrentBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
            END,
          "LastEditedByRefEmployeeId"=${ChangedLog.AddedByRefEmployeeId},
          "LastEditedOn"='${currentDateString}'
          WHERE "RefEntityAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId});

          UPDATE dbo."CoreCustomerTransactionsChangeLogActionable"
          SET "StatusUpdatedByCustomer" = 1
          WHERE "CoreCustomerTransactionsChangeLogActionableId" = ${CoreCustomerTransactionsChangeLogActionableId}
        `;
        console.log(sqlToUpdate);
        await postgre.query(sqlToUpdate);

        res.json({
          isError: false,
          msg: `Changes Approved. Transaction Updated Successfully.`,
          data: {},
        });
      } else {
        await postgre.query(`
          UPDATE dbo."CoreCustomerTransactionsChangeLogActionable"
          SET "StatusUpdatedByCustomer" = -1
          WHERE "CoreCustomerTransactionsChangeLogActionableId" = ${CoreCustomerTransactionsChangeLogActionableId}
        `);

        res.json({
          isError: false,
          msg: `Changes Rejected.`,
          data: {},
        });
      }
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = CustomerTransactionChangeLog;
