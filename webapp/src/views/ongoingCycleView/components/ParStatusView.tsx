// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useEffect, useState } from "react";
import { Alert, Box, Button } from "@mui/material";
import { EmployeePar } from "@components/common/EmployeePar";
import { ParCycle, ParEmployeeStatus, ParLeadStatus } from "@utils/types";
import { ParInputForm } from "./ParInputForm";
import { useAppSelector } from "@slices/store";
import { selectEmployeeRatings } from "@slices/employeeSlice";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { uiMessages } from "@config/constant";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
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
        <Box>
          {!isDeadlinePassed && (
            <Alert severity="info">
              {`Please share your PAR before the deadline: ${dayjs
                .utc(currentCycle.parEmployeeDeadline)
                .format("D MMM 'YY")}`}
            </Alert>
          )}
          {isDeadlinePassed && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {`The deadline for submitting the PAR has passed on ${dayjs
                .utc(currentCycle.parEmployeeDeadline)
                .format("D MMM 'YY")}`}
            </Alert>
          )}

          {!isParInputViewOpen && (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              sx={{ minHeight: "calc(100vh - 450px)" }}
            >
              <Box>
                <Button
                  disabled={isDeadlinePassed}
                  onClick={openParInputView}
                  variant="contained"
                  endIcon={<PlayCircleOutlineIcon sx={{ mb: "0.1rem" }} />}
                >
                  Start
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {(isParInputViewOpen ||
        employeeRatings?.parEmployeeStatus === ParEmployeeStatus.DRAFT) &&
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
      {employeeRatings?.parEmployeeStatus ===
        ParEmployeeStatus.SHARED_BLOCKED &&
        employeeRatings?.parLeadStatus !== ParLeadStatus.SHARED && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {uiMessages.alert.employeeParSharedLocked}
          </Alert>
        )}
      {employeeRatings?.parEmployeeStatus ===
        ParEmployeeStatus.SHARED_BLOCKED &&
        employeeRatings?.parLeadStatus === ParLeadStatus.SHARED && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {uiMessages.alert.leadReviewSharedForEmployee}
          </Alert>
        )}

      {(employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED ||
        employeeRatings?.parEmployeeStatus ===
          ParEmployeeStatus.SHARED_BLOCKED) && (
        <EmployeePar
          selectedCycle={currentCycle}
          isDeadlinePassed={isDeadlinePassed}
        />
      )}
    </>
  );
};
