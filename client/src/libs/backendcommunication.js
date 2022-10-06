import io from 'socket.io-client';

// Aufgrund des require-Cache-Verhaltens bleibt der Wert dieser Variablen erhalten
// trotz mehrmaligen requires erhalten.
let instance = null;

/**
 * Diese Klasse kapselt die Socket-Kommunikation zum Datenaustausch mit dem Backend.
 * Es kann nur 1 Instanz dieser Klasse erstellt werden. Wenn der Konstruktor mehrmals
 * aufgerufen wird, wird die am Anfang erstellte Instanz mit initialisierter
 * Socket-Verbindung zurück gegeben.
 *
 * @export
 * @class BackendCommunication
 */
export default class BackendCommunication {
	#socket = null;

	constructor () {
		if (! instance) {
			this.#socket = io.connect ('http://localhost:3001');
      this.#socket.on ('userstatechanged', this.onUserStateChangedInternal.bind (this));
			this.#socket.on ('newmessagereceive', this.onNewMessageReceivedInternal.bind (this));
			instance = this;
		}
		return instance;
	}

  /**
	 * Diese Funktion liefert die Socket-ID der aktiven Verbindung des Clients zurück.
	 *
	 * @returns
	 * @memberof BackendCommunication
	 */
	getSocketId () {
    return this.#socket.id;
  }

	/**
	 * Diese Funktion stellt eine Anfrage an das Backend und liefert das Anfrage-Ergebnis zurück.
	 * Jede Anfrage muss im Feld 'target' eine eindeutigen Identifier übermitteln, wo durch im Backend
	 * die entsprechenden Prozesse angestoßen werden.
	 * 
	 * @example
	 * req = {target: 'enternickname', data: {nickname: res.nickname}}
	 * 
	 * @param {JSON} req
	 * @returns
	 * @memberof BackendCommunication
	 */
	async doRequest (req) {
		console.log ("doRequest ", req);
		return new Promise ((resolve, reject) => {
			this.#socket.emit ('dorequest', req, (result) => {
				console.log ("doRequest-RESULT ", result);
				resolve (result);
				//--> Fehler werden anhand des Result-Types im Result zurückgeliefert, nicht per Reject.
			});
		});
	}

  /**
	 * Dieser Callback wird vom Backend aufgerufen, wenn sich der Benutzer-Status
	 * irgend eines Nutzer ändert (online/offline).
	 * Die Funktion delegiert die Anfrage an mögliche andere Abonenten 1:1 weiter
	 * und führt keine eigene Aktion aus.
	 *
	 * @param {JSON} data
	 * @memberof BackendCommunication
	 */
	onUserStateChangedInternal (data) {
    // Ergebnis an Abonenten (i.d.R. Componenten) weitergeben
    if (this.onUserStateChannged) {
      this.onUserStateChannged (data);
    }
  }

	/**
	 * Dieser Callback wird vom Backend aufgerufen, wenn für den Benutzer der aktiven
	 * Socket-Verbindung eine neue Chat-Nachricht zur Verfügung steht.
	 * Die Funktion delegiert die Anfrage an mögliche andere Abonenten 1:1 weiter
	 * und führt keine eigene Aktion aus.
	 *
	 * @param {JSON} data
	 * @memberof BackendCommunication
	 */
	onNewMessageReceivedInternal (data) {
		if (this.onNewMessageReceived) {
      this.onNewMessageReceived (data);
    }
	}
}