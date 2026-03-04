import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

import { CommonMessage } from "@config/messages";

interface SessionWarningDialogProps {
  open: boolean;
  handleContinue: () => void;
  appSignOut: () => void;
}

function SessionWarningDialog(props: SessionWarningDialogProps) {
  const { open, handleContinue, appSignOut } = props;
  return (
    <Dialog
      open={open}
      onClose={handleContinue}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{CommonMessage.session.title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {CommonMessage.session.description}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleContinue}>{CommonMessage.session.continueButton}</Button>
        <Button onClick={() => appSignOut()}>{CommonMessage.session.logoutButton}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionWarningDialog;
