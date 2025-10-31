const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const coursemaster = sequelize_conn.define('coursemaster',
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
    course_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    course_title: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    degree: {
        type: DataTypes.STRING,
        allowNull: true
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    academic_sem : {
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

module.exports = coursemaster;