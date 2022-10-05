const RESULTTYPES = Object.freeze ({NOP: 0, SUCCESSFULL: 1, ERROR: 2});
const ApplicationServer = require('./applicationserver');
const ConnectionManager = require ('./database/connectionmanager');

module.exports = class RequestHandler {

	/**
   *
   *
   * @static
   * @param {*} param
   * @param {*} callback
   * @param {ApplicationServer} appServer
   * @returns
   */
  static async onDoRequest (param, callback, appServer) {
    if (! param?.target) {
			let err = createDefaultResultContainer (param, RESULTTYPES.ERROR);
			err.message = 'doRequest - Target ist nicht gesetzt.';
			callback (err);
			return;
		}

    let userIdRequired = ! ['enternickname'].includes (param.target);

    let clientConMgr = appServer.getClientConnectionManager ();
    let client = await clientConMgr.getClientById (param.socketId);
    if ((userIdRequired && ! client?.userId) || ! client?.socket?.connected) {
      let err = createDefaultResultContainer (param, RESULTTYPES.ERROR);
      err.message = 'Liste der Chats kann nicht abgerufen werden.\nBenutzer ist nicht angemeldet.';
      callback (err);
			return;
    }

    try {
      //---
      // Todo: Code in nächster Itteration weiter abstrahieren, mehr Dynamik - harte Kopplung (if/else-if/else) zu Fachlogik muss hier verhindert werden.
      //---
      let resContainer = createDefaultResultContainer (param, RESULTTYPES.NOP);
      if (param.target == 'enternickname') {
        let nickname = (param.data?.nickname || '').trim ();
        let usrRecord = await createOrGetUserByName (nickname)
        await clientConMgr.setUserIdForClient (param.socketId, usrRecord._id);
        clientConMgr.notifyClients ('userstatechanged', {newUserSocketId: param.socketId, user: usrRecord})

        resContainer.type = RESULTTYPES.SUCCESSFULL;
        resContainer.data = [usrRecord];
      }
      else if (param.target == 'getchatlistforuser') {
        let chatList = await getChatListForUser (client.userId, appServer);
        resContainer.type = RESULTTYPES.SUCCESSFULL;
        resContainer.data = chatList;
      }

      callback (resContainer);
    }
    catch (err) {
			let errContainer = createDefaultResultContainer (param, RESULTTYPES.ERROR);
			errContainer.message = err.message;
			callback (errContainer);
    }
	}
}

async function createOrGetUserByName (nickName) {
  if ((nickName || '').lenght == 0) {
    throw new Error ('reateOrGetUserByName: Es wurde kein Nickname angegeben.');
  }

  let conMgr = new ConnectionManager ();
  let connection = await conMgr.connect ();
  
  let User = connection.models[ConnectionManager.MODEL_NAMES.USER];
  let userRecord = await User.findOne ({where: {name: nickName}});
  if (! userRecord) {
    userRecord = await User.create ({name: nickName});
  }
  return userRecord;
}

async function getChatListForUser (currentUserId, appServer) {
  let conMgr = new ConnectionManager ();
  let connection = await conMgr.connect ();

  let clientConMgr = appServer.getClientConnectionManager ();
  let clients = await clientConMgr.getAllClients ();
  let User = connection.models[ConnectionManager.MODEL_NAMES.USER];
  let userList = (await User.findAll ()).map (persistentUser => {
    // Frage: Ist das notwendig? Objekt aus DB kann sonst nicht um Eigenschaften zur Laufzeit
    // erweitert werden (z.B. isOnline). Diese Eigenschaften kommen nicht am Client an, wenn DB-JSON-Objekt weitergegeben wird.
    // Mit neuem Objekt (hier var user) klappt es.
    let user = {_id: persistentUser._id, name: persistentUser.name, isme: false};
    if (persistentUser._id == currentUserId) {
      user.name = 'Ich (' + user.name + ')';
      user.isme = true;
    }
    user.isOnline = clients.find (c => c.userId == user._id)?.socket?.connected || false;
    return user;
  });

  // Resultat sortieren: Zunächst alpahbetisch
  // und dann im 2. Schritt den aktuellen Benutzer an Stelle 1 schieben.
  userList.sort ((a, b) => a.name - b.name);
  const changePosInArray = (arr, init, target) => {[arr[init],arr[target]] = [arr[target],arr[init]]; return arr};
  const indexIsMe = userList.findIndex (u => u.isme);
  userList = changePosInArray (userList, indexIsMe, 0);

  return userList;
}

function createDefaultResultContainer (param, type) {
	return {
		target: param?.target || 'unknown',
		type: type,
		message: '',
		data: []
	}
}