const { DataTypes } = require('sequelize');
const sequelize_conn = require('./dbconnection');

const academic = sequelize_conn.define('academic', 
{
	s_no: {
		type: DataTypes.INTEGER,
		allowNull: false,
		primaryKey: true,
		autoIncrement: true
	},
	cia_1: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	cia_2: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	ass_1: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	ass_2: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	academic_sem: {
		type: DataTypes.STRING,
		allowNull: false,
	},
    academic_year: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	curr_year: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	active_sem:{
		type: DataTypes.INTEGER,
		allowNull: false
	}
}, 
{
    timestamps: false,
    freezeTableName: true
});

module.exports = academic;    
