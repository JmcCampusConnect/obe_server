const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const rsmatrix = sequelize_conn.define('rsmatrix',
{
    s_no: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    dept_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: true
    },
    course_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    co1_po1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_po2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_po3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_po4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_po5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_pso1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_pso2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_pso3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_pso4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_pso5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co1_mean: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_po1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_po2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_po3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_po4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_po5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_pso1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_pso2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_pso3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_pso4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_pso5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co2_mean: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_po1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_po2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_po3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_po4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_po5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_pso1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_pso2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_pso3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_pso4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_pso5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co3_mean: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_po1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_po2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_po3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_po4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_po5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_pso1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_pso2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_pso3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_pso4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_pso5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co4_mean: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_po1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_po2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_po3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_po4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_po5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_pso1: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_pso2: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_pso3: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_pso4: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_pso5: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    co5_mean: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    mean: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    olrel: {
        type: DataTypes.STRING,
        allowNull: true
    }
},
{
    timestamps: false,
    freezeTableName: true
});

module.exports = rsmatrix;