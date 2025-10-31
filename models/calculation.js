const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const calculation = sequelize_conn.define('calculation',
{
    s_no : {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    academic_sem : {
        type: DataTypes.STRING,
        allowNull: true
    },
    c1_lot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c1_mot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c1_hot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_lot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_mot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c2_hot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a1_lot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a1_mot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a1_hot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a2_lot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a2_mot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    a2_hot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c_lot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c_mot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    c_hot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    e_lot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    e_mot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    e_hot : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l0_ug : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l1_ug : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l2_ug : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l3_ug : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l0_pg : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l1_pg : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l2_pg : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    so_l3_pg : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    cia_weightage : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ese_weightage : {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    co_thresh_value : {
        type: DataTypes.INTEGER,
        allowNull: true
    }
},
{
    timestamps: false,
    freezeTableName: true
});

module.exports = calculation;