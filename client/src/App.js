
import React, { Fragment, useEffect } from 'react';
import './App.css';
import {Grid} from '@mui/material';
import TitleBar from './components/titlebar';
import ChatList from './components/chatlist';
import ChatConversation from './components/chatconversation';
import NicknameDialog from './components/nickname';


function App(props) {
  const [currentUser, setCurrentUser] = React.useState (null);
  const [reloadChatList, setReloadChatList] = React.useState (false);
  const [chatList, setChatList] = React.useState ([]);

  props.backendCommunication.onUserStateChannged = (data) => {
    if (data && data.newUserSockerId == props.backendCommunication.getSocketId ()) {
      setCurrentUser (data.user);
    }
    setReloadChatList (true);
  };

  const onResultNicknameDlg = (res) => {
    if (res.resultTyp == 1) {
      props.backendCommunication.doRequest ({target: 'enternickname', data: {nickname: res.nickname}});
    }
  };

  useEffect (() => {
    if (reloadChatList) {
      setReloadChatList (false);
      props.backendCommunication.doRequest ({target: 'getchatlistforuser', data: {currentUserId: currentUser._id}})
        .then (function (result) {
          setChatList (result.data);
        });
    }
  }, [reloadChatList])

  if (currentUser) {
    return (
      <Fragment>
        <TitleBar currentUser={currentUser}/>
        <Grid container spacing={3}>
          <Grid item xs={3}>
            <ChatList chats={chatList} currentUser={currentUser}/>
          </Grid>
          <Grid item xs={9}>
            <ChatConversation currentUser={currentUser}/>
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
