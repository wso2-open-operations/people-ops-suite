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

import React, { FC, FormEvent, useEffect, useState } from "react";

import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import type { GroupedTeams } from "@utils/types";

import { EmailAutocomplete } from "./EmailAutoComplete";

interface EditQuotaDialogProps {
  open: boolean;
  onClose: () => void;
  groupData: GroupedTeams;
  onSave: (group: GroupedTeams) => void;
}

const EditQuotaDialog: FC<EditQuotaDialogProps> = ({ open, onClose, onSave, groupData }) => {
  const [group, setGroup] = useState<GroupedTeams>(groupData);
  const [leadEmails, setLeadEmails] = useState<string[]>();
  const [leadError, setLeadError] = useState(false);

  useEffect(() => {
    if (open) {
      setGroup(groupData);
      setLeadEmails(groupData.allocatedLeads || []);
    }
  }, [open, groupData]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!leadEmails || leadEmails.length === 0) {
      setLeadError(true);
      return;
    }

    setLeadError(false);
    handleSave();
  };

  const handleSave = () => {
    const updatedGroup = { ...group, allocatedLeads: leadEmails ?? [] };
    onSave(updatedGroup);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleInputChange = (
    type: "5Slots" | "20Slots",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputValue = e.target.value;
    const value = inputValue === "" ? 0 : parseInt(inputValue, 10);
    const validatedValue = isNaN(value) ? 0 : Math.max(value, 0);

    if (type === "20Slots") {
      const capped20Slots = Math.min(validatedValue, group.default20Slots);
      const adjusted5Slots = Math.min(group.allocated5Slots, capped20Slots);
      setGroup({
        ...group,
        allocated20Slots: capped20Slots,
        allocated5Slots: adjusted5Slots,
        allocatedLeads: leadEmails ?? [],
      });
    } else {
      const capped5Slots = Math.min(validatedValue, group.default5Slots);
      if (capped5Slots > group.allocated20Slots) {
        setGroup({ ...group, allocated5Slots: group.allocated20Slots });
      } else {
        setGroup({ ...group, allocated5Slots: capped5Slots });
      }
    }
  };

  const handleEmailChange = (emails: string[]) => {
    setLeadEmails(emails);
  };

  const commonTextFieldProps = {
    required: true,
    type: "number" as const,
    size: "small" as const,
    fullWidth: true,
    InputLabelProps: { shrink: true },
    inputProps: { min: 0, pattern: "\\d*", maxLength: 3 },
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: 3, pt: 3, pb: 1.5 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <TuneIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Edit Group Settings
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {group.name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ px: 3, pt: 2.5, pb: 1 }}>
          {/* Quota section */}
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Please set the desired quota values for the group
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Grid size={{ xs: 6 }}>
              <Tooltip
                arrow
                title={uiMessages.tooltip.top5TextFieldHelper}
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <TextField
                  {...commonTextFieldProps}
                  id="outlined-required-top5"
                  label="Top 5% Allocated"
                  helperText={`Max: ${group.default5Slots} · Remaining: ${group.default5Slots - group.allocated5Slots}`}
                  inputProps={{ ...commonTextFieldProps.inputProps, max: group.default5Slots }}
                  onChange={(e) =>
                    handleInputChange("5Slots", e as React.ChangeEvent<HTMLInputElement>)
                  }
                  value={group.allocated5Slots ?? ""}
                />
              </Tooltip>
            </Grid>

            <Grid size={{ xs: 6 }}>
              <Tooltip
                arrow
                title={uiMessages.tooltip.top20TextFieldHelper}
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <TextField
                  {...commonTextFieldProps}
                  id="outlined-required-top20"
                  label="Top 20% Allocated"
                  helperText={`Max: ${group.default20Slots} · Remaining: ${group.default20Slots - group.allocated20Slots}`}
                  inputProps={{ ...commonTextFieldProps.inputProps, max: group.default20Slots }}
                  onChange={(e) =>
                    handleInputChange("20Slots", e as React.ChangeEvent<HTMLInputElement>)
                  }
                  value={group.allocated20Slots ?? ""}
                />
              </Tooltip>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 2.5 }} />

          {/* Lead assignment section */}
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Please select and assign the leads who can view this quota allocation
          </Typography>

          <EmailAutocomplete
            value={leadEmails || []}
            onChange={handleEmailChange}
            emailsToSkip={[]}
            onBlur={() => { }}
            error={leadError}
            helperText={leadError ? "At least one lead email is required." : ""}
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

export default EditQuotaDialog;
