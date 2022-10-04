
import React, { Fragment } from 'react';
import './App.css';
import {Grid} from '@mui/material';
import TitleBar from './components/titlebar';
import ChatList from './components/chatlist';
import ChatConversation from './components/chatconversation';

function App() {

  const [currentUser, setCurrentUser] = React.useState ({_id: 5, username: 'Dirk Wetzels'});
  return (
    <Fragment>
      <TitleBar />
      <Grid container>
        <Grid item xs={3}>
          <ChatList currentUser={currentUser}/>
        </Grid>
        <Grid item xs={9}>
          <ChatConversation currentUser={currentUser}/>
        </Grid>
      </Grid>
    </Fragment>
  )
}

export default App;
