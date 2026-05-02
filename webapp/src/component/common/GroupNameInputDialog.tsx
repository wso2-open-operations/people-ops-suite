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

import GroupWorkIcon from "@mui/icons-material/GroupWork";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";

import { uiMessages } from "@config/constant";

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  groupNames: string[];
  onSave: (groupName: string) => void;
}

const InputDialog: FC<InputDialogProps> = ({ open, onClose, groupNames, onSave }) => {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const getGroupNameError = (name: string): string | null => {
    if (!name || name.trim() === "") {
      return uiMessages.error.emptyGroupName;
    }
    if (/[^a-zA-Z0-9\s]/.test(name)) {
      return uiMessages.error.invalidGroupname;
    }
    if (groupNames.some((g) => g.toLowerCase() === name.toLowerCase())) {
      return uiMessages.error.existingGroupName;
    }
    return null;
  };

  const handleSave = () => {
    const validationError = getGroupNameError(groupName);
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
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <GroupWorkIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              New Group
            </Typography>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {uiMessages.dialog.groupNameInput.title}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Group Name"
            id="groupName"
            name="groupName"
            type="text"
            variant="outlined"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              if (error) setError(null);
            }}
            error={!!error}
            helperText={error}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pt: 1.5, pb: 3, gap: 1 }}>
          <Button onClick={handleClose} variant="outlined" fullWidth>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default InputDialog;
