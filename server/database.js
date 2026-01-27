require("dotenv").config()
const mysql = require("mysql")

let con = mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || "insurance"
});

con.connect((err) => {
    if (err) {
        // Silent failure - database connection error suppressed
        return;
    }
    console.log("Connected to Database");
});

module.exports = con