const express = require('express');
const http = require ('http');
const {Server} = require ('socket.io');
const ConnectionManager = require ('./database/connectionmanager');
const RequestHandler = require ('./requesthandler');


/**
 * Diese Klasse verwaltet den Lebenszyklus des Anwendungsservers.
 * Zum Lebenszyklus gehört auch die Initialisierung der Datenbank und Socket-Verbindung zum Client.
 *
 * @class ApplicationServer
 */
class ApplicationServer {
  #clientConMgr = null;

  constructor () {
    this.#clientConMgr = new ClientConnectionManager ();
  }

  /**
   * Diese Funktion liefert eine Instanz zurück, um indirekt auf
   * die Socket-Verbindungen aller Clients zugreifen zu können,
   * um einzelne Clients explizit anzusprechen (Push-Message)
   *
   * @returns {ClientConnectionManager}
   * @memberof ApplicationServer
   */
  getClientConnectionManager () {
    return this.#clientConMgr;
  }

	/**
   * Diese Funktion initialisiert und startet den Anwendungsserver.
   *
   * @memberof ApplicationServer
   */
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
          param = param ?? {};
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
 * Potentiell eine Fassade zu REDIS.
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

  /**
   * Diese Funktion fügt eine Socket-Verbindung der Liste der
   * aktiven Verbindungen hinzu.
   *
   * @param {*} socket
   * @returns
   * @memberof ClientConnectionManager
   */
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

  /**
   * Diese Funktion entfernt eine Socket-Verbindung auf der Liste
   * der aktiven Verbindungen anhand der Socket-ID.
   *
   * @param {*} socketId
   * @returns
   * @memberof ClientConnectionManager
   */
  async removeClientById (socketId) {
    if (! socketId) {
      throw new Error ('removeClientById - parameter socketId ist nicht gesetzt.');
    }

    let res = this.#clientMap.delete (socketId);
    return res;
  }

  /**
   * Diese Funktion liefert zur Socket-ID die passende Socket-Verbindung
   * zum Client zurück.
   *
   * @param {*} socketId
   * @returns
   * @memberof ClientConnectionManager
   */
  async getClientById (socketId) {
    if (! socketId) {
      throw new Error ('getClientById - parameter socketId ist nicht gesetzt.');
    }

    if (this.#clientMap.has (socketId)) {
      return this.#clientMap.get (socketId);
    }
    return null;
  }

  /**
   * Diese Funktion liefert eine Liste aller aktiven Socket-Verbindungen zurück.
   *
   * @returns
   * @memberof ClientConnectionManager
   */
  async getAllClients () {
    return [...this.#clientMap.values ()];
  }

  /**
   * Diese Funktion ergänzt zu einer Socket-Verbindung die 
   * korrespondierende Benutzer-ID und Benutzername des Anwenders.
   *
   * @param {*} socketId
   * @param {*} userId
   * @param {*} userName
   * @memberof ClientConnectionManager
   */
  async setUserIdForClient (socketId, userId, userName) {
    if (! socketId) {
      throw new Error ('setUserIdForClient - Parameter socketId ist nicht gesetzt.');
    }
    if (! userId) {
      throw new Error ('setUserIdForClient - Parameter userId ist nicht gesetzt.');
    }
    if (! userName) {
      throw new Error ('setUserIdForClient - Parameter userName ist nicht gesetzt.');
    }

    let clt = await this.getClientById (socketId);
    if (clt) {
      clt.userId = userId;
      clt.userName = userName;
    }
  }

  /**
   * Diese Funktion benachrichtigt alle aktiven Clients (online)
   * im Kontext der angegeben Aktion.
   *
   * @param {String} action
   * @param {*} [data={}]
   * @memberof ClientConnectionManager
   */
  async notifyClients (action, data = {}) {
    if (! action) {
      throw new Error ('notifyClients - Parameter action ist nicht gesetzt.');
    }

    let clientList = await this.getAllClients ();
    for (let client of clientList) {
      this.notifyClient (client, action, data);
    }
  }

  /**
   * Diese Funktion benachrichtigt einen einzelnen aktiven Clients (online)
   * im Kontext der angegeben Aktion.
   *
   * @param {*} client
   * @param {*} action
   * @param {*} data
   * @memberof ClientConnectionManager
   */
  notifyClient (client, action, data) {
    if (! client) {
      throw new Error ('notifyClient - Parameter client ist nicht gesetzt.');
    }
    if (! action) {
      throw new Error ('notifyClient - Parameter action ist nicht gesetzt.');
    }

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