const express = require('express');
const http = require ('http');
const cors = require ('cors');
const {Server} = require ('socket.io');
const ConnectionManager = require ('./database/connectionmanager');
const RequestHandler = require ('./requesthandler');

class ApplicationServer {
  #clientConMgr = null;

  constructor () {
    this.#clientConMgr = new ClientConnectionManager ();
  }

  /**
   *
   *
   * @returns {ClientConnectionManager}
   * @memberof ApplicationServer
   */
  getClientConnectionManager () {
    return this.#clientConMgr;
  }

	async boot () {
    try {
      let cm = new ConnectionManager ();
      await cm.initDatabase ();
      
      const app = express ();
      const httpServer = http.createServer (app);
      const io = new Server (httpServer, {'cors': {'origin': 'http://localhost:3000'}});

      io.on ('connection', async (socket) => {
        console.log ("Client-Verbindung aufgebaut: ", socket.id);
        await this.getClientConnectionManager ().addClient (socket);

        socket.on ('disconnect', async () => {
          console.log ("Client-Verbindung beendet: ", socket.id);
          await this.getClientConnectionManager ().removeClientById (socket.id);
          this.getClientConnectionManager ().notifyClients ('userstatechanged')
        })
        socket.on ('dorequest', async (param, clb) => {
          param.socketId = socket.id;
          return RequestHandler.onDoRequest (param, clb, this);
        });
      });

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


/**
 * Diese Klasse hält eine Liste der aktiven Socket-Verbindungen.
 * 
 * todo: Es bietet sich an diese Informationen in einer Redis-DB zu speichern.
 * Heute werden diese Informationen transient im Speicher des Servers gehalten.
 * Die Funktionen sind aus asynchrone Ausführung ausgelegt und somit kann später
 * eine Umstellung an dieser Stelle auf Redis erfolgen.
 *
 * @class ClientConnectionManager
 */
class ClientConnectionManager {
  #clientMap = new Map ();

  async addClient (socket) {
    if (! socket) {
      throw new Error ('addClient - parameter socket ist nicht gesetzt.');
    }
    if (this.#clientMap.has (socket.id)) {
      return;
    }

    let res = this.#clientMap.set (socket.id, {userId: null, socket});
    return res;
  }

  async removeClientById (socketId) {
    if (! socketId) {
      throw new Error ('removeClientById - parameter socketId ist nicht gesetzt.');
    }

    let res = this.#clientMap.delete (socketId);
    return res;
  }

  async getClientById (socketId) {
    if (! socketId) {
      throw new Error ('getClientById - parameter socketId ist nicht gesetzt.');
    }

    if (this.#clientMap.has (socketId)) {
      return this.#clientMap.get (socketId);
    }
    return null;
  }

  async getAllClients () {
    return [...this.#clientMap.values ()];
  }

  async setUserIdForClient (socketId, userId) {
    let clt = await this.getClientById (socketId);
    if (clt) {
      clt.userId = userId;
    }
  }

  async notifyClients (action, data = {}) {
    let clientList = await this.getAllClients ();
    for (let client of clientList) {
      if (client.userId && client.socket?.connected) {
        let tmpData = {
          ... data,
          receiverUserId: client.userId,
          action: action
        }
        client.socket.emit (action, tmpData);
      }
    }
  }
}