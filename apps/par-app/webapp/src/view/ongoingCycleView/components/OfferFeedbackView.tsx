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

import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import {
  Autocomplete,
  Avatar,
  Box,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";

import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { tooltipVisibilityDelay } from "@config/constant";
import { selectUserEmail } from "@slices/authSlice/auth";
import {
  Employee,
  fetchParticipants,
  selectEmployeeMap,
  selectParticipants,
  selectParticipantsStatus,
} from "@slices/metaSlice/meta";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  fetchRequests,
  postReviewers,
  selectThreeSixtyReviewRequests,
  selectThreeSixtyReviewStatus,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";

interface OfferFeedbackViewProps {
  onClose: (emailToOfferFeedback: string) => void;
}

const OfferFeedbackView = ({ onClose }: OfferFeedbackViewProps) => {
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const employeeArray = useAppSelector(selectParticipants);
  const employeeArrayStatus = useAppSelector(selectParticipantsStatus);
  const reviewRequests = useAppSelector(selectThreeSixtyReviewRequests);
  const reviewerRequestStatus = useAppSelector(selectThreeSixtyReviewStatus);
  const [openOfferFeedbackDialog, setOpenOfferFeedbackDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (currentCycle.parCycleId) {
      dispatch(fetchParticipants({ parCycleId: currentCycle.parCycleId, leadEmail: null }));
    }
  }, [currentCycle, dispatch]);

  const handleEmployeeSelection = (employee: Employee | null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setOpenOfferFeedbackDialog(true);
    }
  };

  const handleOfferFeedbackDialogClose = () => {
    setOpenOfferFeedbackDialog(false);
    setSelectedEmployee(null);
  };

  const handleConfirmFeedbackProvideProceed = async () => {
    if (currentCycle.parCycleId && userEmail && selectedEmployee) {
      setOpenOfferFeedbackDialog(false);
      const resultAction = await dispatch(
        postReviewers({
          employeeId: selectedEmployee.workEmail,
          parCycleId: currentCycle.parCycleId,
          reviewerEmails: userEmail ? [userEmail] : [],
        }),
      );
      if (postReviewers.fulfilled.match(resultAction)) {
        dispatch(fetchRequests({ employeeId: userEmail, parCycleId: currentCycle.parCycleId }));
        onClose(selectedEmployee.workEmail);
      }
      setSelectedEmployee(null);
    }
  };

  const filteredEmployees = useMemo(() => {
    const filtered = employeeArray.filter(
      (employee) =>
        employee.workEmail !== userEmail &&
        !reviewRequests.some((request) => request.employeeEmail === employee.workEmail) &&
        (employee.employeeName.toLowerCase().includes(inputValue.toLowerCase()) ||
          employee.workEmail.toLowerCase().includes(inputValue.toLowerCase())),
    );

    return filtered.slice(0, 10);
  }, [employeeArray, userEmail, reviewRequests, inputValue]);

  return (
    <Box p={2}>
      <Autocomplete
        options={filteredEmployees}
        getOptionLabel={(option) => `${option.employeeName} (${option.workEmail})`}
        loading={
          employeeArrayStatus === RequestState.LOADING ||
          reviewerRequestStatus === RequestState.LOADING
        }
        value={selectedEmployee}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={(_, newValue) => handleEmployeeSelection(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Add subordinates to offer feedback"
            placeholder="Search by name or email"
            fullWidth
          />
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
                title="Provide Feedback"
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
                  <PlaylistAddIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        )}
      />
      <ConfirmationDialog
        open={openOfferFeedbackDialog}
        onClose={handleOfferFeedbackDialogClose}
        title="Provide Feedback"
        message={
          selectedEmployee
            ? `Are you sure you would like to provide feedback to ${selectedEmployee.workEmail}? This action cannot be undone.`
            : ""
        }
        okText="Yes"
        onConfirm={handleConfirmFeedbackProvideProceed}
        ariaLabelledby="alert-par-closing-dialog-title"
        ariaDescribedby="alert-par-closing-dialog-description"
        isWarning={true}
      />
    </Box>
  );
};

export default OfferFeedbackView;
