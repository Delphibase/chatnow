import React, {useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {Badge, Avatar, Box, List, ListItemButton, ListItemText, ListItemAvatar, AppBar, Toolbar, Typography, Paper} from '@mui/material';
import {People} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
	  marginTop: '10px',
    width: '100%',
	  height: '90vh',
    display:"flex",
    flexDirection:"column"
  },
}));

/**
 * Diese Komponente stellt die Chat-Kontaktliste dar, aus der ein
 * Benutzer für den Start eine Chat-Konversation ausgewählt werden kann.
 *
 * @export
 * @param {*} props
 * @returns
 */
export default function ChatList(props) {
  const classes = useStyles();
  let selUserId = props.selectedChatUserInfo ? props.selectedChatUserInfo._id : null;
  const [selectedItemId, setSelectedItemId] = useState (selUserId);
  
  const onClickUser = (event) => {
    if (props.onChatClicked && event.target.offsetParent && event.target.offsetParent.id) {
      setSelectedItemId (event.target.offsetParent.id);
      props.onChatClicked ({_id: event.target.offsetParent.id, name: event.target.offsetParent.textContent});
    }
  };

  // Listeneintrag für einen Chat-Kontakt aufbereiten
  const chats = props.chats || [];
  const chatItems = chats.map (elm => {
    let avtColorStyle = elm.isOnline ? {color:'green'} : {color:'white'};
    return (
      <ListItemButton id={elm._id} onClick={onClickUser} selected={elm._id == selectedItemId}>
        <ListItemAvatar>
          <Avatar>
            <People style={avtColorStyle}/>
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={elm.name}/>
        <Badge color="secondary" variant="dot" invisible={! props.unreadMessagesFromUser.includes (elm._id)}>
        </Badge>
      </ListItemButton>
    )
  });

  return (
    <Box className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h8">Meine Chats</Typography>
        </Toolbar>
      </AppBar>
      <Paper style={{height: '100%'}}>
        <List>
          {chatItems}
        </List>
      </Paper>
    </Box>
  );
}
