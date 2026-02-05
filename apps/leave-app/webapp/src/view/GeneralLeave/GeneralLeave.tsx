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

import { Stack } from "@mui/material";
import { Dayjs } from "dayjs";
import { useSnackbar } from "notistack";

import { useState } from "react";

import { FormContainer } from "@root/src/component/common/FormContainer";
import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { formatDateForApi, submitLeaveRequest } from "@root/src/services/leaveService";
import { useAppSelector } from "@root/src/slices/store";
import { DayPortion, LeaveType, PeriodType } from "@root/src/types/types";
import AdditionalComment from "@root/src/view/GeneralLeave/component/AdditionalComment";
import LeaveDateSelection from "@root/src/view/GeneralLeave/component/LeaveDateSelection";
import LeaveSelection from "@root/src/view/GeneralLeave/component/LeaveSelection";
import NotifyPeople from "@root/src/view/GeneralLeave/component/NotifyPeople";

export default function GeneralLeave() {
  const { enqueueSnackbar } = useSnackbar();
  const { entitlements } = useAppSelector((state) => state.entitlement);
  const [daysSelected, setDaysSelected] = useState(0);
  const [workingDays, setWorkingDays] = useState(0);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>(LeaveType.CASUAL);
  const [selectedDayPortion, setSelectedDayPortion] = useState<DayPortion | null>(null);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [mandatoryEmails, setMandatoryEmails] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isPublicComment, setIsPublicComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState(false);

  const currentYearEntitlement = entitlements.find((e) => e.year === new Date().getFullYear());
  const getLeaveDaysRequested = (): number => {
    if (selectedDayPortion === DayPortion.FIRST || selectedDayPortion === DayPortion.SECOND) {
      return 0.5;
    }
    return workingDays;
  };

  // Validate leave against entitlement
  const validateLeaveEntitlement = (): boolean => {
    if (!currentYearEntitlement) return true;

    const leaveDays = getLeaveDaysRequested();
    const { policyAdjustedLeave } = currentYearEntitlement;

    if (selectedLeaveType === LeaveType.CASUAL && leaveDays > policyAdjustedLeave.casual) {
      enqueueSnackbar(
        `Requested ${leaveDays} casual leave day(s) exceeds your available balance of ${policyAdjustedLeave.casual} day(s).`,
        { variant: "error" },
      );
      return false;
    }

    if (selectedLeaveType === LeaveType.ANNUAL && leaveDays > policyAdjustedLeave.annual) {
      enqueueSnackbar(
        `Requested ${leaveDays} annual leave day(s) exceeds your available balance of ${policyAdjustedLeave.annual} day(s).`,
        { variant: "error" },
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setDateError(false);
    if (!startDate || !endDate) {
      setDateError(true);
      enqueueSnackbar("Please select start and end dates", { variant: "error" });
      return;
    }

    if (workingDays <= 0) {
      setDateError(true);
      enqueueSnackbar("Working days must be at least 1 to submit a leave request", {
        variant: "error",
      });
      return;
    }

    if (!selectedDayPortion) {
      enqueueSnackbar("Please select a portion of the day", { variant: "error" });
      return;
    }

    if (!selectedLeaveType) {
      enqueueSnackbar("Please select a leave type", { variant: "error" });
      return;
    }

    if (!validateLeaveEntitlement()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Determine periodType based on day portion selection
      let periodType: PeriodType;
      let isMorningLeave: boolean | null = null;

      switch (selectedDayPortion) {
        case DayPortion.FULL:
          periodType = daysSelected === 1 ? PeriodType.ONE : PeriodType.MULTIPLE;
          break;
        case DayPortion.FIRST:
          periodType = PeriodType.HALF;
          isMorningLeave = true;
          break;
        case DayPortion.SECOND:
          periodType = PeriodType.HALF;
          isMorningLeave = false;
          break;
        default:
          periodType = daysSelected === 1 ? PeriodType.ONE : PeriodType.MULTIPLE;
          break;
      }
      // Filter out mandatory emails from the recipients list for the API call
      const filteredEmailRecipients = emailRecipients.filter(
        (email) => !mandatoryEmails.includes(email),
      );

      const payload = {
        periodType,
        startDate: formatDateForApi(startDate),
        endDate: formatDateForApi(endDate),
        isMorningLeave,
        comment,
        leaveType: selectedLeaveType as any,
        emailRecipients: filteredEmailRecipients,
        isPublicComment,
      };

      await submitLeaveRequest(payload);

      enqueueSnackbar("Leave request submitted successfully!", { variant: "success" });

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setSelectedLeaveType(LeaveType.CASUAL);
      setSelectedDayPortion(null);
      setComment("");
      setIsPublicComment(false);
    } catch (error: any) {
      console.error("Error submitting leave request:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to submit leave request. Please try again.";
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack direction="column" gap="1rem" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      <FormContainer>
        <Title firstWord="General" secondWord="Leave Submission" />
        <Stack
          direction={{ xs: "column", md: "row" }}
          width="100%"
          justifyContent={{ md: "space-between" }}
          gap={{ xs: "1.5rem" }}
        >
          <LeaveDateSelection
            onDaysChange={setDaysSelected}
            selectedDayPortion={selectedDayPortion}
            onDatesChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
            onWorkingDaysChange={setWorkingDays}
            hasError={dateError}
            onErrorClear={() => setDateError(false)}
            selectedLeaveType={selectedLeaveType}
            policyAdjustedLeave={currentYearEntitlement?.policyAdjustedLeave}
          />
          <LeaveSelection
            daysSelected={daysSelected}
            selectedLeaveType={selectedLeaveType}
            onLeaveTypeChange={setSelectedLeaveType}
            selectedDayPortion={selectedDayPortion}
            onDayPortionChange={setSelectedDayPortion}
          />
        </Stack>
        <NotifyPeople
          selectedEmails={emailRecipients}
          onEmailsChange={setEmailRecipients}
          onMandatoryEmailsChange={setMandatoryEmails}
        />
        <AdditionalComment
          comment={comment}
          onCommentChange={setComment}
          isPublicComment={isPublicComment}
          onPublicCommentChange={setIsPublicComment}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </FormContainer>
    </Stack>
  );
}
