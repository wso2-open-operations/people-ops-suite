// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Employee,
  selectEmployeeMap,
  fetchParticipants,
  selectParticipants,
  selectParticipantsStatus,
  fetchEntityEmployees,
  selectSubordinatesArray,
  selectSubordinates,
} from "@slices/metaSlice";
import { RequestState } from "@utils/types";
import SyncIcon from "@mui/icons-material/Sync";
import { selectUserEmail } from "@slices/authSlice";
import { useEffect, useMemo, useState } from "react";
import { selectCurrentCycle } from "@slices/parCycleSlice";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { selectEmployeeRatingStatus, updateParTeamIdOfEmployee } from "@slices/employeeSlice";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { snackMessages, tooltipVisibilityDelay } from "@config/constant";
import { ConfirmationDialog } from "@components/common/ConfirmationDialog";
import { Autocomplete, Avatar, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { LoadingEffect } from "@components/ui/Loading";

type Props = { 
  leadonly?: boolean;
  onSyncSuccess?: () => void;
};

const EmployeeSyncModal: React.FC<Props> = ({ leadonly, onSyncSuccess }) => {
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const employeeArray = useAppSelector(selectSubordinatesArray);
  const employeeArrayStatus = useAppSelector(selectSubordinates);
  const [openSyncEmployeeDialog, setOpenSyncEmployeeDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const status = useAppSelector(selectEmployeeRatingStatus);

  useEffect(() => {
    if (leadonly) {
    if (userEmail) {
      dispatch(fetchEntityEmployees({ leadEmail: userEmail }));
      }
    } else {
      dispatch(fetchEntityEmployees({}));
    }
  }, [dispatch, leadonly, userEmail]);

  const handleEmployeeSelection = (employee: Employee | null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setOpenSyncEmployeeDialog(true);
    }
  };

  const handleEmployeeSyncDialogClose = () => {
    setOpenSyncEmployeeDialog(false);
    setSelectedEmployee(null);
  };

  const handleEmployeeSyncConfirmation = async () => {
    if (currentCycle.parCycleId && userEmail && selectedEmployee) {
      setOpenSyncEmployeeDialog(false);

      const resultAction = await dispatch(
        updateParTeamIdOfEmployee({
          employeeId: selectedEmployee.workEmail,
          parCycleId: currentCycle.parCycleId,
        })
      );
      if (updateParTeamIdOfEmployee.fulfilled.match(resultAction)) {
        dispatch(
          enqueueSnackbarMessage({
            message: snackMessages.success.employeeSync,
            type: "success",
          })
        );
        onSyncSuccess?.();
      }
      setSelectedEmployee(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    const filtered = employeeArray.filter(
      (employee) =>
        employee.workEmail !== userEmail &&
        (employee.employeeName.toLowerCase().includes(inputValue.toLowerCase()) ||
          employee.workEmail.toLowerCase().includes(inputValue.toLowerCase()))
    );

    return filtered.slice(0, 200);
  }, [employeeArray, userEmail, inputValue]);

  return (
    <Box p={2}>
      <Autocomplete
        options={filteredEmployees}
        getOptionLabel={(option) => `${option.employeeName} (${option.workEmail})`}
        loading={employeeArrayStatus === RequestState.LOADING}
        value={selectedEmployee}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(_, newValue) => handleEmployeeSelection(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Sync Employee Information" placeholder="Search by name or email" fullWidth />
        )}
        ListboxProps={{
          style: { maxHeight: "400px" },
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props}>
            <Box display="flex" alignItems="center" gap={2} width="100%">
              <Avatar
                src={employeeMap[option.workEmail]?.employeeThumbnail}
                alt={option.employeeName}
                sx={{ height: "2.2rem", width: "2.2rem" }}
              />
              <Box>
                <Typography variant="body1">{option.employeeName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.workEmail}
                </Typography>
              </Box>
              <Tooltip
                arrow
                title="Sync Information"
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <IconButton
                  size="small"
                  sx={{
                    ml: "auto",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "primary.main",
                      color: "white",
                    },
                  }}
                >
                  <SyncIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      />
      {status === RequestState.LOADING && <LoadingEffect message={"Syncing"} />}
      <ConfirmationDialog
        open={openSyncEmployeeDialog}
        onClose={handleEmployeeSyncDialogClose}
        title="Synchronize Employee Information"
        message={
          <>
            {selectedEmployee &&
              `Are you sure you to sync the details of ${selectedEmployee.workEmail}? This action cannot be undone.`}
          </>
        }
        okText="Yes"
        onConfirm={handleEmployeeSyncConfirmation}
        ariaLabelledby="alert-par-closing-dialog-title"
        ariaDescribedby="alert-par-closing-dialog-description"
        isWarning={true}
      />
    </Box>
  );
};

export default EmployeeSyncModal;
