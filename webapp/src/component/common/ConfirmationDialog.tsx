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
import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import React from "react";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  cancelText?: string;
  okText: string;
  onConfirm: () => void;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  showLoading?: boolean;
  isLoading?: boolean;
  isWarning?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  title,
  message,
  cancelText = "Cancel",
  okText,
  onConfirm,
  ariaLabelledby = "confirmation-dialog-title",
  ariaDescribedby = "confirmation-dialog-description",
  showLoading = false,
  isLoading = false,
  isWarning = false,
}) => {
  return (
    <Dialog
      maxWidth="md"
      fullWidth={true}
      open={open}
      onClose={onClose}
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
    >
      <DialogTitle id="confirmation-dialog-title" variant="h4">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color={isWarning ? "error" : "primary"} variant="outlined">
          {cancelText}
        </Button>
        {!showLoading ? (
          <Button color={isWarning ? "error" : "primary"} variant="contained" onClick={onConfirm}>
            {okText}
          </Button>
        ) : (
          <LoadingButton
            color={isWarning ? "error" : "primary"}
            onClick={onConfirm}
            loading={isLoading}
            variant={isLoading ? "outlined" : "contained"}
          >
            <span>Confirm</span>
          </LoadingButton>
        )}
      </DialogActions>
    </Dialog>
  );
};
