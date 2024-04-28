const postgre = require("../database");

const BankAndAgentController = {
  addNewBankOrAgent: async (req, res) => {
    try {
      const employee = req.session.employee;
      const RefEmployeeId = employee.RefEmployeeId;
      const name = req.body.name;
      const type = req.body.type;

      if (type !== "Bank" && type !== "Agent") throw `Invalid Type ${type}`;

      const permissionToAddBankOrAgent = employee.EmployeeType == "Admin";

      if (!permissionToAddBankOrAgent)
        throw `User is Unauthorized to add ${type}`;

      if (name == null || name.trim() == "") throw "Name can not be empty!";

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."Ref${type}" WHERE "Name" = '${name}'`;

      const { rows: row2 } = await postgre.query(sqlToCheckDuplicateLoginId);

      if (row2 != null && row2.length > 0)
        throw `${type} with Name ${name} already exists!`;

      const sqltoAdd = `
      INSERT INTO dbo."Ref${type}"(
        "Name", 
        "IsActive", 
        "AddedByRefEmployeeId", 
        "AddedOn", 
        "LastEditedByRefEmployeeId", 
        "LastEditedOn"
        )
        VALUES (
        '${name}',
        true,
        ${RefEmployeeId},
        now(),
        ${RefEmployeeId},
        now()
        );

        INSERT INTO dbo."RefEntityAccount"(
          "EntityTypeRefEnumValueId", 
          "EntityId", 
          "CurrentBalance", 
          "AddedByRefEmployeeId", 
          "AddedOn", 
          "LastEditedByRefEmployeeId", 
          "LastEditedOn"
          )
          VALUES (
          (SELECT "RefEnumValueId" FROM dbo."RefEnumValue" WHERE "EnumTypeName" = 'EntityType' AND "Code" = '${type}'),
          (SELECT "Ref${type}Id" FROM dbo."Ref${type}" WHERE "Name" = '${name}'),
          0.0,
          ${RefEmployeeId},
          now(),
          ${RefEmployeeId},
          now()
          );
      `;
      await postgre.query(sqltoAdd);

      res.json({
        isError: false,
        msg: `${type} : ${name} Added Successfully.`,
      });
      return;
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  getBankAndAgentMasterData: async (req, res) => {
    try {
      const employee = req.session.employee;

      const permissionToLoadBankOrAgent = employee.EmployeeType == "Admin";

      if (!permissionToLoadBankOrAgent) throw `User is Unauthorized!`;

      const sqltoGetBanks = `
        SELECT
        b."RefBankId",
        b."Name",
        b."IsActive",
        ac."CurrentBalance"
        FROM dbo."RefBank" b
        INNER JOIN dbo."RefEntityAccount" ac ON ac."EntityId" = b."RefBankId"
        INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
        WHERE v."EnumTypeName" = 'EntityType' AND v."Code" = 'Bank';
      `;
      const bankMasterData = await postgre.query(sqltoGetBanks);

      const sqltoGetAgents = `
      SELECT
      b."RefAgentId",
      b."Name",
      b."IsActive",
      ac."CurrentBalance"
      FROM dbo."RefAgent" b
      INNER JOIN dbo."RefEntityAccount" ac ON ac."EntityId" = b."RefAgentId"
      INNER JOIN dbo."RefEnumValue" v ON v."RefEnumValueId" = ac."EntityTypeRefEnumValueId"
      WHERE v."EnumTypeName" = 'EntityType' AND v."Code" = 'Agent';
      `;
      const agentMasterData = await postgre.query(sqltoGetAgents);

      res.json({
        isError: false,
        msg: "Data loaded successfully",
        data: {
          bankMasterData: bankMasterData.rows,
          agentMasterData: agentMasterData.rows,
        },
      });
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  updateBankOrAgentDetails: async (req, res) => {
    try {
      const UserRefEmployeeId = req.session.employee.RefEmployeeId;
      const name = req.body.name;
      const IsActive = req.body.IsActive;
      const type = req.body.type;
      const entityId = req.body.entityId;
      const employee = req.session.employee;

      if (type !== "Bank" && type !== "Agent")
        throw `Invalid Type ${type}`;

      const permissionToLoadBankOrAgent = employee.EmployeeType == "Admin";
      if (!permissionToLoadBankOrAgent) throw `User is Unauthorized!`;

      if (name == null || name.trim() == "") throw "Name can not be empty!";

      const sqlToCheckDuplicateLoginId = `SELECT * FROM dbo."Ref${type}" WHERE "Ref${type}Id" <> ${entityId} AND "Name" = '${name}'`;
      const { rows: rows } = await postgre.query(sqlToCheckDuplicateLoginId);
      if (rows != null && rows.length > 0)
        throw `${type} with Name: ${name} already exists!`

      const sqlToUpdate = `
      UPDATE dbo."Ref${type}"
      SET "Name" = '${name}',
      "IsActive" = ${IsActive},
      "LastEditedByRefEmployeeId" = ${UserRefEmployeeId},
      "LastEditedOn" = now()
      WHERE "Ref${type}Id" = ${entityId}
      ;
      `;
      await postgre.query(sqlToUpdate);

      res.json({
        isError: false,
        msg: `${type} Details Updated Successfully.`,
      })
    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
};

module.exports = BankAndAgentController;