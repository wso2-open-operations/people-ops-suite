// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import { Alert, Box } from "@mui/material";

import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import { selectEmployeeStatus } from "@slices/employeeSlice/employee";
import { selectCurrentCycle, selectParCycleState } from "@slices/parCycleSlice/parCycle";
import { useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";

import { ParStatusView } from "../components/ParStatusView";

const EmployeePanel = () => {
  const employeeParCyclesLoadingState = useAppSelector(selectEmployeeStatus);
  const parCycleLoadingState = useAppSelector(selectParCycleState);
  const currentCycle = useAppSelector(selectCurrentCycle);

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      {(employeeParCyclesLoadingState === RequestState.LOADING ||
        parCycleLoadingState === RequestState.LOADING) && (
        <LoadingEffect message={uiMessages.loading.pageLoading} />
      )}

      {employeeParCyclesLoadingState === RequestState.SUCCEEDED &&
        parCycleLoadingState === RequestState.SUCCEEDED && (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {currentCycle?.parCycleId && <ParStatusView currentCycle={currentCycle} />}

            {!currentCycle?.parCycleId && parCycleLoadingState === RequestState.SUCCEEDED && (
              <Alert severity="info">{uiMessages.alert.employeeParNoOngoingCycle}</Alert>
            )}
          </Box>
        )}
    </Box>
  );
};

export default EmployeePanel;
