const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const markentry = sequelize_conn.define('markentry',
{
    s_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    batch: {
        type: DataTypes.STRING,
        allowNull: true
    },
    graduate: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    reg_no: {
        type: DataTypes.STRING,
        allowNull: true
    },
    course_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c1_lot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c1_mot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c1_hot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c1_total: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_lot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_mot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_hot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_total: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a1_lot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a2_lot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ese_lot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ese_mot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ese_hot: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ese_total: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    academic_sem : {
        type: DataTypes.STRING,
        allowNull: true
    },
    academic_year : {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    timestamps: false,
    freezeTableName: true
});

module.exports = markentry;