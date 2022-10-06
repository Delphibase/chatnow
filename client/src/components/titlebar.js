import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {AppBar, Toolbar, Box, Typography, Avatar, Grid} from "@mui/material"

const useStyles = makeStyles((theme) => ({
	root: {
	  flexGrow: 1
	},
  }));


/**
 * Diese Komponente stellt die Haupt-Titelbar der Anwendung dar.
 *
 * @export
 * @param {*} props
 * @returns
 */
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
							<Avatar {...getAvatarInitialien (props.currentUser.name)}/>
						</Grid>
					</Grid>
				</Toolbar>
			</AppBar>
		</Box>
	)
}

/**
 * Diese Funktion leitet auf dem Nickname einen Farb-Code für das Benutzer-Avatar
 * in der Titelbar ab.
 * 
 * @see https://mui.com/material-ui/react-avatar/
 *
 * @param {String} nickname
 * @returns
 */
function stringToColor(nickname) {
  let hash = 0;
  let i;

  for (i = 0; i < nickname.length; i += 1) {
    hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

/**
 * Diese Funktion ermittelt zum Nickname die Initialien
 * und Farbcode für das Avatar und liefert ein JSX-Ausdruck zurück
 *
 * @param {*} nickname
 * @returns
 */
function getAvatarInitialien(nickname) {
	let nameElements = nickname.split(' ');
	let letters = nameElements.length > 1 ?
		`${nickname.split(' ')[0][0]}${nickname.split(' ')[1][0]}` :
		`${nickname.split(' ')[0][0]}`;
  return {
    sx: {
      bgcolor: stringToColor(nickname),
    },
    children: letters,
  };
}