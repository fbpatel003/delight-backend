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

      const EntityNameDetails = await EntityNameDetailsData();

      verifyDateRange(fromDate, toDate);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const sqlToGetTransactions = `
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
        FROM dbo."CoreTransactionDetail" tran
        INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
        LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
        WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
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
  getPendingDeliveriesMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      verifyDateRange(fromDate, toDate);

      const EntityNameDetails = await EntityNameDetailsData();

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

      const sqlToGetDeliveryTransactions = `
        SELECT
        tran."CoreDeliveryTransactionDetailId",
        tran."FromAccountId" AS FromAccountId,
        tran."ToAccountId" AS ToAccountId,
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
          DeliveryTransactions: DeliveryTransactions.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getAddTransactionData: async (req, res) => {
    try {
      const employee = req.session.employee;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

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

      const sqlToGetActiveCustomer = `
        SELECT
        "RefCRMCustomerId",
        "Name",
        "DefaultComissionProfileName",
        "CurrentBalance"
        FROM dbo."RefCRMCustomer"
        INNER JOIN dbo."RefEntityAccount" ON "RefCRMCustomerId" = "EntityId" AND "EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId}
        WHERE "IsActive" = true;
      `;
      const ActiveCustomers = await postgre.query(sqlToGetActiveCustomer);

      const sqlToGetActiveAgent = `
        SELECT
        "RefAgentId",
        "Name",
        "CurrentBalance"
        FROM dbo."RefAgent"
        INNER JOIN dbo."RefEntityAccount" ON "RefAgentId" = "EntityId" AND "EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId}
        WHERE "IsActive" = true;
      `;
      const ActiveAgents = await postgre.query(sqlToGetActiveAgent);

      const sqlToGetActiveBank = `
        SELECT
        "RefBankId",
        "Name",
        "CurrentBalance"
        FROM dbo."RefBank"
        INNER JOIN dbo."RefEntityAccount" ON "RefBankId" = "EntityId" AND "EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId}
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

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          ActiveCustomers: ActiveCustomers.rows,
          ActiveAgents: ActiveAgents.rows,
          ActiveBanks: ActiveBanks.rows,
          ActiveDeliveryEmployee: ActiveDeliveryEmployee.rows,
          ComissionProfiles: ComissionProfiles.rows,
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
        DepositDate,
        BranchCode,
        BranchName,
        UTRNumber,
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
        typeof Rupees10 != "number" ||
        typeof isDelivery != "boolean"
      )
        throw "Invalid data";

      if (
        (Comission && typeof Comission != "number") ||
        (Charges && typeof Charges != "number")
      )
        throw "Invalid data";

      if (
        Amount <= 0 ||
        (Comission && Comission <= 0) ||
        (Charges && Charges <= 0)
      )
        throw "Invalid data";

      if (!DepositDate || isNaN(Date.parse(DepositDate)))
        throw `Invalid Deposit Date!`;

      var dateOfDeposit = new Date(DepositDate);
      // dateOfDeposit.setDate(dateOfDeposit.getDate());

      if (isDelivery && typeof DeliveryEmployeeId != "number")
        throw "Invalid Delivery Employee Id";

      if (fromEntityType == "Agent" && toEntityType == "Customer") {
        if (isDelivery && typeof DeliveryEmployeeId != "number")
          throw "Invalid Delivery Employee Id";
      } else {
        if (isDelivery) throw "Delivery not Available!";
      }

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

      if (!isDelivery) {
        if (
          UTRNumber &&
          typeof UTRNumber == "string" &&
          UTRNumber.trim() != ""
        ) {
          const sqlToCheckDuplicateUTR = `
            SELECT
            "CoreTransactionDetailId"
            FROM dbo."CoreTransactionDetail"
            WHERE "UTRNumber" = '${UTRNumber}'
            `;

          const DuplicateUTR = await postgre.query(sqlToCheckDuplicateUTR);

          if (DuplicateUTR.rows.length > 0)
            throw `UTR Number : ${UTRNumber} already exists in Transaction of t_id : ${DuplicateUTR.rows[0].CoreTransactionDetailId}`;
        }

        var updatedFromBalance = 0;
        var updatedToBalance = 0;
        var fromaccountid = 0;
        var toaccountid = 0;

        const comission = Comission ? Comission : 0;
        const charges = Charges ? Charges : 0;

        if (fromEntityType == "Customer" && toEntityType == "Bank") {
          const getFromAccount = await postgre.query(
            `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount" 
            WHERE "EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} AND "EntityId" = ${fromEntityId}`,
          );

          fromaccountid = getFromAccount.rows[0].RefEntityAccountId;
          updatedFromBalance =
            getFromAccount.rows[0].CurrentBalance - Amount + comission;

          const getToAccount = await postgre.query(
            `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount" 
            WHERE "EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId} AND "EntityId" = ${toEntityId}`,
          );

          toaccountid = getToAccount.rows[0].RefEntityAccountId;
          updatedToBalance =
            getToAccount.rows[0].CurrentBalance + Amount - charges;
        } else if (fromEntityType == "Bank" && toEntityType == "Agent") {
          const getFromAccount = await postgre.query(
            `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
            WHERE "EntityTypeRefEnumValueId" = ${bankTypeRefEnumValueId} AND "EntityId" = ${fromEntityId}`,
          );
          fromaccountid = getFromAccount.rows[0].RefEntityAccountId;
          updatedFromBalance = getFromAccount.rows[0].CurrentBalance - Amount;

          if (updatedFromBalance < 0)
            throw "Insufficient Balance In Bank Account";

          const getToAccount = await postgre.query(
            `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
            WHERE "EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} AND "EntityId" = ${toEntityId}`,
          );

          toaccountid = getToAccount.rows[0].RefEntityAccountId;
          updatedToBalance = getToAccount.rows[0].CurrentBalance + Amount;
        } else if (fromEntityType == "Agent" && toEntityType == "Customer") {
          const getFromAccount = await postgre.query(
            `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
            WHERE "EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} AND "EntityId" = ${fromEntityId}`,
          );
          fromaccountid = getFromAccount.rows[0].RefEntityAccountId;
          updatedFromBalance = getFromAccount.rows[0].CurrentBalance - Amount;

          const getToAccount = await postgre.query(
            `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
            WHERE "EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} AND "EntityId" = ${toEntityId}`,
          );

          toaccountid = getToAccount.rows[0].RefEntityAccountId;
          updatedToBalance = getToAccount.rows[0].CurrentBalance + Amount;
        }
        if (fromaccountid == 0 || toaccountid == 0) throw "Invalid Account Id";

        const sqlToAdd = `
        INSERT INTO dbo."CoreTransactionDetail"(
          "Amount", 
          "Comission", 
          "Charges", 
          "Notes", 
          "IsDelivery", 
          "AddedByRefEmployeeId", 
          "AddedOn", 
          "LastEditedByRefEmployeeId", 
          "LastEditedOn", 
          "FromEntityUpdatedBalance", 
          "ToEntityUpdatedBalance",
          "DepositDate",
          "FromAccountId",
          "ToAccountId",
          "UTRNumber",
          "BranchName",
          "BranchCode")
        VALUES (
          ${Amount},
          ${Comission && typeof Comission == "number" && Comission != 0 ? Comission : null},
          ${Charges && typeof Charges == "number" && Charges != 0 ? Charges : null},
          ${notes && typeof notes == "string" && notes.trim() != "" ? "'" + notes + "'" : null},
          false,
          ${employee.RefEmployeeId},
          now(),
          ${employee.RefEmployeeId},
          now(),
          ${updatedFromBalance},
          ${updatedToBalance},
          date(to_timestamp('${dateOfDeposit.toISOString()}','YYYY-MM-DDTHH24:MI:SS.MSZ')),
          ${fromaccountid},
          ${toaccountid},
          ${UTRNumber && typeof UTRNumber == "string" && UTRNumber.trim() != "" ? "'" + UTRNumber + "'" : null},
          ${BranchName && typeof BranchName == "string" && BranchName.trim() != "" ? "'" + BranchName + "'" : null},
          ${BranchCode && typeof BranchCode == "string" && BranchCode.trim() != "" ? "'" + BranchCode + "'" : null}
          );

          UPDATE dbo."RefEntityAccount"
          SET "CurrentBalance" = ${updatedFromBalance},
            "LastEditedByRefEmployeeId" = ${employee.RefEmployeeId},
            "LastEditedOn" = now()
          WHERE "RefEntityAccountId" = ${fromaccountid};

          UPDATE dbo."RefEntityAccount"
          SET "CurrentBalance" = ${updatedToBalance},
            "LastEditedByRefEmployeeId" = ${employee.RefEmployeeId},
            "LastEditedOn" = now()
          WHERE "RefEntityAccountId" = ${toaccountid};
        `;

        await postgre.query(sqlToAdd);
      } else {
        var fromaccountid = 0;
        var toaccountid = 0;
        const getFromAccount = await postgre.query(
          `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
          WHERE "EntityTypeRefEnumValueId" = ${agentTypeRefEnumValueId} AND "EntityId" = ${fromEntityId}`,
        );
        fromaccountid = getFromAccount.rows[0].RefEntityAccountId;

        const getToAccount = await postgre.query(
          `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
          WHERE "EntityTypeRefEnumValueId" = ${customerTypeRefEnumValueId} AND "EntityId" = ${toEntityId}`,
        );

        toaccountid = getToAccount.rows[0].RefEntityAccountId;

        const sql = `
          INSERT INTO dbo."CoreDeliveryTransactionDetail"(
            "Amount", 
            "Notes", 
            "DeliveryRefEmployeeId", 
            "500RupeesNotes", 
            "200RupeesNotes", 
            "100RupeesNotes", 
            "50RupeesNotes", 
            "20RupeesNotes", 
            "10RupeesNotes", 
            "AddedByRefEmployeeId", 
            "AddedOn", 
            "LastEditedByRefEmployeeId", 
            "LastEditedOn", 
            "DepositDate", 
            "FromAccountId", 
            "ToAccountId")
            VALUES (
            ${Amount},
            ${notes && typeof notes == "string" && notes.trim() != "" ? "'" + notes + "'" : null},
            ${DeliveryEmployeeId},
            ${Rupees500},
            ${Rupees200},
            ${Rupees100},
            ${Rupees50},
            ${Rupees20},
            ${Rupees10},
            ${employee.RefEmployeeId},
            now(),
            ${employee.RefEmployeeId},
            now(),
            date(to_timestamp('${dateOfDeposit.toISOString()}','YYYY-MM-DDTHH24:MI:SS.MSZ')),
            ${fromaccountid},
            ${toaccountid}
            );
        `;
        await postgre.query(sql);
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

      verifyDateRange(fromDate, toDate);

      const sqlToGetTransactions = `
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
        FROM dbo."CoreTransactionDetail" tran
        INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
        INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
        LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
        WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}'
        ORDER BY tran."CoreTransactionDetailId" DESC;
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
  getDeliveryTransactionDataByDate: async (req, res) => {
    try {
      const employee = req.session.employee;
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      verifyDateRange(fromDate, toDate);

      const sqlToGetDeliveryTransactions = `
      SELECT
      tran."CoreDeliveryTransactionDetailId",
      tran."FromAccountId" AS FromAccountId,
      tran."ToAccountId" AS ToAccountId,
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
          DeliveryTransactions: DeliveryTransactions.rows,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getTransactionDetailById: async (req, res) => {
    try {
      const transactionId = req.body.transactionId;

      const sqlToGetTransactions = `
SELECT
tran."CoreTransactionDetailId",
tran."FromAccountId" AS FromAccountId,
tran."ToAccountId" AS ToAccountId,
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
tran."ToEntityUpdatedBalance",
tran."DepositDate",
tran."UTRNumber",
tran."BranchCode",
tran."BranchName"
FROM dbo."CoreTransactionDetail" tran
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

      if (employee.permissions.some((x) => x.Code == "CanSeePendingDelivery")) {
        const EntityNameDetails = await EntityNameDetailsData();

        const nameDetails = new Map();
        EntityNameDetails.rows.forEach((t) => {
          nameDetails.set(t.RefEntityAccountId, t);
        });

        const sqlToGetTransactions = `
  SELECT
  tran."CoreDeliveryTransactionDetailId",
  tran."FromAccountId" AS FromAccountId,
  tran."ToAccountId" AS ToAccountId,
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
      } else {
        res.json({
          isError: true,
          msg: "You don't have permission to see this data!",
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDeliveryTransactionsByDeliveryEmployeeId: async (req, res) => {
    try {
      const employee = req.session.employee;
      const employeeId = employee.RefEmployeeId;
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      verifyDateRange(fromDate, toDate);

      if (
        employee.permissions.some((x) => x.Code == "CanSeeCompletedDelivery")
      ) {
        const EntityNameDetails = await EntityNameDetailsData();

        const nameDetails = new Map();
        EntityNameDetails.rows.forEach((t) => {
          nameDetails.set(t.RefEntityAccountId, t);
        });

        const sqlToGetTransactions = `
  SELECT
  tran."CoreTransactionDetailId",
  tran."FromAccountId" AS FromAccountId,
  tran."ToAccountId" AS ToAccountId,
  tran."Amount",
  tran."Comission",
  tran."Charges",
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
  FROM dbo."CoreTransactionDetail" tran
  INNER JOIN dbo."RefEmployee" added ON added."RefEmployeeId" = tran."AddedByRefEmployeeId"
  INNER JOIN dbo."RefEmployee" edited ON edited."RefEmployeeId" = tran."LastEditedByRefEmployeeId"
  WHERE date(tran."AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' AND tran."DeliveryRefEmployeeId" = ${employeeId}
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
      } else {
        res.json({
          isError: true,
          msg: "You don't have permission to see this data!",
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  acceptPendingDeliveryFromDeliveryEmployee: async (req, res) => {
    try {
      const notes = req.body.notes;
      const transactionId = req.body.transactionId;
      const employee = req.session.employee;
      const rupeeNotes = req.body.rupeeNotes;

      if (!rupeeNotes) throw "Please enter rupee notes";

      const { rupees500, rupees200, rupees100, rupees50, rupees20, rupees10 } =
        rupeeNotes;

      const sqlToGetTransaction = `
        SELECT
          "CoreDeliveryTransactionDetailId",
          "FromAccountId",
          "ToAccountId",
          "AcceptedByCustomer",
          "Amount"
        FROM dbo."CoreDeliveryTransactionDetail"
        WHERE "CoreDeliveryTransactionDetailId" = ${transactionId};
        `;

      const Transactions = await postgre.query(sqlToGetTransaction);
      if (Transactions.rows == 0) throw "Invalid Transaction Id";

      if (
        Math.abs(
          Transactions.rows[0].Amount -
            (rupees500 * 500 +
              rupees200 * 200 +
              rupees100 * 100 +
              rupees50 * 50 +
              rupees20 * 20 +
              rupees10 * 10),
        ) >= 10
      )
        throw "Invalid Number of notes";

      const getAccounts = await postgre.query(
        `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
        WHERE "RefEntityAccountId" IN (${Transactions.rows[0].FromAccountId},${Transactions.rows[0].ToAccountId})`,
      );

      var updatedFromBalance =
        getAccounts.rows.find(
          (x) => x.RefEntityAccountId == Transactions.rows[0].FromAccountId,
        ).CurrentBalance - Transactions.rows[0].Amount;

      var updatedToBalance =
        getAccounts.rows.find(
          (x) => x.RefEntityAccountId == Transactions.rows[0].ToAccountId,
        ).CurrentBalance + Transactions.rows[0].Amount;

      if (Transactions.rows[0].AcceptedByCustomer) {
        const sqlToTransferTransaction = `
        INSERT INTO dbo."CoreTransactionDetail"(
          "Amount", 
          "Notes", 
          "IsDelivery", 
          "DeliveryRefEmployeeId", 
          "AcceptedByCustomer", 
          "CustomerNotes", 
          "AcceptedByEmployee", 
          "EmployeeNotes", 
          "500RupeesNotes", 
          "200RupeesNotes", 
          "100RupeesNotes", 
          "50RupeesNotes", 
          "20RupeesNotes", 
          "10RupeesNotes", 
          "AddedByRefEmployeeId", 
          "AddedOn", 
          "LastEditedByRefEmployeeId", 
          "LastEditedOn", 
          "FromEntityUpdatedBalance", 
          "ToEntityUpdatedBalance", 
          "DepositDate", 
          "CoreDeliveryTransactionDetailId", 
          "FromAccountId", 
          "ToAccountId"
          )
          SELECT
          "Amount",
          "Notes",
          true,
          "DeliveryRefEmployeeId", 
          true, 
          "CustomerNotes", 
          true, 
          ${notes && typeof notes == "string" && notes.trim() != "" ? "'" + notes + "'" : null}, 
          ${rupees500},
          ${rupees200},
          ${rupees100},
          ${rupees50},
          ${rupees20},
          ${rupees10},
          "AddedByRefEmployeeId", 
          now(), 
          "LastEditedByRefEmployeeId", 
          now(), 
          ${updatedFromBalance}, 
          ${updatedToBalance}, 
          "DepositDate", 
          "CoreDeliveryTransactionDetailId", 
          "FromAccountId", 
          "ToAccountId"
          FROM dbo."CoreDeliveryTransactionDetail"
          WHERE "CoreDeliveryTransactionDetailId" = ${Transactions.rows[0].CoreDeliveryTransactionDetailId};

          UPDATE dbo."RefEntityAccount"
          SET "CurrentBalance" = ${updatedFromBalance},
          "LastEditedByRefEmployeeId" = ${employee.RefEmployeeId},
          "LastEditedOn" = now()
          WHERE "RefEntityAccountId" = ${Transactions.rows[0].FromAccountId};
    
          UPDATE dbo."RefEntityAccount"
          SET "CurrentBalance" = ${updatedToBalance},
          "LastEditedByRefEmployeeId" = ${employee.RefEmployeeId},
          "LastEditedOn" = now()
          WHERE "RefEntityAccountId" = ${Transactions.rows[0].ToAccountId};

          DELETE FROM dbo."CoreDeliveryTransactionDetail"
          WHERE "CoreDeliveryTransactionDetailId" = ${Transactions.rows[0].CoreDeliveryTransactionDetailId};
          `;

        await postgre.query(sqlToTransferTransaction);

        res.json({
          isError: false,
          msg: "Delivery Completed Successfully.",
          data: {},
        });
      } else {
        const sqlToUpdateTransaction = `
          UPDATE dbo."CoreDeliveryTransactionDetail"
          SET "AcceptedByEmployee" = true,
          "500RupeesNotes" = ${rupees500},
          "200RupeesNotes" = ${rupees200},
          "100RupeesNotes" = ${rupees100},
          "50RupeesNotes" = ${rupees50},
          "20RupeesNotes" = ${rupees20},
          "10RupeesNotes" = ${rupees10},
          "EmployeeNotes" = ${notes && notes.trim() != "" ? "'" + notes + "'" : null}
          WHERE "CoreDeliveryTransactionDetailId" = ${transactionId}
          `;
        await postgre.query(sqlToUpdateTransaction);
        res.json({
          isError: false,
          msg: "Updated successfully, Delivery Pending!",
          data: {},
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getCustomerTransactionData: async (req, res) => {
    try {
      const customer = req.session.customer;
      const RefCRMCustomerId = customer.RefCRMCustomerId;
      const fromDate = req.body.fromDate;
      const toDate = req.body.toDate;
      verifyDateRange(fromDate, toDate);

      const EntityNameDetails =
        await CustomerEntityNameDetailsData(RefCRMCustomerId);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

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

      const CustomerAccountId = EntityNameDetails.rows.find(
        (t) => t.Code == "Customer" && t.EntityId == RefCRMCustomerId,
      ).RefEntityAccountId;

      const sqlToGetTransactions = `
  WITH ids AS (
	SELECT
	"CoreTransactionDetailId"
	FROM dbo."CoreTransactionDetail"
	WHERE date("AddedOn") BETWEEN '${new Date(fromDate).toISOString().substring(0, 10)}' AND '${new Date(toDate).toISOString().substring(0, 10)}' AND ("FromAccountId" = ${CustomerAccountId} OR "ToAccountId" = ${CustomerAccountId})
  )
  SELECT
  tran."CoreTransactionDetailId",
  tran."FromAccountId" AS fromaccountid,
  tran."ToAccountId" AS toaccountid,
  tran."Amount" - coalesce(tran."Comission",0) AS "Amount",
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
  CASE WHEN tran."FromAccountId" = ${CustomerAccountId} THEn tran."FromEntityUpdatedBalance" ELSE tran."ToEntityUpdatedBalance" END AS "UpdatedBalance"
  FROM ids idss
  INNER JOIN dbo."CoreTransactionDetail" tran ON tran."CoreTransactionDetailId" = idss."CoreTransactionDetailId"
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
          CustomerAccountId: CustomerAccountId,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getCustomerDeliveryTransactionData: async (req, res) => {
    try {
      const customer = req.session.customer;
      const RefCRMCustomerId = customer.RefCRMCustomerId;

      const EntityNameDetails =
        await CustomerEntityNameDetailsData(RefCRMCustomerId);

      const nameDetails = new Map();
      EntityNameDetails.rows.forEach((t) => {
        nameDetails.set(t.RefEntityAccountId, t);
      });

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

      const CustomerAccountId = EntityNameDetails.rows.find(
        (t) => t.Code == "Customer" && t.EntityId == RefCRMCustomerId,
      ).RefEntityAccountId;

      const sqlToGetTransactions = `
  WITH ids AS (
  SELECT
  "CoreDeliveryTransactionDetailId"
  FROM dbo."CoreDeliveryTransactionDetail"
  WHERE ("FromAccountId" = ${CustomerAccountId} OR "ToAccountId" = ${CustomerAccountId}) 
  )
  SELECT
  tran."CoreDeliveryTransactionDetailId",
  tran."FromAccountId" AS fromaccountid,
  tran."ToAccountId" AS toaccountid,
  tran."Amount" + coalesce(tran."Comission",0) + coalesce(tran."Charges",0) AS "Amount",
  CASE WHEN ${permissionToSeeComission} THEN tran."Comission" ELSE null END AS "Comission",
  CASE WHEN ${permissionToSeeCharges} THEN tran."Charges" ELSE null END AS "Charges",
  CASE WHEN ${permissionToSeeNotes} THEN tran."Notes" ELSE null END AS "Notes",
  deli."Name" AS deliveryemployeename,
  tran."CustomerNotes",
  CASE WHEN ${permissionToSeeEmployeeNotes} THEN tran."EmployeeNotes" ELSE null END AS "EmployeeNotes",
  tran."AcceptedByCustomer",
  tran."AcceptedByEmployee",
  tran."500RupeesNotes" AS rupees500notes,
  tran."200RupeesNotes" AS rupees200notes,
  tran."100RupeesNotes" AS rupees100notes,
  tran."50RupeesNotes" AS rupees50notes,
  tran."20RupeesNotes" AS rupees20notes,
  tran."10RupeesNotes" AS rupees10notes,
  tran."AddedOn"
  FROM ids idss
  INNER JOIN dbo."CoreDeliveryTransactionDetail" tran ON tran."CoreDeliveryTransactionDetailId" = idss."CoreDeliveryTransactionDetailId"
  LEFT JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
  ORDER BY tran."CoreDeliveryTransactionDetailId" DESC;
            `;

      const Transactions = await postgre.query(sqlToGetTransactions);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          Transactions: Transactions.rows,
          NameDetailsArray: Array.from(nameDetails.entries()),
          CustomerAccountId: CustomerAccountId,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  acceptPendingDeliveryFromCustomer: async (req, res) => {
    try {
      const notes = req.body.notes;
      const transactionId = req.body.transactionId;

      const sqlToGetTransaction = `
        SELECT
          "CoreDeliveryTransactionDetailId",
          "FromAccountId",
          "ToAccountId",
          "AcceptedByEmployee",
          "Amount",
          "AddedByRefEmployeeId"
        FROM dbo."CoreDeliveryTransactionDetail"
        WHERE "CoreDeliveryTransactionDetailId" = ${transactionId};
        `;

      const Transactions = await postgre.query(sqlToGetTransaction);
      if (Transactions.rows == 0) throw "Invalid Transaction Id";

      const getAccounts = await postgre.query(
        `SELECT "RefEntityAccountId", "CurrentBalance" FROM dbo."RefEntityAccount"
        WHERE "RefEntityAccountId" IN (${Transactions.rows[0].FromAccountId},${Transactions.rows[0].ToAccountId})`,
      );

      var updatedFromBalance =
        getAccounts.rows.find(
          (x) => x.RefEntityAccountId == Transactions.rows[0].FromAccountId,
        ).CurrentBalance - Transactions.rows[0].Amount;

      var updatedToBalance =
        getAccounts.rows.find(
          (x) => x.RefEntityAccountId == Transactions.rows[0].ToAccountId,
        ).CurrentBalance + Transactions.rows[0].Amount;

      if (Transactions.rows[0].AcceptedByEmployee) {
        const sqlToTransferTransaction = `
        INSERT INTO dbo."CoreTransactionDetail"(
          "Amount", 
          "Notes", 
          "IsDelivery", 
          "DeliveryRefEmployeeId", 
          "AcceptedByCustomer", 
          "CustomerNotes", 
          "AcceptedByEmployee", 
          "EmployeeNotes", 
          "500RupeesNotes", 
          "200RupeesNotes", 
          "100RupeesNotes", 
          "50RupeesNotes", 
          "20RupeesNotes", 
          "10RupeesNotes", 
          "AddedByRefEmployeeId", 
          "AddedOn", 
          "LastEditedByRefEmployeeId", 
          "LastEditedOn", 
          "FromEntityUpdatedBalance", 
          "ToEntityUpdatedBalance", 
          "DepositDate", 
          "CoreDeliveryTransactionDetailId", 
          "FromAccountId", 
          "ToAccountId"
          )
          SELECT
          "Amount",
          "Notes",
          true,
          "DeliveryRefEmployeeId", 
          true, 
          ${notes && typeof notes == "string" && notes.trim() != "" ? "'" + notes + "'" : null}, 
          true, 
          "EmployeeNotes", 
          "500RupeesNotes", 
          "200RupeesNotes", 
          "100RupeesNotes", 
          "50RupeesNotes", 
          "20RupeesNotes", 
          "10RupeesNotes", 
          "AddedByRefEmployeeId", 
          now(), 
          "LastEditedByRefEmployeeId", 
          now(), 
          ${updatedFromBalance}, 
          ${updatedToBalance}, 
          "DepositDate", 
          "CoreDeliveryTransactionDetailId", 
          "FromAccountId", 
          "ToAccountId"
          FROM dbo."CoreDeliveryTransactionDetail"
          WHERE "CoreDeliveryTransactionDetailId" = ${Transactions.rows[0].CoreDeliveryTransactionDetailId};

          UPDATE dbo."RefEntityAccount"
          SET "CurrentBalance" = ${updatedFromBalance},
          "LastEditedByRefEmployeeId" = ${Transactions.rows[0].AddedByRefEmployeeId},
          "LastEditedOn" = now()
          WHERE "RefEntityAccountId" = ${Transactions.rows[0].FromAccountId};

          UPDATE dbo."RefEntityAccount"
          SET "CurrentBalance" = ${updatedToBalance},
          "LastEditedByRefEmployeeId" = ${Transactions.rows[0].AddedByRefEmployeeId},
          "LastEditedOn" = now()
          WHERE "RefEntityAccountId" = ${Transactions.rows[0].ToAccountId};

          DELETE FROM dbo."CoreDeliveryTransactionDetail"
          WHERE "CoreDeliveryTransactionDetailId" = ${Transactions.rows[0].CoreDeliveryTransactionDetailId};
          `;

        await postgre.query(sqlToTransferTransaction);
        res.json({
          isError: false,
          msg: "Delivery Completed Successfully.",
          data: {},
        });
      } else {
        const sqlToUpdateTransaction = `
          UPDATE dbo."CoreDeliveryTransactionDetail"
          SET "AcceptedByCustomer" = true,
          "CustomerNotes" = ${notes && notes.trim() != "" ? "'" + notes + "'" : null}
          WHERE "CoreDeliveryTransactionDetailId" = ${transactionId}
          `;
        await postgre.query(sqlToUpdateTransaction);
        res.json({
          isError: false,
          msg: "Updated successfully, Delivery Pending!",
          data: {},
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getDeliveryTransactionDetailById: async (req, res) => {
    try {
      const transactionId = req.body.transactionId;

      const sqlToGetTransactions = `
  SELECT
  tran."CoreDeliveryTransactionDetailId",
  tran."Amount",
  tran."Comission",
  tran."Charges",
  tran."Notes",
  tran."CustomerNotes",
  tran."EmployeeNotes",
  tran."500RupeesNotes" AS rupees500,
  tran."200RupeesNotes" AS rupees200,
  tran."100RupeesNotes" AS rupees100,
  tran."50RupeesNotes" AS rupees50,
  tran."20RupeesNotes" AS rupees20,
  tran."10RupeesNotes" AS rupees10,
  deli."Name" AS DeliveryEmployeeName,
  tran."DepositDate"
  FROM dbo."CoreDeliveryTransactionDetail" tran
  INNER JOIN dbo."RefEmployee" deli ON deli."RefEmployeeId" = tran."DeliveryRefEmployeeId"
  WHERE tran."CoreDeliveryTransactionDetailId" = ${transactionId};
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
  updateDeliveryTransaction: async (req, res) => {
    try {
      const employee = req.session.employee;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      const permissionToUpdateDeliveryTransaction = employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") &&
          obj.Code === "CanEditPendingDeliveryTransaction",
      );

      if (!permissionToUpdateDeliveryTransaction)
        throw "Invalid Employee to access";

      const {
        CoreDeliveryTransactionDetailId,
        Amount,
        Comission,
        Charges,
        Notes,
        rupees500,
        rupees200,
        rupees100,
        rupees50,
        rupees20,
        rupees10,
        DepositDate,
      } = req.body;

      if (
        typeof Amount != "number" ||
        typeof rupees500 != "number" ||
        typeof rupees200 != "number" ||
        typeof rupees100 != "number" ||
        typeof rupees50 != "number" ||
        typeof rupees20 != "number" ||
        typeof rupees10 != "number"
      )
        throw "Invalid data";

      if (!DepositDate || isNaN(Date.parse(DepositDate)))
        throw `Invalid Deposit Date!`;

      var dateOfDeposit = new Date(DepositDate);
      dateOfDeposit.setDate(dateOfDeposit.getDate() + 1);

      if (
        (rupees500 != 0 ||
          rupees200 != 0 ||
          rupees100 != 0 ||
          rupees50 != 0 ||
          rupees20 != 0 ||
          rupees10 != 0) &&
        Math.abs(
          rupees500 * 500 +
            rupees200 * 200 +
            rupees100 * 100 +
            rupees50 * 50 +
            rupees20 * 20 +
            rupees10 * 10 -
            Amount,
        ) >= 10
      )
        throw "Invalid Notes Count !";

      const sqlToCheckForUpdate = `
        SELECT
        "CoreDeliveryTransactionDetailId"
        FROM dbo."CoreDeliveryTransactionDetail"
        WHERE "CoreDeliveryTransactionDetailId" = ${CoreDeliveryTransactionDetailId}
          AND "Amount"=${Amount}
          ${Notes && typeof Notes == "string" && Notes.trim() != "" ? 'AND "Notes"=' + "'" + Notes + "'" : 'AND "Notes" IS NULL'}
          AND "500RupeesNotes"=${rupees500}
          AND "200RupeesNotes"=${rupees200}
          AND "100RupeesNotes"=${rupees100}
          AND "50RupeesNotes"=${rupees50}
          AND "20RupeesNotes"=${rupees20}
          AND "10RupeesNotes"=${rupees10}
          AND "DepositDate"=date(to_timestamp('${dateOfDeposit.toISOString()}','YYYY-MM-DDTHH24:MI:SS.MSZ'));
        `;

      const checkedResult = await postgre.query(sqlToCheckForUpdate);
      if (checkedResult.rowCount > 0) throw "Nothing to update in Transaction!";

      const sqlToUpdate = `
          UPDATE dbo."CoreDeliveryTransactionDetail"
            SET
            "Amount"=${Amount},
            "Comission"=${Comission && typeof Comission == "number" ? Comission : null},
            "Charges"=${Charges && typeof Charges == "number" ? Charges : null},
            "Notes"=${Notes && typeof Notes == "string" && Notes.trim() != "" ? "'" + Notes + "'" : null},
            "500RupeesNotes"=${rupees500},
            "200RupeesNotes"=${rupees200},
            "100RupeesNotes"=${rupees100},
            "50RupeesNotes"=${rupees50},
            "20RupeesNotes"=${rupees20},
            "10RupeesNotes"=${rupees10},
            "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
            "LastEditedOn"=now(),
            "DepositDate"=date('${dateOfDeposit.toISOString()}')
            WHERE "CoreDeliveryTransactionDetailId" = ${CoreDeliveryTransactionDetailId};
        `;
      await postgre.query(sqlToUpdate);

      res.json({
        isError: false,
        msg: "Transaction Updated Successfully",
        data: {},
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  deleteDeliveryTransaction: async (req, res) => {
    try {
      const employee = req.session.employee;
      if (
        employee.EmployeeType != "Admin" &&
        employee.EmployeeType != "ManagingEmployee"
      )
        throw "Invalid Employee to access";

      const permissionToUpdateDeliveryTransaction = employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") &&
          obj.Code === "CanDeletePendingDeliveryTransaction",
      );

      if (!permissionToUpdateDeliveryTransaction)
        throw "Invalid Employee to access";

      const transactionId = req.body.transactionId;

      const sqlToUpdate = `
          DELETE FROM dbo."CoreDeliveryTransactionDetail" WHERE "CoreDeliveryTransactionDetailId" = ${transactionId};
        `;
      await postgre.query(sqlToUpdate);

      res.json({
        isError: false,
        msg: "Transaction Deleted Successfully",
        data: {},
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  updateTransaction: async (req, res) => {
    try {
      const employee = req.session.employee;
      var {
        CoreTransactionDetailId,
        Amount,
        Comission,
        Charges,
        Notes,
        rupees500,
        rupees200,
        rupees100,
        rupees50,
        rupees20,
        rupees10,
        DepositDate,
        BranchName,
        BranchCode,
        UTRNumber,
      } = req.body;

      Comission = Comission && typeof Comission == "number" ? Comission : 0;
      Charges = Charges && typeof Charges == "number" ? Charges : 0;
      Notes =
        Notes && typeof Notes == "string" && Notes.trim() != "" ? Notes : "";
      rupees500 = rupees500 && typeof rupees500 == "number" ? rupees500 : 0;
      rupees200 = rupees200 && typeof rupees200 == "number" ? rupees200 : 0;
      rupees100 = rupees100 && typeof rupees100 == "number" ? rupees100 : 0;
      rupees50 = rupees50 && typeof rupees50 == "number" ? rupees50 : 0;
      rupees20 = rupees20 && typeof rupees20 == "number" ? rupees20 : 0;
      rupees10 = rupees10 && typeof rupees10 == "number" ? rupees10 : 0;
      BranchName =
        BranchName && typeof BranchName == "string" && BranchName.trim() != ""
          ? BranchName
          : "";
      BranchCode =
        BranchCode && typeof BranchCode == "string" && BranchCode.trim() != ""
          ? BranchCode
          : "";
      UTRNumber =
        UTRNumber && typeof UTRNumber == "string" && UTRNumber.trim() != ""
          ? UTRNumber
          : "";

      if (
        typeof Number(CoreTransactionDetailId) != "number" ||
        typeof Amount != "number"
      )
        throw "Invalid data";

      if (
        Amount <= 0 ||
        (Comission && Comission <= 0) ||
        (Charges && Charges <= 0)
      )
        throw "Invalid data";

      CoreTransactionDetailId = Number(CoreTransactionDetailId);

      if (!DepositDate || isNaN(Date.parse(DepositDate)))
        throw `Invalid Deposit Date!`;

      var dateOfDeposit = new Date(DepositDate);

      const permissionToUpdateDeliveryTransaction = employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") && obj.Code === "CanEditTransaction",
      );

      if (!permissionToUpdateDeliveryTransaction)
        throw "Employee does not have permission to update transaction";

      const sqlToFetchOldTransaction = `
      SELECT 
      "CoreTransactionDetailId",
      "FromAccountId",
      "ToAccountId",
      "Amount",
      coalesce("Comission",0) as "Comission",
      coalesce("Charges",0) as "Charges",
      coalesce("Notes",'') as "Notes",
      coalesce("500RupeesNotes",0) AS rupees500, 
      coalesce("200RupeesNotes",0) As rupees200, 
      coalesce("100RupeesNotes",0) AS rupees100, 
      coalesce("50RupeesNotes",0) AS rupees50, 
      coalesce("20RupeesNotes",0) AS rupees20, 
      coalesce("10RupeesNotes",0) AS rupees10,
      "IsDelivery",
      "DepositDate",
      coalesce("BranchName",'') as "BranchName",
      coalesce("BranchCode",'') as "BranchCode",
      coalesce("UTRNumber",'') as "UTRNumber"
      FROM dbo."CoreTransactionDetail" WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};`;

      const oldTransactionData = await postgre.query(sqlToFetchOldTransaction);

      if (oldTransactionData.rows.length == 0) throw "Invalid Transaction Id";

      const oldTransaction = oldTransactionData.rows[0];

      if (
        oldTransaction.Amount == Amount &&
        oldTransaction.Comission == Comission &&
        oldTransaction.Charges == Charges &&
        oldTransaction.rupees500 == rupees500 &&
        oldTransaction.rupees200 == rupees200 &&
        oldTransaction.rupees100 == rupees100 &&
        oldTransaction.rupees50 == rupees50 &&
        oldTransaction.rupees20 == rupees20 &&
        oldTransaction.rupees10 == rupees10 &&
        oldTransaction.Notes == Notes &&
        new Date(oldTransaction.DepositDate).toDateString() ==
          dateOfDeposit.toDateString() &&
        oldTransaction.BranchName == BranchName &&
        oldTransaction.BranchCode == BranchCode &&
        oldTransaction.UTRNumber == UTRNumber
      )
        throw "Nothing to update";

      if (
        oldTransaction.Amount != Amount ||
        oldTransaction.Comission != Comission ||
        oldTransaction.Charges != Charges ||
        oldTransaction.rupees500 != rupees500 ||
        oldTransaction.rupees200 != rupees200 ||
        oldTransaction.rupees100 != rupees100 ||
        oldTransaction.rupees50 != rupees50 ||
        oldTransaction.rupees20 != rupees20 ||
        oldTransaction.rupees10 != rupees10
      ) {
        const accountsData = await postgre.query(`
          SELECT
            ac."RefEntityAccountId",
            ac."CurrentBalance",
            v."Code",
            ac."EntityId"
          FROM dbo."RefEntityAccount" ac
          INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
          WHERE "RefEntityAccountId" IN (${oldTransaction.FromAccountId},${oldTransaction.ToAccountId})
        `);

        const fromAccount = accountsData.rows.find(
          (x) => x.RefEntityAccountId == oldTransaction.FromAccountId,
        );
        const toAccount = accountsData.rows.find(
          (x) => x.RefEntityAccountId == oldTransaction.ToAccountId,
        );

        if (oldTransaction.IsDelivery) {
          if (
            Math.abs(
              rupees500 * 500 +
                rupees200 * 200 +
                rupees100 * 100 +
                rupees50 * 50 +
                rupees20 * 20 +
                rupees10 * 10 -
                Amount,
            ) >= 10
          )
            throw "Invalid Notes Count !";
        }

        if (fromAccount.Code == "Bank" && toAccount.Code == "Agent") {
          var oldFromFinalAmmountToDeduct = oldTransaction.Amount;
          var oldToFinalAmmountToAdd = oldTransaction.Amount;
          var newFromFinalAmmountToDeduct = Amount;
          var newToFinalAmountToAdd = Amount;

          var pieceToAddInFromBalance =
            newFromFinalAmmountToDeduct > oldFromFinalAmmountToDeduct
              ? oldFromFinalAmmountToDeduct - newFromFinalAmmountToDeduct
              : newFromFinalAmmountToDeduct - oldFromFinalAmmountToDeduct;

          var pieceToAddInToBalance =
            newToFinalAmountToAdd > oldToFinalAmmountToAdd
              ? newToFinalAmountToAdd - oldToFinalAmmountToAdd
              : oldToFinalAmmountToAdd - newToFinalAmountToAdd;

          if (Amount < oldTransaction.Amount) {
            pieceToAddInFromBalance = pieceToAddInFromBalance * -1;
            pieceToAddInToBalance = pieceToAddInToBalance * -1;
          }

          const currentDateString = new Date().toISOString();

          const sqlToUpdate = `
            UPDATE dbo."CoreTransactionDetail"
              SET
              "Amount"=${Amount},
              "Notes"=${Notes == "" ? null : "'" + Notes + "'"},
              "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
              "LastEditedOn"='${currentDateString}',
              "DepositDate"='${dateOfDeposit.toISOString()}',
              "UTRNumber" = ${UTRNumber == "" ? null : "'" + UTRNumber + "'"},
              "BranchName" = ${BranchName == "" ? null : "'" + BranchName + "'"},
              "BranchCode" = ${BranchCode == "" ? null : "'" + BranchCode + "'"},
              "FromEntityUpdatedBalance" = "FromEntityUpdatedBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance},
              "ToEntityUpdatedBalance" = "ToEntityUpdatedBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
              WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};

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
              "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
              "LastEditedOn"='${currentDateString}'
            WHERE "CoreTransactionDetailId" > ${CoreTransactionDetailId} AND ("FromAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId})
            OR "ToAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId}));

            update dbo."RefEntityAccount"
            SET "CurrentBalance" =
              CASE WHEN "RefEntityAccountId" = ${fromAccount.RefEntityAccountId} THEN "CurrentBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance}
              WHEN "RefEntityAccountId" = ${toAccount.RefEntityAccountId} THEN "CurrentBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
              END,
            "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
            "LastEditedOn"='${currentDateString}'
            WHERE "RefEntityAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId});
          `;
          await postgre.query(sqlToUpdate);

          res.json({
            isError: false,
            msg: "Transaction Updated Successfully",
            data: {},
          });
        } else {
          var otherThingsUpdated = false;
          if (
            oldTransaction.Notes != Notes ||
            new Date(oldTransaction.DepositDate).toDateString() !=
              dateOfDeposit.toDateString() ||
            oldTransaction.BranchName != BranchName ||
            oldTransaction.BranchCode != BranchCode ||
            oldTransaction.UTRNumber != UTRNumber
          )
            otherThingsUpdated = true;

          var sqlToUpdateOtherThings = "";

          if (otherThingsUpdated)
            sqlToUpdateOtherThings = `
            UPDATE dbo."CoreTransactionDetail"
            SET "Notes" = ${Notes == "" ? null : "'" + Notes + "'"},
            "DepositDate" = '${dateOfDeposit.toISOString()}',
            "BranchName" = ${BranchName == "" ? null : "'" + BranchName + "'"},
            "BranchCode" = ${BranchCode == "" ? null : "'" + BranchCode + "'"},
            "UTRNumber" = ${UTRNumber == "" ? null : "'" + UTRNumber + "'"},
            "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
            "LastEditedOn"=now()
            WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};
          `;

          const sqlToAddChangeLogAndUpdate = `
          INSERT INTO dbo."CoreCustomerTransactionsChangeLogActionable"(
            "CoreTransactionDetailId", 
            "FromAmount", 
            "ToAmount", 
            "FromComission", 
            "ToComission", 
            "FromCharges", 
            "ToCharges", 
            "From500RupeesNotes", 
            "To500RupeesNotes", 
            "From200RupeesNotes", 
            "To200RupeesNotes", 
            "From100RupeesNotes", 
            "To100RupeesNotes", 
            "From50RupeesNotes", 
            "To50RupeesNotes", 
            "From20RupeesNotes", 
            "To20RupeesNotes", 
            "From10RupeesNotes", 
            "To10RupeesNotes", 
            "RefCRMCustomerId", 
            "StatusUpdatedByCustomer", 
            "AddedByRefEmployeeId", 
            "AddedOn", 
            "LastEditedByRefEmployeeId", 
            "LastEditedOn")
            VALUES (
            ${CoreTransactionDetailId},
            ${oldTransaction.Amount},
            ${Amount},
            ${oldTransaction.Comission > 0 ? oldTransaction.Comission : null},
            ${Comission > 0 ? Comission : null},
            ${oldTransaction.Charges > 0 ? oldTransaction.Charges : null},
            ${Charges > 0 ? Charges : null},
            ${oldTransaction.rupees500 > 0 ? oldTransaction.rupees500 : null},
            ${rupees500 > 0 ? rupees500 : null},
            ${oldTransaction.rupees200 > 0 ? oldTransaction.rupees200 : null},
            ${rupees200 > 0 ? rupees200 : null},
            ${oldTransaction.rupees100 > 0 ? oldTransaction.rupees100 : null},
            ${rupees100 > 0 ? rupees100 : null},
            ${oldTransaction.rupees50 > 0 ? oldTransaction.rupees50 : null},
            ${rupees50 > 0 ? rupees50 : null},
            ${oldTransaction.rupees20 > 0 ? oldTransaction.rupees20 : null},
            ${rupees20 > 0 ? rupees20 : null},
            ${oldTransaction.rupees10 > 0 ? oldTransaction.rupees10 : null},
            ${rupees10 > 0 ? rupees10 : null},
            ${fromAccount.Code == "Customer" ? fromAccount.EntityId : toAccount.EntityId},
            0,
            ${employee.RefEmployeeId},
            now(),
            ${employee.RefEmployeeId},
            now()
            );

            ${otherThingsUpdated ? sqlToUpdateOtherThings : ""}
          `;
          await postgre.query(sqlToAddChangeLogAndUpdate);
          res.json({
            isError: false,
            sendWarning: true,
            msg: `Action Created To Update Transaction Amount.${otherThingsUpdated ? " Other Data Updated." : ""}`,
            data: {},
          });
        }
      } else {
        const sqlToUpdateTransaction = `
          UPDATE dbo."CoreTransactionDetail"
          SET "Notes" = ${Notes == "" ? null : "'" + Notes + "'"},
          "DepositDate" = '${dateOfDeposit.toISOString()}',
          "BranchName" = ${BranchName == "" ? null : "'" + BranchName + "'"},
          "BranchCode" = ${BranchCode == "" ? null : "'" + BranchCode + "'"},
          "UTRNumber" = ${UTRNumber == "" ? null : "'" + UTRNumber + "'"},
          "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
          "LastEditedOn"=now()
          WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};
          `;

        await postgre.query(sqlToUpdateTransaction);

        res.json({
          isError: false,
          msg: "Transaction Updated Successfully",
          data: {},
        });
      }
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  deleteTransaction: async (req, res) => {
    try {
      const employee = req.session.employee;
      const { transactionId } = req.body;

      if (typeof Number(transactionId) != "number") throw "Invalid data";

      const CoreTransactionDetailId = Number(transactionId);

      const permissionToDeleteDeliveryTransaction = employee.permissions.some(
        (obj) =>
          obj.hasOwnProperty("Code") && obj.Code === "CanDeleteTransaction",
      );

      if (!permissionToDeleteDeliveryTransaction)
        throw "Employee does not have permission to delete transaction";

      const sqlToFetchOldTransaction = `
      SELECT 
      "CoreTransactionDetailId",
      "FromAccountId",
      "ToAccountId",
      "Amount",
      coalesce("Comission",0) AS "Comission",
      coalesce("Charges",0) AS "Charges"
      FROM dbo."CoreTransactionDetail" WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};`;

      const oldTransactionData = await postgre.query(sqlToFetchOldTransaction);

      if (oldTransactionData.rows.length == 0) throw "Invalid Transaction Id";

      const oldTransaction = oldTransactionData.rows[0];

      const accountsData = await postgre.query(`
          SELECT
            ac."RefEntityAccountId",
            ac."CurrentBalance",
            v."Code",
            ac."EntityId"
          FROM dbo."RefEntityAccount" ac
          INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
          WHERE "RefEntityAccountId" IN (${oldTransaction.FromAccountId},${oldTransaction.ToAccountId})
        `);

      const fromAccount = accountsData.rows.find(
        (x) => x.RefEntityAccountId == oldTransaction.FromAccountId,
      );
      const toAccount = accountsData.rows.find(
        (x) => x.RefEntityAccountId == oldTransaction.ToAccountId,
      );

      var pieceToAddInFromBalance = 0;
      var pieceToAddInToBalance = 0;

      if (fromAccount.Code == "Customer" && toAccount.Code == "Bank") {
        pieceToAddInFromBalance =
          oldTransaction.Amount - oldTransaction.Comission;
        pieceToAddInToBalance =
          -1 * (oldTransaction.Amount - oldTransaction.Charges);
      } else {
        pieceToAddInFromBalance = oldTransaction.Amount;
        pieceToAddInToBalance = -1 * oldTransaction.Amount;
      }

      const currentDateString = new Date().toISOString();

      const sqlToUpdate = `
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
              "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
              "LastEditedOn"='${currentDateString}'
            WHERE "CoreTransactionDetailId" > ${CoreTransactionDetailId} AND ("FromAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId})
            OR "ToAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId}));

            update dbo."RefEntityAccount"
            SET "CurrentBalance" =
              CASE WHEN "RefEntityAccountId" = ${fromAccount.RefEntityAccountId} THEN "CurrentBalance" ${pieceToAddInFromBalance >= 0 ? "+ " + pieceToAddInFromBalance.toString() : pieceToAddInFromBalance}
              WHEN "RefEntityAccountId" = ${toAccount.RefEntityAccountId} THEN "CurrentBalance" ${pieceToAddInToBalance >= 0 ? "+ " + pieceToAddInToBalance.toString() : pieceToAddInToBalance}
              END,
            "LastEditedByRefEmployeeId"=${employee.RefEmployeeId},
            "LastEditedOn"='${currentDateString}'
            WHERE "RefEntityAccountId" IN (${fromAccount.RefEntityAccountId},${toAccount.RefEntityAccountId});

            DELETE FROM dbo."CoreCustomerTransactionsChangeLogActionable"
            WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};

            DELETE FROM dbo."CoreTransactionDetail"
            WHERE "CoreTransactionDetailId" = ${CoreTransactionDetailId};
          `;
      await postgre.query(sqlToUpdate);

      res.json({
        isError: false,
        msg: "Transaction Deleted Successfully",
        data: {},
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = TransactionController;
