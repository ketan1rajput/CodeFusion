const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connected to PostgreSQL using Sequelize. ");
  })
  .catch((err) => {
    console.log("Unable to connect to database", err);
  });

module.exports = sequelize;
