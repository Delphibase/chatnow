import React from 'react';
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

export default function ChatList(args) {
  const classes = useStyles();
  const props = args[0] || null;

  return (
	<Box className={classes.root}>
		<AppBar position="static">
			<Toolbar>
				<Typography variant="h8">Meine Chats</Typography>
			</Toolbar>
		</AppBar>
		<Paper style={{height: '100%'}}>
			<List>
			<ListItem button>
				<ListItemAvatar>
				<Avatar>
					<People />
				</Avatar>
				</ListItemAvatar>
				<ListItemText primary="Dirk Wetzels" />
			</ListItem>
			</List>
		</Paper>
	</Box>
  );
}
