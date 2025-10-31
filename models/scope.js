const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const scope = sequelize_conn.define('scope',
{
    staff_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    dashboard: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    course_list: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    course_outcome: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    student_outcome: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    program_outcome: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    program_specific_outcome: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    obe_report: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    work_progress_report: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    input_files: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    manage: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    relationship_matrix: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    settings: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, 
{
    timestamps: false,
    freezeTableName: true
});

module.exports = scope;