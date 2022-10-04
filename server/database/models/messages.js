const { DataTypes } = require('sequelize');

const Message = {
	_id: {
		type: DataTypes.UUID,
		primaryKey: true,
		defaultValue: DataTypes.UUIDV4
	},
	fromuser_id: DataTypes.UUID,
	touser_id: DataTypes.UUID,
	text: DataTypes.STRING,
	deliverystatus: DataTypes.INTEGER
}

module.exports = {
	modelName: 'Message',
	schema: Message
};