const { Pool } = require('pg');
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.CONNECTION_URL,
});

console.log("this is env", process.env.CONNECTION_URL);

pool
  .connect()
  .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => console.error("Connection error", err.stack));
  
module.exports = pool;