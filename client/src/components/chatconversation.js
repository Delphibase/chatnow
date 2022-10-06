import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {Box, Paper, Grid, List, ListItemButton, ListItemText, FormControl, TextField, Button, Icon, Divider, AppBar, Toolbar, Typography} from '@mui/material';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: '10px',
  },
  chatmessages: {
    height: '500px',
    overflow: 'auto'
  }
}));

export default function ChatConversation(props) {
  const classes = useStyles();

  const [message, setMessage] = React.useState ('');

  const messagesAsListElm = props.chatconversation.map ((elm) => {
    const txtColor = elm.authorisme ? 'green' : 'blue';
    const txtAlign = elm.authorisme ? 'right' : 'left';
    const authorAndTimeStamp = `${elm.author} (${new Date (elm.createdAt).toLocaleString ()})`;
    return (
      <ListItemButton autoFocus={elm.focus || false}>
        <ListItemText primaryTypographyProps={{ style: {color: txtColor, textAlign: txtAlign}}} secondaryTypographyProps={{style: {textAlign: txtAlign}}} primary={authorAndTimeStamp} secondary={elm.text}/>
      </ListItemButton>
    )
  });

  const onChangeMessage = (event) => {
    setMessage (event.target.value);
  }

  const onClickSend = (event) => {
    if (message && props.onSendMessageClick) {
      props.onSendMessageClick ({
        recipientUserId: props.selectedChatUserInfo._id,
        message: message
      });
    }
    setMessage ('');
  }

  return (
    <Box className={classes.root}>
      <AppBar position="static">
			  <Toolbar>
				  <Typography variant="h8">{"Nachrichtenverlauf mit " + props.selectedChatUserInfo.name}</Typography>
			  </Toolbar>
		  </AppBar>
      <Paper>
        <Box pb={3}>
          <Grid container>
            <Grid item xs={12}>
              <Box className={classes.chatmessages}>
                <List>
                  {messagesAsListElm}
                </List>
              </Box>
            </Grid>
            <Grid item xs={12} pb={3}>
              <Divider />
            </Grid>
            <Grid item xs={10} pl={3}>
              <FormControl fullWidth>
                <TextField label="Nachricht" value={message} required variant='outlined' onChange={onChangeMessage}></TextField>
              </FormControl>
            </Grid>
            <Grid item xs={2}  pl={3} pr={3} >
              <Button variant="contained" fullWidth endIcon={<Icon>send</Icon>} onClick={onClickSend}>
                Senden
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
