const postgre = require("../database");
const bcrypt = require("bcrypt");

const companySettingController = {
  addNewComissionProfile: async (req, res) => {
    try {
      const employee = req.session.employee;
      const profileName = req.body.profileName;
      const comissionProfileValues = req.body.comissionProfileValues;

      if(!profileName || profileName==null || profileName.trim()=='')
        throw 'Profile Name cannot be Empty!'

      if(!comissionProfileValues || comissionProfileValues == null || typeof comissionProfileValues != Array)
        throw 'Invalid data passed!'

      //#region validation
      comissionProfileValues.sort((a, b) => a.OrderId - b.OrderId);
      const firstValue = 0;

      for(var i=0; i<comissionProfileValues.length; i++){

      }

      //#endregion

      const sql =
        `
        SELECT 
            e."RefEmployeeId",
            e."Name",
            e."EmployeeLoginId",
            e."Password",
            e."RefEmployeeTypeId",
            ty."Name" AS "EmployeeTypeName",
            ty."Code" AS "EmployeeType"
        FROM dbo."RefEmployee" e 
        INNER JOIN dbo."RefEmployeeType" ty ON ty."RefEmployeeTypeId" = e."RefEmployeeTypeId"	
        WHERE e."EmployeeLoginId" = '` + userId + `'`;
      const { rows } = await postgre.query(sql);

      if (rows == null || rows.length == 0) {
        res.json({ isError: true, msg: "User " +userId+ " Not Found!" });
        return;
      }

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  }
};

module.exports = companySettingController;
