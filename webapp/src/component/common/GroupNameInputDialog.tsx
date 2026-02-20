// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { FC, FormEvent, useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { uiMessages } from "@config/constant";

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  groupNames: string[];
  onSave: (groupName: string) => void;
}

const InputDialog: FC<InputDialogProps> = ({
  open,
  onClose,
  groupNames,
  onSave,
}) => {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isValidGroupName = (name: string) => {
    if (!name || name.trim() === "") {
      return uiMessages.error.emptyGroupName;
    }
    const invalidChars = /[^a-zA-Z0-9\s]/;
    if (invalidChars.test(name)) {
      return uiMessages.error.invalidGroupname;
    }

    if (
      groupNames.some(
        (groupName) => groupName.toLowerCase() === name.toLowerCase()
      )
    ) {
      return uiMessages.error.existingGroupName;
    }
    return null;
  };

  const handleSave = () => {
    const validationError = isValidGroupName(groupName);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(groupName);
    onClose();
  };

  const handleClose = () => {
    setGroupName("");
    setError(null);
    onClose();
  };

  useEffect(() => {
    if (open) {
      setGroupName("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSave();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>New Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {uiMessages.dialog.groupNameInput.title}
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="groupName"
            name="groupName"
            type="text"
            fullWidth
            variant="outlined"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            error={!!error}
            inputProps={{ maxLength: 50 }}
            helperText={error}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InputDialog;
