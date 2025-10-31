const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const report = sequelize_conn.define('report', {
    s_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    staff_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    course_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    cia_1: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cia_2: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ass_1: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ass_2: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ese: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    academic_sem: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: false,
    freezeTableName: true
});

module.exports = report;