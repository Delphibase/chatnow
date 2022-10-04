import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {Box, Container, Paper, Grid, List, ListItem, ListItemText, FormControl, TextField, Button, Icon, Divider, AppBar, Toolbar, Typography} from '@mui/material';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: '10px',
  },
  chatmessages: {
    height: '500px',
    overflow: 'auto'
  }
}));

export default function ChatConversation(...args) {
  const props = args[0] || null;
  const classes = useStyles();

  const [messageList, setChatMessages] = React.useState ([{_id:5, username:'Dirk', message: 'ffff'},{_id:5, username:'Dirk', message: 'ffff'},{_id:5, username:'Dirk', message: 'ffff', isme: true}]);
  const [message, setMessage] = React.useState ('');

  const messagesAsListElm = messageList.map ((elm) => {
    const txtColor = elm.isme ? 'green' : 'blue';
    const txtAlign = elm.isme ? 'right' : 'left';
    return (
      <ListItem key={elm._id}>
        <ListItemText primaryTypographyProps={{ style: {color: txtColor, textAlign: txtAlign}}} secondaryTypographyProps={{style: {textAlign: txtAlign}}} primary={elm.username} secondary={elm.message}/>
      </ListItem>
    )
  });

  const onChangeMessage = (event) => {
    setMessage (event.target.value);
  }

  const onClickSend = (event) => {
    if (message) {
      console.log ("Dirk ", message, props)
    }
  }

  return (
    <Container className={classes.root}>
      <AppBar position="static">
			  <Toolbar>
				  <Typography variant="h8">Nachrichtenverlauf</Typography>
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
                <TextField label="Nachricht" required variant='outlined' onChange={onChangeMessage}></TextField>
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
    </Container>
  );
}
