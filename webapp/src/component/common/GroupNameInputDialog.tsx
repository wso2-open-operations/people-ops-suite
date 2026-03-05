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
