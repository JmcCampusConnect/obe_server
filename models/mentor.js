const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const mentor = sequelize_conn.define('mentor', 
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
    degree: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true
    },
    batch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    staff_id: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    staff_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    academic_sem: {
        type: DataTypes.STRING,
        allowNull: true 
    },
    academic_year: {
        type: DataTypes.STRING,
        allowNull: true 
    }
}, 
{
    timestamps: false,
    freezeTableName: true
});

module.exports = mentor;