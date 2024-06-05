const postgre = require("../database");
const ExcelJS = require("exceljs");

const formattedDate = (d) => {
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()]
    .map((n) => (n < 10 ? `0${n}` : `${n}`))
    .join("/");
};

const GenerateExcelController = {
  getCustomerTransactionsExcel: async (req, res) => {
    try {
      const { fromDate, toDate } = req.query;
      const customer = req.session.customer;
      const RefCRMCustomerId = customer.RefCRMCustomerId;

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

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const CustomerAccountId = EntityNameDetails.rows.find(
        (t) => t.Code == "Customer" && t.EntityId == RefCRMCustomerId,
      ).RefEntityAccountId;

      const permissionToSeeNotes = customer.permissions.some(
        (obj) => obj.Code === "CanSeeNotesAddedByTransactionCreator",
      );
      const permissionToSeeComission = customer.permissions.some(
        (obj) => obj.Code === "CanSeeAddedComissionInATransaction",
      );
      const permissionToSeeCharges = customer.permissions.some(
        (obj) => obj.Code === "CanSeeAddedChargesInATransaction",
      );
      const permissionToSeeEmployeeNotes = customer.permissions.some(
        (obj) => obj.Code === "Can SeeNotesAddedByDeliveingEmployee",
      );

      const sqlToGetTransactions = `
      WITH ids AS (
      SELECT
      "CoreTransactionDetailId"
      FROM dbo."CoreTransactionDetail"
      WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' AND ("FromAccountId" = ${CustomerAccountId} OR "ToAccountId" =${CustomerAccountId})
      ) 
      SELECT
      tran."CoreTransactionDetailId",
      tran."FromAccountId" AS fromaccountid,
      tran."ToAccountId" AS toaccountid,
      tran."Amount" + coalesce(tran."Comission",0) + coalesce(tran."Charges",0) AS "Amount",
      CASE WHEN ${permissionToSeeComission} THEN tran."Comission" ELSE null END AS "Comission",
      CASE WHEN ${permissionToSeeCharges} THEN tran."Charges" ELSE null END AS "Charges",
      CASE WHEN ${permissionToSeeNotes} THEN tran."Notes" ELSE null END AS "Notes",
      tran."IsDelivery",
      deli."Name" AS deliveryemployeename,
      tran."CustomerNotes",
      CASE WHEN ${permissionToSeeEmployeeNotes} THEN tran."EmployeeNotes" ELSE null END AS "EmployeeNotes",
      tran."500RupeesNotes" AS rupees500notes,
      tran."200RupeesNotes" AS rupees200notes,
      tran."100RupeesNotes" AS rupees100notes,
      tran."50RupeesNotes" AS rupees50notes,
      tran."20RupeesNotes" AS rupees20notes,
      tran."10RupeesNotes" AS rupees10notes,
      tran."AddedOn",
      CASE WHEN tran."FromAccountId" = ${CustomerAccountId} THEN tran."FromEntityUpdatedBalance" ELSE tran."ToEntityUpdatedBalance" END AS "UpdatedBalance",
      tran."DepositDate"
      FROM ids idss
      INNER JOIN dbo."CoreTransactionDetail" tran ON tran."CoreTransactionDetailId" = idss."CoreTransactionDetailId"
      LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
      ORDER BY tran."CoreTransactionDetailId" DESC;
              `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      const FinalTransactions = [];

      Transactions.rows.forEach((t) => {
        FinalTransactions.push({
          CoreTransactionDetailId: t.CoreTransactionDetailId,
          Action: t.fromaccountid == CustomerAccountId ? "Debit" : "Credit",
          PartyName:
            t.fromaccountid == CustomerAccountId
              ? nameDetails.get(t.toaccountid).entityname
              : nameDetails.get(t.fromaccountid).entityname,
          Amount: t.Amount,
          Comission: t.Comission,
          Charges: t.Charges,
          Notes: t.Notes,
          Delivery: t.IsDelivery ? "Yes" : "No",
          DeliveryEmployeeName: t.deliveryemployeename,
          CustomerNotes: t.CustomerNotes,
          EmployeeNotes: t.EmployeeNotes,
          Rupees500Notes: t.rupees500notes > 0 ? t.rupees500notes : "",
          Rupees200Notes: t.rupees200notes > 0 ? t.rupees200notes : "",
          Rupees100Notes: t.rupees100notes > 0 ? t.rupees100notes : "",
          Rupees50Notes: t.rupees50notes > 0 ? t.rupees50notes : "",
          Rupees20Notes: t.rupees20notes > 0 ? t.rupees20notes : "",
          Rupees10Notes: t.rupees10notes > 0 ? t.rupees10notes : "",
          UpdatedBalance: t.UpdatedBalance,
          AddedOn: formattedDate(new Date(t.AddedOn)),
          DepositDate: formattedDate(new Date(t.DepositDate)),
        });
      });
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Data");

      // Add columns
      columns = [
        { header: "t_Id", key: "CoreTransactionDetailId", width: 20 },
        { header: "Type", key: "Action", width: 20 },
        { header: "Party Name", key: "PartyName", width: 20 },
        { header: "Deposit Date", key: "DepositDate", width: 20 },
        { header: "Amount", key: "Amount", width: 20 },
        { header: "Comission", key: "Comission", width: 20 },
        { header: "Charges", key: "Charges", width: 20 },
        { header: "Closing Balance", key: "UpdatedBalance", width: 20 },
        { header: "Notes", key: "Notes", width: 20 },
        { header: "Delivery", key: "Delivery", width: 20 },
        {
          header: "Delivery Employee Name",
          key: "DeliveryEmployeeName",
          width: 20,
        },
        { header: "Customer Notes", key: "CustomerNotes", width: 20 },
        { header: "Employee Notes", key: "EmployeeNotes", width: 20 },
        { header: "500 Rupees Notes", key: "Rupees500Notes", width: 20 },
        { header: "200 Rupees Notes", key: "Rupees200Notes", width: 20 },
        { header: "100 Rupees Notes", key: "Rupees100Notes", width: 20 },
        { header: "50 Rupees Notes", key: "Rupees50Notes", width: 20 },
        { header: "20 Rupees Notes", key: "Rupees20Notes", width: 20 },
        { header: "10 Rupees Notes", key: "Rupees10Notes", width: 20 },
        { header: "Added On", key: "AddedOn", width: 20 },
      ];

      columns = columns.filter(
        (column) =>
          (permissionToSeeNotes || column.key !== "Notes") &&
          (permissionToSeeEmployeeNotes || column.key !== "EmployeeNotes") &&
          (permissionToSeeComission || column.key !== "Comission") &&
          (permissionToSeeCharges || column.key !== "Charges"),
      );

      worksheet.columns = columns;

      // Style the headers
      worksheet.columns.forEach((column) => {
        column.headerCell = worksheet.getRow(1).getCell(column.key);
        column.headerCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
        column.headerCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF808080" }, // Grey background
        };
        column.headerCell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });

      // Add rows
      worksheet.addRows(FinalTransactions);

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Set headers and send the buffer
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="TransactionData.xlsx"',
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.send(buffer);
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getEntityLedgerExcel: async (req, res) => {
    try {
      var { fromDate, toDate, EntityTypeId, EntityId } = req.query;

      if (!EntityId || !EntityTypeId || !fromDate || !toDate)
        throw new Error("Invalid Parameters");

      EntityId = Number(EntityId);
      EntityTypeId = Number(EntityTypeId);

      if (typeof EntityId !== "number" || typeof EntityTypeId !== "number")
        throw new Error("Invalid Parameters");

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

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

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

      const FinalTransactions = [];

      Transactions.rows.forEach((t) => {
        FinalTransactions.push({
          CoreTransactionDetailId: t.CoreTransactionDetailId,
          Action:
            t.fromaccountid == AccountId.rows[0].RefEntityAccountId
              ? "Debit"
              : "Credit",
          PartyName:
            t.fromaccountid == AccountId.rows[0].RefEntityAccountId
              ? nameDetails.get(t.toaccountid).entityname
              : nameDetails.get(t.fromaccountid).entityname,
          Amount: t.Amount,
          Comission: t.Comission,
          Charges: t.Charges,
          Notes: t.Notes,
          UpdatedBalance: t.UpdatedBalance,
          AddedOn: new Date(t.AddedOn),
          DepositDate: formattedDate(new Date(t.DepositDate)),
        });
      });
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Transaction Data");

      // Add columns
      columns = [
        { header: "t_Id", key: "CoreTransactionDetailId", width: 20 },
        { header: "Type", key: "Action", width: 20 },
        { header: "Party Name", key: "PartyName", width: 20 },
        { header: "Deposit Date", key: "DepositDate", width: 20 },
        { header: "Amount", key: "Amount", width: 20 },
        { header: "Comission", key: "Comission", width: 20 },
        { header: "Charges", key: "Charges", width: 20 },
        { header: "Closing Balance", key: "UpdatedBalance", width: 20 },
        { header: "Notes", key: "Notes", width: 20 },
        { header: "Added On", key: "AddedOn", width: 20 },
      ];

      worksheet.columns = columns;

      // Style the headers
      worksheet.columns.forEach((column) => {
        column.headerCell = worksheet.getRow(1).getCell(column.key);
        column.headerCell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
        column.headerCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF808080" }, // Grey background
        };
        column.headerCell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });

      // Add rows
      worksheet.addRows(FinalTransactions);

      // Write to buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Set headers and send the buffer
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Ledger_${nameDetails.get(AccountId.rows[0].RefEntityAccountId).Code}_${nameDetails.get(AccountId.rows[0].RefEntityAccountId).entityname}_${formattedDate(new Date(fromDate))}_${formattedDate(new Date(toDate))}_.xlsx"`,
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.send(buffer);
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = GenerateExcelController;
