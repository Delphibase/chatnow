const { Sequelize, Op, Model, DataTypes, UnknownConstraintError } = require('sequelize');

const User = {
	name: DataTypes.STRING
}

module.exports = {
	modelName: 'User',
	schema: User
};