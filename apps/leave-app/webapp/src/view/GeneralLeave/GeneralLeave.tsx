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

import { useEffect, useState } from "react";

import { FormContainer } from "@root/src/component/common/FormContainer";
import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { formatDateForApi, getLeaveEntitlement, submitLeaveRequest } from "@root/src/services/leaveService";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { DayPortion, EmployeeLocation, LeaveLabel, LeaveType, PeriodType } from "@root/src/types/types";
import AdditionalComment from "@root/src/view/GeneralLeave/component/AdditionalComment";
import LeaveBalanceSummary from "@root/src/view/GeneralLeave/component/LeaveBalanceSummary";
import LeaveDateSelection from "@root/src/view/GeneralLeave/component/LeaveDateSelection";
import LeaveSelection from "@root/src/view/GeneralLeave/component/LeaveSelection";
import NotifyPeople from "@root/src/view/GeneralLeave/component/NotifyPeople";

export default function GeneralLeave() {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.user.userInfo);
  const userLocation = userInfo?.location ?? null;
  const email = userInfo?.workEmail ?? "";

  /** Return the primary leave type for the employee's location. */
  const getDefaultLeaveType = (location: string | null): LeaveType => {
    switch (location) {
      case EmployeeLocation.FR:
        return LeaveType.CONGES_PAYES;
      case EmployeeLocation.ES:
        return LeaveType.SPAIN_ANNUAL;
      default:
        return LeaveType.CASUAL;
    }
  };

  /** Map a LeaveType enum value to its entitlement object key. */
  const getLeaveTypeEntitlementKey = (leaveType: LeaveType): string | null => {
    switch (leaveType) {
      case LeaveType.CONGES_PAYES:
        return "congesPayes";
      case LeaveType.RTT:
        return "rtt";
      case LeaveType.SPAIN_ANNUAL:
        return "spainAnnual";
      case LeaveType.SPAIN_CASUAL:
        return "spainCasual";
      case LeaveType.SICK:
        return "sick";
      case LeaveType.CASUAL:
        return "casual";
      case LeaveType.ANNUAL:
        return "annual";
      default:
        return null;
    }
  };

  const [daysSelected, setDaysSelected] = useState(0);
  const [workingDays, setWorkingDays] = useState(0);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType>(
    getDefaultLeaveType(userLocation),
  );
  const [selectedDayPortion, setSelectedDayPortion] = useState<DayPortion | null>(null);
  const [emailRecipients, setEmailRecipients] = useState<string[]>([]);
  const [mandatoryEmails, setMandatoryEmails] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isPublicComment, setIsPublicComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState(false);

  // Update the selected leave type when the user's location loads asynchronously.
  useEffect(() => {
    setSelectedLeaveType(getDefaultLeaveType(userLocation));
  }, [userLocation]);

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

      // Over-limit warning for France/Spain locations (non-blocking)
      if (
        userLocation === EmployeeLocation.FR ||
        userLocation === EmployeeLocation.ES
      ) {
        try {
          const entitlements = await getLeaveEntitlement(email);
          if (entitlements.length > 0) {
            const ent = entitlements[0];
            const leaveTypeKey = getLeaveTypeEntitlementKey(selectedLeaveType);
            if (leaveTypeKey) {
              const entitled =
                (ent.leavePolicy as Record<string, number | null | undefined>)[leaveTypeKey] ?? 0;
              const consumed =
                (ent.policyAdjustedLeave as Record<string, number | null | undefined>)[
                  leaveTypeKey
                ] ?? 0;
              if (entitled > 0 && consumed + workingDays > entitled) {
                const label =
                  LeaveLabel[selectedLeaveType as keyof typeof LeaveLabel] ?? selectedLeaveType;
                enqueueSnackbar(
                  `This request will exceed your ${label} entitlement (${consumed + workingDays}/${entitled} days)`,
                  { variant: "warning" },
                );
              }
            }
          }
        } catch {
          // Silently ignore — this is a best-effort check
        }
      }

      await submitLeaveRequest(payload);

      enqueueSnackbar("Leave request submitted successfully!", { variant: "success" });

      // Reset form
      setStartDate(null);
      setEndDate(null);
      setSelectedLeaveType(getDefaultLeaveType(userLocation));
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
        <LeaveBalanceSummary />
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
          />
          <LeaveSelection
            daysSelected={daysSelected}
            selectedLeaveType={selectedLeaveType}
            onLeaveTypeChange={setSelectedLeaveType}
            selectedDayPortion={selectedDayPortion}
            onDayPortionChange={setSelectedDayPortion}
            location={userLocation}
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
