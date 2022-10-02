const { Sequelize, Op, Model, DataTypes, UnknownConstraintError } = require('sequelize');
const fs = require('fs');
const path = require ('path');
const ERRORCODES = require ('../errorcodes');

/**
 * Diese Klasse kapselt den Verbindungsaufbau und Abgleich
 * der Tabellen-Schemata zur Postgress-DB
 *
 * @class ConnectionManager
 */
class ConnectionManager {
  
  // todo: DB-Parameter bei nächster Iteration in Config auslagern
  static DB_NAME = 'chatnow';
  static DB_USER = 'postgres';
  static DB_PASSWORT = 'dirk123';
  static DB_HOST = 'localhost';
  static DP_PORT = 5432;

	#currentConnection = null;

  /**
   * Diese Eigenschaft liefert eine Enum der Verfügbaren Daten-Modelle,
   * um damit auf eifache Art über die DB-Connection auf das tatsächliche
   * Model für CRUD-Operationen zugreifen zu können.
   * Die Enum wird im Rahmen der Funktion @see initDatabase zur Laufzeit erzeugt.
   *
   * @readonly
   * @static
   * @memberof ConnectionManager
   */
  static get MODEL_NAMES () {
    return require ('./modelnames');
  }

  constructor () {}

  /**
   * Diese Funktion initialisiert die Datenbank, in dem als DTO vorliegende
   * Modelle in der Datenbank bekannt gemacht wird und die Tabellenstrukturen
   * entsprechend angepasst werden.
   *
   * @returns
   * @memberof ConnectionManager
   */
  async initDatabase () {
    let map = createModelNameEnumFromFiles ();
    let conection = await this.#getDbConnection ();
    return this.#createOrUpdateTableStructures (map, conection, {sync: true});
  }

  /**
   * Diese Funktion liefert eine aktive Verbindung zur Datenbank zurück.
   * Ein mehrmaliges Aufrufen dieser Funktion liefert immer die selbe Verbindung
   * der Instanz zurück.
   *
   * @returns
   * @memberof ConnectionManager
   */
  async connect () {
    let map = createModelNameEnumFromFiles ();
    let con = await this.#getDbConnection ();
    await this.#createOrUpdateTableStructures (map, con);
    return con;
  }

  /**
   * Diese Funktion schließt der derzeut aktiv gehaltene Datenbankverbindung.
   *
   * @returns
   * @memberof ConnectionManager
   */
  async close () {
    if (! this.#currentConnection) {
      throw new Error ('Es existiert keine aktive Verbindung.');
    }
    return this.#createConnection.close ();
  }

  /**
   * Diese private Funktion erzeugt eine Verbindung zur Datenbank.
   * Sollte die Datenbank nicht existieren, wird diese im selben Zuge angelegt.
   *
   * @param {JSON} [options={}]
   * @returns {Sequelize}
   * @memberof ConnectionManager
   */
  async #getDbConnection (options = {}) {
    if (this.#currentConnection != null) {
      console.log (`Benutzung einer existierenden Verbindung (DB ${ConnectionManager.DB_NAME}).`);
      return this.#currentConnection;
    }

    try {
      let currentConnection = this.#createConnection ();
      await currentConnection.authenticate ();
      this.#currentConnection = currentConnection;
      console.log (`Verbindung zu DB ${ConnectionManager.DB_NAME} erfolgreich aufgebaut.`);
      return this.#currentConnection;
    }
    catch (err) {
      if (err.original?.code == ERRORCODES.DB_DATABASE_NOT_EXIST) {
        console.log (`DB ${ConnectionManager.DB_NAME} nicht vorhanden. DB wird angelegt...`);
        return this.#createDatabaseAndReConnect (options);
      }
      console.error (`Fehler beim Verbindungsaufbau zu DB ${this.DB_NAME}`, err);
      throw err;
    }
  }

  /**
   * Diese private Funktion definiert in der übergebenen Datenbankverbindung 
   * die Daten-Modelle. 
   * Per Options-Parameter kann bestimmt werden, ob diese Modellinformationen
   * mit dem tatsächlichen Datenbank-Schema abgeglichen werden sollen.
   *
   * @param {JSON} modelSchemaMap
   * @param {Sequelize} connection
   * @param {JSON} connection
   * @returns 
   * @memberof ConnectionManager
   */
  async #createOrUpdateTableStructures (modelSchemaMap, connection, options) {
    if (! modelSchemaMap) {
      throw new Error ('#createOrUpdateTableStructures - Parameter modelSchemaMap ist nicht gesetzt.');
    }
    if (! connection) {
      throw new Error ('#createOrUpdateTableStructures - Parameter connection ist nicht gesetzt.');
    }

    Object.keys (modelSchemaMap).forEach (modelName => {
      let schema = modelSchemaMap[modelName];
      if (connection.models[modelName] == null) {
        connection.define (modelName, schema);
      }
    });

    if (options?.sync) {
      await connection.sync ({alter:true});
    }
  }

  /**
   * Diese private Funktion erzeugt eine auf Basis der statischen DB-Informationen
   * eine entsprechende neue Datenbank und liefert eine aktive Verbindung zu
   * der neu angelegten Datenbank zurück.
   *
   * @param {JSON} options
   * @returns 
   * @memberof ConnectionManager
   */
  async #createDatabaseAndReConnect (options) {
    await this.#createDatabase ();
    return this.#getDbConnection (options);
  }

   /**
   * Diese private Funktion erzeugt eine auf Basis der statischen DB-Informationen
   * eine entsprechende neue Datenbank.
   *
   * @param {JSON} options
   * @returns 
   * @memberof ConnectionManager
   */
  async #createDatabase () {
    let seq = this.#createConnection ({nodbname: true});
    return seq.query ('CREATE DATABASE ' + ConnectionManager.DB_NAME);
	}

  /**
   * Diese private Funktion kapselt die Instanziierung der Verbindungs-Objektes zur Datenbank
   * und liefert dieses zurück.
   *
   * @param {JSON} options
   * @returns 
   * @memberof ConnectionManager
   */
  #createConnection (options = {}) {
    return new Sequelize (options?.nodbname ? null : ConnectionManager.DB_NAME, ConnectionManager.DB_USER, ConnectionManager.DB_PASSWORT, {
        host: ConnectionManager.DB_HOST,
        port: ConnectionManager.DP_PORT,
        dialect: 'postgres'
      });
  }
}

module.exports = ConnectionManager;

/**
 * Diese Funktion erzeugt auf Basis der in dem Ordner database/models
 * existierenden DTO's eine Enum-Datei, wodurch ein statischer Zugriff
 * auf die Modell-Namen möglich ist.
 *
 * @returns
 */
function createModelNameEnumFromFiles () {
	const BASE_PATH = path.join (process.cwd (), './database');
	const SOURCE_PATH = path.join (BASE_PATH, 'models');
	const TARGET_ENUM_FILENAME = 'modelnames.js';
	
	let modelSchemaMap = {};
	let targetFileInput = {};
	let files = fs.readdirSync(SOURCE_PATH);
	for (let fileName of files) {
		let tmp = require (path.join (SOURCE_PATH, fileName));
		if (tmp?.modelName) {
			targetFileInput[tmp.modelName.toUpperCase()] = tmp.modelName;
			modelSchemaMap[tmp.modelName] = tmp.schema || {};
		}
	}
  // Enum zu Model-Bezeichnung speichern
	let targetFile = 'module.exports=' + JSON.stringify (targetFileInput);
	fs.writeFileSync (path.join (BASE_PATH, TARGET_ENUM_FILENAME), targetFile);

	return modelSchemaMap;
}
