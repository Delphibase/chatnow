import io from 'socket.io-client';

let instance = null;

export default class BackendCommunication {
	constructor () {
		if (! instance) {
			this.socket = io.connect ('http://localhost:3001');
      this.socket.on ('userstatechanged', this.onUserStateChangedInternal.bind (this))
			instance = this;
		}
		return instance;
	}

  getSocketId () {
    return this.socket.id;
  }

	async doRequest (req) {
		return new Promise ((resolve, reject) => {
			this.socket.emit ('dorequest', req, (result) => {
				console.log ("Dirk doRequest-RESULT ", result)
				resolve (result);
			});
		});
	}

  onUserStateChangedInternal (data) {
    // Ergebnis an Abonenten (i.d.R. Componenten) weitergeben
    if (this.onUserStateChannged) {
      this.onUserStateChannged (data);
    }
  }
}