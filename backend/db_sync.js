const sequelize = require("./src/db_connect/sequelize");
const { User } = require("./models/User");
const { Code } = require("./models/Code")

async function syncModels() {
    try {
    await sequelize.sync({ alter: true });
    console.log("All models were synchronized successfully.");
  } catch (error) {
    console.error("Error syncing models:", error);
  }
}

syncModels();
