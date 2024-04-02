const postgre = require('../database');
const bcrypt = require('bcrypt');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const saltRounds = 11;

const loginController = {
    loginEmployee: async(req, res) => {
        try {

            const userId = req.body.userName;
            const password = req.body.password;

            const sql = `SELECT * FROM dbo."RefEmployee" WHERE "EmployeeLoginId" = '` + userId + `'`;
            const { rows } = await postgre.query(sql);

            if(rows==null || rows.length==0){
                res.json({isError:true, msg:"User Not Found!"});
                return;
            }

            // bcrypt.hash(password, saltRounds, async (err, hash)=>{
            //     if(err){
            //         console.log(err);
            //     } else {
            //         console.log(hash);
            //     }
            // });

            bcrypt.compare(password, rows[0].Password, (error, response)=>{
                if(error){
                    console.log(error);
                }
                else {
                    res.json({isError:false, isLoggedIn: true, msg:"Logged In Successfully."})
                }
            })

        } catch (error) {
            res.json({msg: error.msg})
        }
    },
}

module.exports = loginController