import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {AppBar, Toolbar, Box, Typography, Avatar, Grid} from "@mui/material"

const useStyles = makeStyles((theme) => ({
	root: {
	  flexGrow: 1
	},
  }));

export default function TitleBar (props) {
	const classes = useStyles();
	return (
		<Box className={classes.root}>
			<AppBar position="static">
				<Toolbar>
					<Grid container>
						<Grid item flexGrow={1}>
							<Typography variant="h6">ChatNOW</Typography>
						</Grid>
						<Grid item>
							<Avatar {...stringAvatar (props.currentUser.name)}/>
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
		</Box>
	)
}

function stringToColor(string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringAvatar(name) {
	let nameElements = name.split(' ');
	let letters = nameElements.length > 1 ?
		`${name.split(' ')[0][0]}${name.split(' ')[1][0]}` :
		`${name.split(' ')[0][0]}`;
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: letters,
  };
}