const { DataTypes } = require('sequelize');

const Message = {
	_id: {
		type: DataTypes.UUID,
		primaryKey: true,
		defaultValue: DataTypes.UUIDV4
	},
	senderuser_id: DataTypes.UUID,
	recipientuser_id: DataTypes.UUID,
	text: DataTypes.STRING,
	// deliverystatus: DataTypes.INTEGER // comming soon
}

module.exports = {
	modelName: 'Message',
	schema: Message
};