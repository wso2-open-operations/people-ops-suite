// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";

import { useEffect, useState } from "react";

import CustomButton from "@root/src/component/common/CustomButton";
import { FormContainer } from "@root/src/component/common/FormContainer";
import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { getLeaveHistory, submitLeaveRequest } from "@root/src/services/leaveService";
import { selectUser } from "@root/src/slices/userSlice/user";
import {
  EligibilityResponse,
  LeaveHistoryResponse,
  LeaveType,
  OrderBy,
  Status,
} from "@root/src/types/types";

interface ApplyTabProps {
  sabbaticalPolicyUrl: string;
  sabbaticalUserGuideUrl: string;
  sabbaticalLeaveEligibilityDuration: number;
  sabbaticalLeaveMaxApplicationDuration: number;
}

dayjs.extend(utc);

export default function ApplyTab({
  sabbaticalPolicyUrl,
  sabbaticalUserGuideUrl,
  sabbaticalLeaveEligibilityDuration,
  sabbaticalLeaveMaxApplicationDuration,
}: ApplyTabProps) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const userInfo = useSelector(selectUser);

  const [eligibilityPayload, setEligibilityPayload] = useState<EligibilityResponse>({
    isEligible: false,
    employmentStartDate: "",
    lastSabbaticalLeaveEndDate: dayjs().toISOString(),
  });
  const [sabbaticalEndDateFieldEditable, setSabbaticalEndDateFieldEditable] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [lastSabbaticalLeaveEndDate, setLastSabbaticalLeaveEndDate] = useState<Dayjs | null>(null);
  const [leaveStartDate, setLeaveStartDate] = useState<Dayjs | null>(null);
  const [leaveEndDate, setLeaveEndDate] = useState<Dayjs | null>(null);
  const [additionalComment, setAdditionalComment] = useState<string>("");
  const [managerApprovalChecked, setManagerApprovalChecked] = useState(false);
  const [policyReadChecked, setPolicyReadChecked] = useState(false);
  const [resignationAcknowledgeChecked, setResignationAcknowledgeChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEligible, setIsEligible] = useState(true);
  const [canRenderSabbaticalFormField, setCanRenderSabbaticalFormField] = useState(true);
  const [startDateError, setStartDateError] = useState(false);
  const [endDateError, setEndDateError] = useState(false);
  const [durationExceedError, setDurationExceedError] = useState(false);
  const [managerApprovalError, setManagerApprovalError] = useState(false);
  const [policyReadError, setPolicyReadError] = useState(false);
  const [resignationAcknowledgeError, setResignationAcknowledgeError] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        // fetch last sabbatical leave end date
        setIsLoading(true);
        const lastSabbaticalLeaveDetails: LeaveHistoryResponse = await getLeaveHistory({
          email: userInfo?.workEmail || "",
          leaveCategory: [LeaveType.SABBATICAL],
          statuses: [Status.APPROVED],
          orderBy: OrderBy.DESC,
          limit: 1,
        });

        const lastLeaveEndDate = lastSabbaticalLeaveDetails?.leaves[0]?.endDate;
        const todayUtc = dayjs.utc().startOf("day");

        const employmentStartDateDiff =
          todayUtc.diff(dayjs(userInfo?.employmentStartDate).startOf("day"), "day") - 1;
        const lastSabbaticalLeaveDiff = lastLeaveEndDate
          ? todayUtc.diff(dayjs(lastLeaveEndDate).startOf("day"), "day") - 1
          : null;

        // Check eligibility conditions
        const isEmploymentEligible = employmentStartDateDiff >= sabbaticalLeaveEligibilityDuration;
        const isSabbaticalLeaveEligible =
          lastSabbaticalLeaveDiff === null ||
          lastSabbaticalLeaveDiff >= sabbaticalLeaveEligibilityDuration;

        let eligible = true;
        let errorMsg = "";

        if (!isEmploymentEligible && !isSabbaticalLeaveEligible) {
          eligible = false;
          errorMsg =
            "You are ineligible for the following reasons: (1) You must be employed for at least 3 years, and (2) Your last sabbatical leave was taken within the past 3 years.";
        } else if (!isEmploymentEligible) {
          eligible = false;
          errorMsg =
            "You must be employed for at least 3 years to be eligible for sabbatical leave.";
          setCanRenderSabbaticalFormField(false);
        } else if (!isSabbaticalLeaveEligible) {
          eligible = false;
          errorMsg =
            "Your last sabbatical leave was taken within the past 3 years, making you ineligible.";
        }

        if (!eligible) {
          setIsEligible(false);
          setErrorMessage(errorMsg);
        } else {
          setIsEligible(true);
          setErrorMessage("");
        }

        const eligibilityResponse: EligibilityResponse = {
          employmentStartDate: userInfo?.employmentStartDate || "",
          lastSabbaticalLeaveEndDate: lastLeaveEndDate || "",
          isEligible: eligible,
        };

        setEligibilityPayload(eligibilityResponse);
        if (eligibilityResponse?.lastSabbaticalLeaveEndDate) {
          setLastSabbaticalLeaveEndDate(dayjs(eligibilityResponse.lastSabbaticalLeaveEndDate));
        }
        if (
          eligibilityResponse?.lastSabbaticalLeaveEndDate.length === 0 &&
          eligibilityResponse.isEligible
        ) {
          setSabbaticalEndDateFieldEditable(true);
        }
      } catch (error) {
        console.error("Failed to check eligibility for sabbatical leave", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkEligibility();
  }, []);

  // Validate last sabbatical leave end date whenever it changes
  useEffect(() => {
    if (!sabbaticalEndDateFieldEditable || !lastSabbaticalLeaveEndDate) {
      return;
    }

    const todayUtc = dayjs.utc().startOf("day");
    const diffDays = todayUtc.diff(lastSabbaticalLeaveEndDate.startOf("day"), "day") - 1;

    if (diffDays < sabbaticalLeaveEligibilityDuration) {
      setIsEligible(false);
      setErrorMessage(
        "Your last sabbatical leave was taken within the past 3 years, making you ineligible.",
      );
      setEligibilityPayload((prev) => ({
        ...prev,
        isEligible: false,
      }));
    } else {
      setIsEligible(true);
      setErrorMessage("");
      setEligibilityPayload((prev) => ({
        ...prev,
        isEligible: true,
      }));
    }
  }, [
    lastSabbaticalLeaveEndDate,
    sabbaticalEndDateFieldEditable,
    sabbaticalLeaveEligibilityDuration,
  ]);
  // Validate leave dates to be stay within eligibility duration
  useEffect(() => {
    if (!leaveStartDate || !leaveEndDate) {
      setEndDateError(false);
      setDurationExceedError(false);
      return;
    }

    const daysDifference = leaveEndDate.diff(leaveStartDate, "day") + 1;
    if (daysDifference > sabbaticalLeaveMaxApplicationDuration) {
      setEndDateError(true);
      setDurationExceedError(true);
    } else {
      setEndDateError(false);
      setDurationExceedError(false);
    }
  }, [leaveStartDate, leaveEndDate, sabbaticalLeaveMaxApplicationDuration]);

  const handleOpenDialog = () => {
    setStartDateError(false);
    setEndDateError(false);
    setDurationExceedError(false);
    setManagerApprovalError(false);
    setPolicyReadError(false);
    setResignationAcknowledgeError(false);

    if (!leaveStartDate) {
      setStartDateError(true);
    }
    if (!leaveEndDate) {
      setEndDateError(true);
    }

    if (!leaveStartDate || !leaveEndDate) {
      enqueueSnackbar("Please select both start and end dates", { variant: "error" });
      return;
    }

    if (leaveEndDate.isBefore(leaveStartDate)) {
      enqueueSnackbar("End date must be after start date", { variant: "error" });
      return;
    }

    const daysDifference = leaveEndDate.diff(leaveStartDate, "day") + 1;
    if (daysDifference > sabbaticalLeaveMaxApplicationDuration) {
      setEndDateError(true);
      setDurationExceedError(true);
      enqueueSnackbar(
        `Sabbatical leave duration should be less than or equal to ${sabbaticalLeaveMaxApplicationDuration / 7} weeks`,
        {
          variant: "error",
        },
      );
      return;
    }

    // Validate last sabbatical leave end date (must be at least 3 years from today)
    if (lastSabbaticalLeaveEndDate) {
      const todayUtc = dayjs.utc().startOf("day");
      const diffDays = todayUtc.diff(lastSabbaticalLeaveEndDate.startOf("day"), "day") - 1;
      if (diffDays < sabbaticalLeaveEligibilityDuration) {
        enqueueSnackbar(
          `The last sabbatical leave end date should be at least ${sabbaticalLeaveEligibilityDuration / 365} years before today.`,
          { variant: "error" },
        );
        return;
      }
    }

    if (!managerApprovalChecked) {
      setManagerApprovalError(true);
    }
    if (!policyReadChecked) {
      setPolicyReadError(true);
    }
    if (!resignationAcknowledgeChecked) {
      setResignationAcknowledgeError(true);
    }

    if (!managerApprovalChecked || !policyReadChecked || !resignationAcknowledgeChecked) {
      enqueueSnackbar("Please acknowledge all the required checkboxes", { variant: "error" });
      return;
    }

    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Append last sabbatical leave end date to comment
      const commentWithDate = lastSabbaticalLeaveEndDate
        ? `${additionalComment} **** Last Sabbatical Leave End Date: ${lastSabbaticalLeaveEndDate.format("YYYY-MM-DD")} ****`
        : additionalComment;

      const response = await submitLeaveRequest({
        leaveType: LeaveType.SABBATICAL,
        startDate: leaveStartDate!.format("YYYY-MM-DD"),
        endDate: leaveEndDate!.format("YYYY-MM-DD"),
        comment: commentWithDate,
      });

      handleCloseDialog();
      enqueueSnackbar("Sabbatical leave request submitted successfully", { variant: "success" });

      setLeaveStartDate(null);
      setLeaveEndDate(null);
      setAdditionalComment("");
      setManagerApprovalChecked(false);
      setPolicyReadChecked(false);
      setResignationAcknowledgeChecked(false);
    } catch (error: any) {
      console.error("Failed to submit sabbatical leave request", error);
      if (error?.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar("Failed to submit sabbatical leave request", { variant: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isLoading ? (
        <Stack alignItems="center" justifyContent="center" minHeight="200px">
          <CircularProgress size={30} />
        </Stack>
      ) : (
        <Stack gap="1rem" flexDirection="column" maxWidth={PAGE_MAX_WIDTH} mx="auto">
          <FormContainer>
            <Stack
              direction={{ md: "row" }}
              justifyContent="space-between"
              alignItems="center"
              borderBottom={`1px solid ${theme.palette.divider}`}
              pb="1rem"
            >
              <Title firstWord="Sabbatical" secondWord="Leave Application" borderEnabled={false} />
              <Stack direction="row" gap="1rem" justifyContent="center" alignItems="center">
                <Link
                  href={sabbaticalUserGuideUrl}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                >
                  User Guide
                </Link>
              </Stack>
            </Stack>
            <Stack
              flexDirection={{ xs: "column", md: "row" }}
              gap="2rem"
              justifyContent="space-between"
            >
              <DatePicker
                label="Employment Start date"
                sx={{ flex: "1" }}
                value={dayjs(eligibilityPayload?.employmentStartDate)}
                format="YYYY-MM-DD"
                disabled
              />
              {canRenderSabbaticalFormField && (
                <DatePicker
                  label="Last sabbatical leave end date"
                  sx={{ flex: 1 }}
                  maxDate={dayjs().subtract(sabbaticalLeaveEligibilityDuration / 365, "year")}
                  value={lastSabbaticalLeaveEndDate ? dayjs(lastSabbaticalLeaveEndDate) : null}
                  onChange={(newValue) => setLastSabbaticalLeaveEndDate(newValue)}
                  disabled={!sabbaticalEndDateFieldEditable}
                  format="YYYY-MM-DD"
                  disableFuture
                />
              )}
            </Stack>
            {!eligibilityPayload?.isEligible && (
              <Alert variant="outlined" severity="warning">
                {errorMessage}
              </Alert>
            )}
            {eligibilityPayload?.isEligible && (
              <>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  gap="2rem"
                  justifyContent="space-between"
                >
                  <DatePicker
                    label="Leave request start date*"
                    sx={{ flex: "1" }}
                    value={leaveStartDate}
                    onChange={(newValue) => {
                      setLeaveStartDate(newValue);
                      setStartDateError(false);
                      setDurationExceedError(false);
                    }}
                    format="YYYY-MM-DD"
                    disablePast
                    slotProps={{
                      textField: {
                        error: startDateError,
                        helperText: startDateError ? "Start date is required" : "",
                      },
                    }}
                  />
                  <DatePicker
                    label="Leave request end date*"
                    sx={{ flex: "1" }}
                    value={leaveEndDate}
                    onChange={(newValue) => {
                      setLeaveEndDate(newValue);
                      setEndDateError(false);
                      setDurationExceedError(false);
                    }}
                    format="YYYY-MM-DD"
                    disablePast
                    slotProps={{
                      textField: {
                        error: endDateError,
                        helperText: endDateError
                          ? durationExceedError
                            ? `Leave duration must not exceed ${sabbaticalLeaveMaxApplicationDuration / 7} weeks`
                            : "End date is required"
                          : "",
                      },
                    }}
                  />
                </Stack>
                <Stack gap="0.8rem">
                  <Typography sx={{ color: theme.palette.text.primary }}>
                    Additional Comments:
                  </Typography>
                  <TextField
                    label="Add a comment..."
                    multiline
                    minRows={1}
                    fullWidth
                    variant="outlined"
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  />
                </Stack>
                <Stack gap="0.5rem">
                  <FormControlLabel
                    control={
                      <Checkbox
                        color={managerApprovalError ? "error" : "primary"}
                        checked={managerApprovalChecked}
                        onChange={(e) => {
                          setManagerApprovalChecked(e.target.checked);
                          setManagerApprovalError(false);
                        }}
                      />
                    }
                    label="I confirm that I have discussed my sabbatical leave plans with my lead and have obtained their approval."
                    sx={{
                      color: managerApprovalError
                        ? theme.palette.error.main
                        : theme.palette.text.primary,
                      "& .MuiFormControlLabel-label": {
                        color: managerApprovalError
                          ? theme.palette.error.main
                          : theme.palette.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                      },
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        color={policyReadError ? "error" : "primary"}
                        checked={policyReadChecked}
                        onChange={(e) => {
                          setPolicyReadChecked(e.target.checked);
                          setPolicyReadError(false);
                        }}
                      />
                    }
                    label={
                      <>
                        I have read and understood the terms of the{" "}
                        <Link
                          href={sabbaticalPolicyUrl}
                          target="_blank"
                          rel="noopener"
                          underline="hover"
                        >
                          Sabbatical Leave Policy
                        </Link>
                        .
                      </>
                    }
                    sx={{
                      color: policyReadError
                        ? theme.palette.error.main
                        : theme.palette.text.primary,
                      "& .MuiFormControlLabel-label": {
                        color: policyReadError
                          ? theme.palette.error.main
                          : theme.palette.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                      },
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        color={resignationAcknowledgeError ? "error" : "primary"}
                        checked={resignationAcknowledgeChecked}
                        onChange={(e) => {
                          setResignationAcknowledgeChecked(e.target.checked);
                          setResignationAcknowledgeError(false);
                        }}
                      />
                    }
                    label="I acknowledge that I cannot voluntarily resign from my employment for 6 months after completing sabbatical leave. If I do, I will be required to reimburse an amount equivalent to the salary paid to me during the sabbatical period."
                    sx={{
                      color: resignationAcknowledgeError
                        ? theme.palette.error.main
                        : theme.palette.text.primary,
                      "& .MuiFormControlLabel-label": {
                        color: resignationAcknowledgeError
                          ? theme.palette.error.main
                          : theme.palette.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                      },
                    }}
                  />
                </Stack>

                <Box mx={{ xs: "auto", md: "0" }} ml={{ md: "auto" }}>
                  <CustomButton label="Apply" onClick={handleOpenDialog} disabled={isSubmitting} />
                </Box>
              </>
            )}
          </FormContainer>
        </Stack>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Sabbatical Leave Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your sabbatical leave request for the period from{" "}
            {leaveStartDate?.format("YYYY-MM-DD")} to {leaveEndDate?.format("YYYY-MM-DD")}?
            <br />
            <br />
            Your request will be sent to your reporting lead
            {userInfo?.leadEmail ? (
              <>
                {" "}
                <strong>{userInfo.leadEmail}</strong>
              </>
            ) : (
              ""
            )}{" "}
            for approval.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isSubmitting} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmitting ? "Submitting..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
