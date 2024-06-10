const postgre = require("../database");
const PDFDocument = require("pdfkit");

const formattedDate = (d) => {
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()]
    .map((n) => (n < 10 ? `0${n}` : `${n}`))
    .join("/");
};

const GeneratePdfController = {
  getCustomerTransactionsPdf: async (req, res) => {
    try {
      const { fromDate, toDate } = req.body;
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
      tran."Amount",
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
          t_Id: t.CoreTransactionDetailId,
          "Deposit Date": formattedDate(new Date(t.DepositDate)),
          Type: t.fromaccountid == CustomerAccountId ? "Debit" : "Credit",
          "Party Name":
            t.fromaccountid == CustomerAccountId
              ? nameDetails.get(t.toaccountid).entityname
              : nameDetails.get(t.fromaccountid).entityname,
          Amount: t.Amount,
          "Closing Balance": t.UpdatedBalance,
          // AddedOn: formattedDate(new Date(t.AddedOn)),
        });
      });

      const doc = new PDFDocument({ layout: "landscape" });
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res
          .writeHead(200, {
            "Content-Length": Buffer.byteLength(pdfData),
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment;filename=TransactionData.pdf",
          })
          .end(pdfData);
      });

      doc
        .fontSize(12)
        .text(
          `${nameDetails.get(CustomerAccountId).entityname}'s Transaction Data from ${formattedDate(new Date(fromDate))} to ${formattedDate(new Date(toDate))}`,
          { align: "center" },
        );
      doc.moveDown();

      if (FinalTransactions.length == 0) {
        doc
          .fontSize(12)
          .text(`No Transactions available !`, { align: "center" });
        doc.moveDown();
      } else {
        const tableTop = 100;
        const columnWidth = 116;
        const rowHeight = 30;
        const cellPadding = 5;
        const tableX = 50;
        let tableY = tableTop;

        const table = {
          headers: Object.keys(FinalTransactions[0]),
          rows: FinalTransactions.map((item) => Object.values(item)),
        };

        doc.fontSize(11);
        doc.fill("grey");
        doc.font("Courier-Bold");

        // Draw table headers
        table.headers = Object.keys(FinalTransactions[0]);
        table.headers.forEach((header, i) => {
          const x = tableX + i * columnWidth;
          doc.rect(x, tableY, columnWidth, rowHeight).stroke();
          doc.text(header, x + cellPadding, tableY + cellPadding);
        });

        doc.fontSize(10);
        doc.fill("black");
        doc.font("Courier");

        // Draw table rows
        table.rows = FinalTransactions.map((item) => Object.values(item));
        table.rows.forEach((row, rowIndex) => {
          tableY = tableTop + rowHeight * (rowIndex + 1);
          row.forEach((cell, i) => {
            const x = tableX + i * columnWidth;
            doc.rect(x, tableY, columnWidth, rowHeight).stroke();
            doc.text(cell, x + cellPadding, tableY + cellPadding);
          });
        });
      }

      doc.end();
    } catch (error) {
      console.log(error);
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getLedgerTransactionsPdf: async (req, res) => {
    try {
      var { fromDate, toDate, EntityTypeId, EntityId } = req.body;

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
          t_Id: t.CoreTransactionDetailId,
          "Deposit Date": formattedDate(new Date(t.DepositDate)),
          Type:
            t.fromaccountid == AccountId.rows[0].RefEntityAccountId
              ? "Debit"
              : "Credit",
          "Party Name":
            t.fromaccountid == AccountId.rows[0].RefEntityAccountId
              ? nameDetails.get(t.toaccountid).entityname
              : nameDetails.get(t.fromaccountid).entityname,
          Amount: t.Amount,
          "Closing Blance": t.UpdatedBalance,
        });
      });

      const doc = new PDFDocument({ layout: "landscape" });
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res
          .writeHead(200, {
            "Content-Length": Buffer.byteLength(pdfData),
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Ledger_${nameDetails.get(AccountId.rows[0].RefEntityAccountId).Code}_${nameDetails.get(AccountId.rows[0].RefEntityAccountId).entityname}_${formattedDate(new Date(fromDate))}_${formattedDate(new Date(toDate))}_.pdf"`,
          })
          .end(pdfData);
      });

      doc
        .fontSize(12)
        .text(
          `${nameDetails.get(AccountId.rows[0].RefEntityAccountId).entityname}'s Transaction Data from ${formattedDate(new Date(fromDate))} to ${formattedDate(new Date(toDate))}`,
          { align: "center" },
        );
      doc.moveDown();

      if (FinalTransactions.length == 0) {
        doc
          .fontSize(12)
          .text(`No Transactions available !`, { align: "center" });
        doc.moveDown();
      } else {
        const tableTop = 100;
        const columnWidth = 116;
        const rowHeight = 30;
        const cellPadding = 5;
        const tableX = 50;
        let tableY = tableTop;

        const table = {
          headers: Object.keys(FinalTransactions[0]),
          rows: FinalTransactions.map((item) => Object.values(item)),
        };

        doc.fontSize(11);
        doc.fill("grey");
        doc.font("Courier-Bold");

        // Draw table headers
        table.headers = Object.keys(FinalTransactions[0]);
        table.headers.forEach((header, i) => {
          const x = tableX + i * columnWidth;
          doc.rect(x, tableY, columnWidth, rowHeight).stroke();
          doc.text(header, x + cellPadding, tableY + cellPadding);
        });

        doc.fontSize(10);
        doc.fill("black");
        doc.font("Courier");

        // Draw table rows
        table.rows = FinalTransactions.map((item) => Object.values(item));
        table.rows.forEach((row, rowIndex) => {
          tableY = tableTop + rowHeight * (rowIndex + 1);
          row.forEach((cell, i) => {
            const x = tableX + i * columnWidth;
            doc.rect(x, tableY, columnWidth, rowHeight).stroke();
            doc.text(cell, x + cellPadding, tableY + cellPadding);
          });
        });
      }

      doc.end();
    } catch (error) {
      console.log(error);
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = GeneratePdfController;
