// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import React, { FC, FormEvent, useEffect, useState } from "react";

import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { GroupedTeams } from "@utils/types";

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
    const updatedGroup = {
      ...group,
      allocatedLeads: leadEmails ?? [],
    };
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

  const textFieldStyles = {
    minWidth: "120px",
    "& input": {
      height: "5px",
      textAlign: "center",
    },
  };

  const commonTextFieldProps = {
    required: true,
    type: "number" as const,
    InputLabelProps: {
      shrink: true,
    },
    inputProps: {
      min: 0,
      pattern: "\\d*",
      maxLength: 3,
    },
    sx: textFieldStyles,
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{`Edit Group Settings: ${group.name}`}</DialogTitle>

        <DialogContent>
          <Box display="flex" justifyContent="center" marginTop={3}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Please set the desired quota values for the group
                </Typography>
              </Grid>
              {/* 5% Allocated Field */}
              <Grid size={{ xs: 6 }} textAlign="center">
                <Tooltip
                  arrow
                  title={uiMessages.tooltip.top5TextFieldHelper}
                  enterDelay={tooltipVisibilityDelay}
                  enterNextDelay={tooltipVisibilityDelay}
                >
                  <TextField
                    {...commonTextFieldProps}
                    id="outlined-required-top5"
                    label="5% Allocated"
                    helperText={`Total ${group.default5Slots}, Left ${group.default5Slots - group.allocated5Slots}`}
                    inputProps={{
                      ...commonTextFieldProps.inputProps,
                      max: group.default5Slots,
                    }}
                    onChange={(e) =>
                      handleInputChange("5Slots", e as React.ChangeEvent<HTMLInputElement>)
                    }
                    value={group.allocated5Slots ?? ""}
                  />
                </Tooltip>
              </Grid>

              {/* 20% Allocated Field */}
              <Grid size={{ xs: 6 }} textAlign="center">
                <Tooltip
                  arrow
                  title={uiMessages.tooltip.top20TextFieldHelper}
                  enterDelay={tooltipVisibilityDelay}
                  enterNextDelay={tooltipVisibilityDelay}
                >
                  <TextField
                    {...commonTextFieldProps}
                    id="outlined-required-top20"
                    label="20% Allocated"
                    helperText={`Total ${group.default20Slots}, Left ${group.default20Slots - group.allocated20Slots}`}
                    inputProps={{
                      ...commonTextFieldProps.inputProps,
                      max: group.default20Slots,
                    }}
                    onChange={(e) =>
                      handleInputChange("20Slots", e as React.ChangeEvent<HTMLInputElement>)
                    }
                    value={group.allocated20Slots ?? ""}
                  />
                </Tooltip>
              </Grid>

              {/* Email Selection Section */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Please select and assign the leads who can view this quota allocation
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }} maxWidth="50%" textAlign="center">
                <EmailAutocomplete
                  value={leadEmails || []}
                  onChange={handleEmailChange}
                  emailsToSkip={[]}
                  onBlur={() => {}}
                  error={leadError}
                  helperText={leadError ? "At least one lead email is required." : ""}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditQuotaDialog;
