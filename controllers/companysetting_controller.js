const postgre = require("../database");

const companySettingController = {
  getAllCompanySettings: async (req, res) => {
    try {
      const sql =
        `
        SELECT
        f.*,
        e."Name" AS AddedByEmployeeName
        FROM dbo."RefComissionProfile" f
        INNER JOIN dbo."RefEmployee" e ON e."RefEmployeeId" = f."AddedByRefEmployeeId"   
        ORDER BY f."Name", f."OrderById"     
        `
        
      const {rows} = await postgre.query(sql);

      res.json({ isError: false, data:{comissionProfiles: rows}, msg: "Data Loaded Successfully!" });
      return;

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  },
  addNewComissionProfile: async (req, res) => {
    try {
      const employee = req.session.employee;
      const profileName = req.body.profileName;
      const comissionProfileValues = req.body.comissionProfileValues;

      if (!profileName || profileName == null || profileName.trim() == '')
        throw 'Profile Name cannot be Empty!'

      if (!comissionProfileValues || comissionProfileValues == null)
        throw 'Invalid data passed!'

      //#region validation
      comissionProfileValues.sort((a, b) => a.OrderById - b.OrderById);
      var lastValue = 0;

      for (var i = 0; i < comissionProfileValues.length; i++) {
        const current = comissionProfileValues[i];

        if (i === 0) {
          if (current.FromValue !== 0) {
            throw 'From Value of the first line should be 0!';
          }
        } else if (i === comissionProfileValues.length - 1) {
          if (current.ToValue !== 100000000) {
            throw 'To Value of the last line should be Ten Cr (100000000)!';
          }
        } else {
          if (current.FromValue !== lastValue + 1) {
            throw 'Invalid data passed!';
          }
        }

        if (current.InPercent !== 0 && current.InRupees !== 0) {
          throw 'Invalid data passed!';
        }

        lastValue = current.ToValue;
      }

      //#endregion

      var sql =
        `
        INSERT INTO dbo."RefComissionProfile"(
          "Name", 
          "FromValue", 
          "ToValue", 
          "InPercent", 
          "InRupees", 
          "AddedOn", 
          "AddedByRefEmployeeId",
          "OrderById"
          )
          VALUES           
        `

        for (var i = 0; i < comissionProfileValues.length; i++) {
          const current = comissionProfileValues[i];

          sql += `('${profileName}',${current.FromValue},${current.ToValue},${current.InPercent},${current.InRupees},now(),${employee.RefEmployeeId},${current.OrderById})`

          if(i!=comissionProfileValues.length-1)
            sql += ','
        }  
        
      await postgre.query(sql);

      res.json({ isError: false, msg: "New Comission Profile Added Successfully!" });
      return;

    } catch (error) {
      res.json({ isError: true, msg: error.toString() });
    }
  }
};

module.exports = companySettingController;
