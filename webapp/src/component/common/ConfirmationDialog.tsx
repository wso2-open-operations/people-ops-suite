// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  cancelText?: string;
  okText: string;
  onConfirm: () => void;
  ariaLabelledby: string;
  ariaDescribedby: string;
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
        <DialogContentText id="confirmation-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color={isWarning ? "error" : "primary"}
          variant="outlined"
        >
          {cancelText}
        </Button>
        {!showLoading ? (
          <Button
            color={isWarning ? "error" : "primary"}
            variant="contained"
            onClick={onConfirm}
          >
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
