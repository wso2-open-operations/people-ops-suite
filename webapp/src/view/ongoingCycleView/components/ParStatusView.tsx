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
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { Alert, Box, Button } from "@mui/material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { useEffect, useState } from "react";

import { EmployeePar } from "@component/common/EmployeePar";
import { uiMessages } from "@config/constant";
import {
  ParEmployeeStatus,
  ParLeadStatus,
} from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";
import { selectEmployeeRatings } from "@slices/employeeSlice/employee";
import { useAppSelector } from "@slices/store";

import { ParInputForm } from "./ParInputForm";

dayjs.extend(utc);

interface ParStatusViewProps {
  currentCycle: Partial<ParCycle>;
}

export const ParStatusView = ({ currentCycle }: ParStatusViewProps) => {
  const employeeRatings = useAppSelector(selectEmployeeRatings);
  const [isParInputViewOpen, setIsParInputViewOpen] = useState(false);
  const openParInputView = () => setIsParInputViewOpen(true);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  useEffect(() => {
    // Interpreted in the user's browser timezone
    const deadlineLocal = dayjs(currentCycle.parEmployeeDeadline).endOf("day");
    setIsDeadlinePassed(dayjs().isAfter(deadlineLocal));
  }, [currentCycle]);

  return (
    <>
      {employeeRatings?.parEmployeeStatus === ParEmployeeStatus.PENDING && (
        <Box sx={{ flex: isParInputViewOpen ? "none" : 1, display: "flex", flexDirection: "column" }}>
          {!isDeadlinePassed && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              {`Please share your PAR before the deadline: ${dayjs
                .utc(currentCycle.parEmployeeDeadline)
                .format("D MMM 'YY")}`}
            </Alert>
          )}
          {isDeadlinePassed && (
            <Alert severity="error" sx={{ py: 0.5 }}>
              {`The deadline for submitting the PAR has passed on ${dayjs
                .utc(currentCycle.parEmployeeDeadline)
                .format("D MMM 'YY")}`}
            </Alert>
          )}

          {!isParInputViewOpen && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                disabled={isDeadlinePassed}
                onClick={openParInputView}
                variant="contained"
                endIcon={<PlayCircleOutlineIcon sx={{ mb: "0.1rem" }} />}
              >
                Start
              </Button>
            </Box>
          )}
        </Box>
      )}

      {(isParInputViewOpen || employeeRatings?.parEmployeeStatus === ParEmployeeStatus.DRAFT) &&
        currentCycle.parCycleConfigurations?.employeeParQuestion && (
          <>
            {employeeRatings?.parEmployeeStatus === ParEmployeeStatus.DRAFT && (
              <>
                {!isDeadlinePassed && (
                  <Alert severity="warning">
                    {uiMessages.alert.employeeParDraftSaved}{" "}
                    {`Please share your PAR on or before the deadline: ${dayjs
                      .utc(currentCycle.parEmployeeDeadline)
                      .format("D MMM 'YY")} `}
                  </Alert>
                )}

                {isDeadlinePassed && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {`The deadline for submitting the PAR has passed on ${dayjs
                      .utc(currentCycle.parEmployeeDeadline)
                      .format("D MMM 'YY")}`}
                  </Alert>
                )}
              </>
            )}

            <ParInputForm
              currentCycle={currentCycle}
              employeeRatings={employeeRatings}
              isDeadlinePassed={isDeadlinePassed}
            />
          </>
        )}

      {employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED &&
        employeeRatings?.parLeadStatus !== ParLeadStatus.SHARED && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {uiMessages.alert.employeeParShared}
          </Alert>
        )}
      {employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED_BLOCKED &&
        employeeRatings?.parLeadStatus !== ParLeadStatus.SHARED && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {uiMessages.alert.employeeParSharedLocked}
          </Alert>
        )}
      {employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED_BLOCKED &&
        employeeRatings?.parLeadStatus === ParLeadStatus.SHARED && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {uiMessages.alert.leadReviewSharedForEmployee}
          </Alert>
        )}

      {(employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED ||
        employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED_BLOCKED) && (
        <EmployeePar selectedCycle={currentCycle} isDeadlinePassed={isDeadlinePassed} />
      )}
    </>
  );
};
