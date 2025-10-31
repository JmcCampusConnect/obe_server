const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const hod = sequelize_conn.define('hod', 
{
    s_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    graduate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    staff_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    hod_name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, 
{
    timestamps: false,
    freezeTableName: true
});

module.exports = hod;