const { DataTypes } = require("sequelize");
const sequelize = require("../src/db_connect/sequelize");

const FrontendPracticeCompletion = sequelize.define(
  "FrontendPracticeCompletion",
  {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "user_id",
      references: {
        model: "Users",
        key: "id",
      },
    },
    questionId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: "question_id",
      references: {
        model: "frontend_questions",
        key: "id",
      },
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "completed_at",
    },
  },
  {
    tableName: "frontend_practice_completions",
    timestamps: false,
  }
);

module.exports = FrontendPracticeCompletion;
