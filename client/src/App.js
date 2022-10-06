
import React, { Fragment, useEffect, useReducer } from 'react';
import './App.css';
import {Grid} from '@mui/material';
import TitleBar from './components/titlebar';
import ChatList from './components/chatlist';
import ChatConversation from './components/chatconversation';
import NicknameDialog from './components/nickname';

/**
 * Diese Komponente stelt den Hauptrahmen der Chat-Anwendung dar.
 * Wenn der Nutzer noch keinen Nickname vergeben hat, wird zunächst
 * ein Eingabedialog für den Nichname angezeigt.
 *
 * @param {*} props
 * @returns
 */
function App(props) {
  const [_, forceUpdate] = useReducer((x) => x + 1, 0);
  const [currentUser, setCurrentUser] = React.useState (null);
  const [reloadChatContactList, setReloadChatContactList] = React.useState (false);
  const [newMessageId, setNewMessageId] = React.useState (null);
  const [unreadMessagesFromUserList, setUnreadMessagesFromUserList] = React.useState ([]);
  const [currentConversationInfo, setCurrentConversationInfo] = React.useState ([]);
  const [chatList, setChatList] = React.useState ([]);
  const [selectedChatUserInfo, setSelectedChatUserInfo] = React.useState (null);

  // Callback für Push-Benachrichtigung bei Benutzer-Statusänderung
  props.backendCommunication.onUserStateChannged = (data) => {
    if (data && data.newUserSocketId == props.backendCommunication.getSocketId ()) {
      setCurrentUser (data.user);
      // Default: 'Meinen' Chat nach der Anmeldung auswählen.
      setSelectedChatUserInfo ({_id: data.user._id, name: data.user.name});
    }
    setReloadChatContactList (true);
  };

  // Callback für Push-Benachrichtigung bei neuer Nachricht an den Benutzer
  // der akiven Socket-Verbindung
  // Wichtig: Auch selbst versendete Nachrichten werden über diese Weg an den Client zurück
  // geliefert, damit dieser im Chat-Verlauf hinzugefügt und angezeigt werden.
  props.backendCommunication.onNewMessageReceived = (data) => {
    let usrIds = [data.chatmember.senderUserId, data.chatmember.recipientUserId];
    if (usrIds.includes (currentUser._id) && usrIds.includes (selectedChatUserInfo._id)) {
      setNewMessageId (data.chatmember.messageId);
    }
    // Fall: Client bekommt Message eines anderes Clients
    if (data.chatmember.senderUserId != currentUser._id) {
      if (! unreadMessagesFromUserList.includes (data.chatmember.senderUserId)) {
        unreadMessagesFromUserList.push (data.chatmember.senderUserId);
        setUnreadMessagesFromUserList (unreadMessagesFromUserList);
        forceUpdate ();
      }
    }
  };

  // Event-Handler, wenn der Anwender im Dialog NicknameDialog einen Namen eingegeben hat.
  // Weitergabe des Nicknames an das Backend und ensprechende Chat-Daten zu laden.
  const onResultNicknameDlg = (res) => {
    if (res.resultTyp == 1) {
      props.backendCommunication.doRequest ({target: 'enternickname', data: {nickname: res.nickname}});
    }
  };

  // Event-Handler aus der Komponente ChatConversation, um eine Nachricht an den
  // Empfänger zu senden.
  const sendMessage = (messageInfo) => {
    props.backendCommunication.doRequest ({target: 'sendmessage', messageInfo});
  };

  // Bei Änderung des Status eines anderen Benutzers (Client) muss die Chat-Kontaktliste neugeladen werden.
  useEffect (() => {
    if (reloadChatContactList) {
      setReloadChatContactList (false);
      props.backendCommunication.doRequest ({target: 'getchatlistforuser'})
        .then (function (result) {
          setChatList (result.data);
        });
    }
  }, [reloadChatContactList]);

  // Wenn aus der Chat-Kontaktliste ein Eintrag ausgewählt wurde,
  // oder eine Push-Mitteilung über eine neue Nachricht eingegangen ist
  // soll der korrespondierende Einzel-Chat geladen werden.
  useEffect (() => {
    let workingPromise = Promise.resolve ({type: 0}); // NOP
    if (newMessageId) {
      workingPromise = props.backendCommunication.doRequest ({target: 'getsinglechat', complete: true, messageId: newMessageId});
    }
    else if (currentUser && selectedChatUserInfo){
      workingPromise = props.backendCommunication.doRequest ({target: 'getsinglechat', chatmemberUserIds: [currentUser._id, selectedChatUserInfo._id]});
    }
    workingPromise.then (function (res) {
      if (res.type == 1) {
        setNewMessageId (null);
        setCurrentConversationInfo (res.data);
        // Badges nach dem Laden der Konversation zurück setzen
        let tmpList = unreadMessagesFromUserList.filter (e => e != selectedChatUserInfo._id);
        setUnreadMessagesFromUserList (tmpList);
      }
    });
  }, [selectedChatUserInfo, newMessageId]);

  if (currentUser) {
    return (
      <Fragment>
        <TitleBar currentUser={currentUser}/>
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <ChatList selectedChatUserInfo={selectedChatUserInfo} chats={chatList} onChatClicked={setSelectedChatUserInfo} unreadMessagesFromUser={unreadMessagesFromUserList}/>
          </Grid>
          <Grid item xs={9}>
            <ChatConversation selectedChatUserInfo={selectedChatUserInfo} chatconversation={currentConversationInfo} onSendMessageClick={sendMessage}/>
          </Grid>
        </Grid>
      </Fragment>
    )
  }
  else {
    return (
      <Fragment>
        <NicknameDialog currentUser={currentUser} resultCallback={onResultNicknameDlg}/>
      </Fragment>
    )
  }
}

export default App;
