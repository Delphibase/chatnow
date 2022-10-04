import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {AppBar, Toolbar, Box, Typography, IconButton, Menu, MenuItem} from "@mui/material"

const useStyles = makeStyles((theme) => ({
	root: {
	  flexGrow: 1
	},
  }));

export default function TitleBar () {
	const classes = useStyles();
	return (
		<Box className={classes.root}>
			<AppBar position="static">
				<Toolbar>
				{/* <IconButton edge="start" color="inherit">
					<MenuIcon />
				</IconButton> */}
				<Typography variant="h6">ChatNOW</Typography>
				</Toolbar>
			</AppBar>
		</Box>
	)
}