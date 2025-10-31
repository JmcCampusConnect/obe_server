const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const studentmaster = sequelize_conn.define('studentmaster',
{
    s_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    reg_no : {
        type: DataTypes.STRING,
        allowNull: false,
    },
    stu_name : {
        type: DataTypes.STRING,
        allowNull: true
    },
    dept_id : {
        type: DataTypes.STRING,
        allowNull: true
    },
    category : {
        type: DataTypes.STRING,
        allowNull: true
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    section: {
        type: DataTypes.STRING,
        allowNull: true
    },
    batch : {
        type: DataTypes.STRING,
        allowNull: true
    }
}, 
{
    timestamps: false,
    freezeTableName: true
});

module.exports = studentmaster;