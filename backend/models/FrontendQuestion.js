const { DataTypes } = require("sequelize");
const sequelize = require("../src/db_connect/sequelize");

const FrontendQuestion = sequelize.define(
  "FrontendQuestion",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    starter_html: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    starter_css: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    starter_js: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    test_cases: {
      type: DataTypes.JSONB,
      allowNull: false,
    },

    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      allowNull: false,
      defaultValue: "easy",
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "frontend_questions",
    timestamps: false, // since we're manually managing created_at
  }
);

module.exports = FrontendQuestion;