const postgre = require("../database");

const TransactionController = {
  getTransactionMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;
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
        sqlToGetDeliveryEmployee
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
      const ComissionProfiles = await postgre.query(
        sqlToGetComissionProfiles
      );

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          ActiveCustomers: ActiveCustomers.rows,
          ActiveAgents: ActiveAgents.rows,
          ActiveBanks: ActiveBanks.rows,
          ActiveDeliveryEmployee: ActiveDeliveryEmployee.rows,
          ComissionProfiles: ComissionProfiles.rows
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = TransactionController;
