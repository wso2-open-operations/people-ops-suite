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
} from "@slices/metaSlice/meta";
import {
  postReviewers,
  fetchRequests,
  selectThreeSixtyReviewStatus,
  selectThreeSixtyReviewRequests,
} from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";
import { selectUserEmail } from "@slices/authSlice/auth";
import { useEffect, useMemo, useState } from "react";
import { tooltipVisibilityDelay } from "@config/constant";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { ConfirmationDialog } from "@component/common/ConfirmationDialog";
import { Autocomplete, Avatar, Box, IconButton, TextField, Tooltip, Typography } from "@mui/material";

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
        })
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
          employee.workEmail.toLowerCase().includes(inputValue.toLowerCase()))
    );

    return filtered.slice(0, 10);
  }, [employeeArray, userEmail, reviewRequests, inputValue]);

  return (
    <Box p={2}>
      <Autocomplete
        options={filteredEmployees}
        getOptionLabel={(option) => `${option.employeeName} (${option.workEmail})`}
        loading={employeeArrayStatus === RequestState.LOADING || reviewerRequestStatus === RequestState.LOADING}
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
