// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
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
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          handleContinue();
        }
      }}
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
