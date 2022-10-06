const { Op } = require("sequelize");
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
        await clientConMgr.setUserIdForClient (param.socketId, usrRecord._id, usrRecord.name);
        clientConMgr.notifyClients ('userstatechanged', {newUserSocketId: param.socketId, user: usrRecord})

        resContainer.type = RESULTTYPES.SUCCESSFULL;
        resContainer.data = [usrRecord];
      }
      else if (param.target == 'getchatlistforuser') {
        let chatList = await getChatListForUser (client.userId, appServer);
        resContainer.type = RESULTTYPES.SUCCESSFULL;
        resContainer.data = chatList;
      }
      else if (param.target == 'sendmessage') {
        let messageInfo = param.messageInfo;
        if (! messageInfo?.recipientUserId) {
          let err = createDefaultResultContainer (param, RESULTTYPES.ERROR);
          err.message = 'Nachricht kann nicht zugestellt werden.\Empfänger ist nicht gesetzt.';
          callback (err);
          return;
        }
        let msg = await saveChatMessage (client.userId, messageInfo.recipientUserId, messageInfo.message);
        // Push-Nachricht an Clients, kein await unbedingt notwendig.
        notifyChatMemberForNewMessage ({messageId: msg._id, senderUserId: client.userId, senderUserName: client.userName, recipientUserId: messageInfo.recipientUserId}, appServer);
        resContainer.type = RESULTTYPES.SUCCESSFULL;
        resContainer.data = [msg];
      }
      else if (param.target == 'getsinglechat') {
        let convInfo = await loadChatConversation (param.messageId, param.chatmemberUserIds, param.complete, client.userId, appServer);
        resContainer.type = RESULTTYPES.SUCCESSFULL;
        resContainer.data = convInfo;
      }

      callback (resContainer);
    }
    catch (err) {
      console.error ('onDoRequest - ', err)
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

async function saveChatMessage (senderUserId, recipientUserId, message) {
  let conMgr = new ConnectionManager ();
  let connection = await conMgr.connect ();
  let Message = connection.models[ConnectionManager.MODEL_NAMES.MESSAGE];
  return Message.create ({
    senderuser_id: senderUserId,
    recipientuser_id: recipientUserId,
    text: message
  });
}

async function notifyChatMemberForNewMessage (chatMember, appServer) {
  let usrIds = [chatMember.senderUserId, chatMember.recipientUserId];
  let clientConMgr = appServer.getClientConnectionManager ();
  let clients = (await clientConMgr.getAllClients ()).filter (c => usrIds.includes (c.userId));
  for (let c of clients) {
    clientConMgr.notifyClient (c, 'newmessagereceive', {chatmember: chatMember})
  }
}

async function loadChatConversation (messageId, chatmemberUserIds=[], complete, currentUserId, appServer) {
  if (messageId == null && chatmemberUserIds.length < 2) {
    throw new Error ('Chat kann nicht geladen werden.\nChat-Teilnehmer sind unbekannt.');
  }

  let result = [];
  let loadByMessageId = true;
  if (messageId == null) {
    loadByMessageId = false;
    complete = true;
  }

  let conMgr = new ConnectionManager ();
  let connection = await conMgr.connect ();

  let Message = connection.models[ConnectionManager.MODEL_NAMES.MESSAGE];

  let usrIds = loadByMessageId ? [] : chatmemberUserIds;
  if (loadByMessageId) {
    let msg = await Message.findByPk (messageId);
    usrIds = [msg.senderuser_id, msg.recipientuser_id];
  }
  
  if (usrIds.length > 0) {
    let User = connection.models[ConnectionManager.MODEL_NAMES.USER];
    let userMap = {};
    (await User.findAll ({where: {_id: {[Op.in]: usrIds}}})).forEach (usr => {
      userMap[usr._id] = {_id: usr._id, name: usr.name, isme: (usr._id == currentUserId)};
    });
  
    if (! complete) {
      result.push (msg);
    }
    else {
        result = await Message.findAll ({
          where: {
            senderuser_id: {[Op.in]: usrIds},
            recipientuser_id: {[Op.in]: usrIds},
          }
        });
      // todo: Optimieren und in SQL Where-Bedingung übernehmen
      // Ziel: Sicherstellen, dass alle User-Ids der Chat-Teilnehmer in einer Nachricht vorkommen.
      result = result.filter (m => {
        for (usId of usrIds) {
          if (m.senderuser_id != usId && m.recipientuser_id != usId) {
            return false;
          }
        }
        return true;
      });
      result.sort ((a, b) => a.createdAt - b.createdAt);
    }
  
    result = result.map ((m) => {
      let sender = userMap[m.senderuser_id];
      return {_id: m._id, text: m.text, author: sender.name, authorisme: sender.isme, createdAt: m.createdAt};
    });
    if (result.length > 0) {
      // Flag, damit zum letzten Eintrag aus der Liste (=> neuste Nachricht) in der View gescrollt werden kann
      result.at (-1).focus = true;
    }
  }

  return result;
}

function createDefaultResultContainer (param, type) {
	return {
		target: param?.target || 'unknown',
		type: type,
		message: '',
		data: []
	}
}