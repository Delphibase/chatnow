const { Sequelize, Op, Model, DataTypes, UnknownConstraintError } = require('sequelize');

const User = {
	_id: {
		type: DataTypes.UUID,
		primaryKey: true,
		defaultValue: DataTypes.UUIDV4
	},
	name: DataTypes.STRING
}

module.exports = {
	modelName: 'User',
	schema: User
};