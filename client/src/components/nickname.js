import * as React from 'react';
import {Button, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@mui/material';

/**
 * Diese Komponente stellt einen Dialog dar, wo der Anwneder seinen Nickname
 * eintragen kann, womit dieser als Teilnehmer im Chat-Raum auftritt.
 *
 * @export
 * @param {*} props
 * @returns
 */
export default function NicknameDialog(props) {
	const usrname = (props && props.currentUser) ? props.currentUser.usrname : '';
	const [open, setOpen] = React.useState(true);
	const [nickname, setNickname] = React.useState(usrname);

	const handleClose = (resultTyp=0, nickname='') => {
		setOpen(false);
		if (props && props.resultCallback) {
			props.resultCallback ({resultTyp, nickname});
		}
	};

	const onNicknameChanged = (event) => {
		setNickname (event.target.value)
	};

	const onUebernehmenClick = () => {
		handleClose (1, nickname)
	}

	return (
		<div>
		<Dialog open={open} onClose={handleClose}>
			<DialogTitle>Dein Nickname</DialogTitle>
			<DialogContent>
			<DialogContentText>
				Um die Welt von ChatNOW betreten zu können, gib bitte deinen Nickname an.
				Sollte der Nickname bereits vergeben sein, werden vorhandene Konversationen wiederhergestellt.
			</DialogContentText>
			<TextField
				autoFocus
				margin="dense"
				id="name"
				label="Nickname"
				fullWidth
				variant="outlined"
				value={nickname}
				onChange={onNicknameChanged}
			/>
			</DialogContent>
			<DialogActions>
			<Button onClick={handleClose}>Abbrechen</Button>
			<Button onClick={onUebernehmenClick}>Übernehmen</Button>
			</DialogActions>
		</Dialog>
		</div>
	);
}
