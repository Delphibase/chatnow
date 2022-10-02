const express = require('express');
const http = require ('http');
const cors = require ('cors');
const {Server} = require ('socket.io');
const ConnectionManager = require ('./database/connectionmanager');

class ApplicationServer {
	async boot () {
    try {
      let cm = new ConnectionManager ();
      await cm.initDatabase ();
      
      const app = express ();
      const httpServer = http.createServer (app);
      const io = new Server (httpServer, {'cors': {'origin': 'http://localhost:3000'}});

      httpServer.listen (3001, () => {
        console.log ('Http-Server initialisiert. Warten auf Anfragen...');
      });
    }
    catch (err) {
      console.log ("Fehler beim Start des App-Servers. Server ist nicht gestartet.", err);
    }
	}
}

module.exports = ApplicationServer;