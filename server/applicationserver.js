const ConnectionManager = require ('./database/connectionmanager');

class ApplicationServer {
	async boot () {
		let cm = new ConnectionManager ();
		return cm.initDatabase ();
	}
}

module.exports = ApplicationServer;