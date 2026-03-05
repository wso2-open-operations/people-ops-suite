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
  Employee,
  selectEmployeeMap,
  fetchParticipants,
  selectParticipants,
  selectParticipantsStatus,
  fetchEntityEmployees,
  selectSubordinatesArray,
  selectSubordinates,
} from "@slices/metaSlice/meta";
import { RequestState } from "@utils/types";
import SyncIcon from "@mui/icons-material/Sync";
import { selectUserEmail } from "@slices/authSlice/auth";
import { useEffect, useMemo, useState } from "react";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { selectEmployeeRatingStatus, updateParTeamIdOfEmployee } from "@slices/employeeSlice/employee";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { SnackMessage, tooltipVisibilityDelay } from "@config/constant";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { Autocomplete, Avatar, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";
import { LoadingEffect } from "@component/ui/Loading";

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
            message: SnackMessage.success.employeeSync,
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
