const { DataTypes } = require('sequelize');
const sequelize = require('../src/db_connect/sequelize');

const Code = sequelize.define('Code', {
    code_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    code_title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    html_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    css_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    js_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
})

module.exports = { Code };