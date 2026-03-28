const { DataTypes } = require("sequelize");
const sequelize = require("../src/db_connect/sequelize");

const FrontendPracticeSolution = sequelize.define(
  "FrontendPracticeSolution",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: {
        model: "Users",
        key: "id",
      },
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "question_id",
      references: {
        model: "frontend_questions",
        key: "id",
      },
    },
    htmlCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "html_code",
    },
    cssCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "css_code",
    },
    jsCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "js_code",
    },
  },
  {
    tableName: "frontend_practice_solutions",
    timestamps: true,
    updatedAt: false,
  }
);

module.exports = FrontendPracticeSolution;
