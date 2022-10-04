import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Box from '@mui/material/Box';
import {AppBar, Toolbar, Typography, Paper} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import {People} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
	marginTop: '10px',
    width: '100%',
	height: '605px'
  },
}));

export default function ChatList(props) {
  const classes = useStyles();

  const chats = props.chats || [];
  const chatItems = chats.map (elm => {
    let avtColorStyle = elm.isOnline ? {color:'green'} : {color:'white'};
    
    return (
      <ListItem button>
        <ListItemAvatar>
          <Avatar>
            <People style={avtColorStyle}/>
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={elm.name} secondary={elm.isOnline} />
      </ListItem>
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
