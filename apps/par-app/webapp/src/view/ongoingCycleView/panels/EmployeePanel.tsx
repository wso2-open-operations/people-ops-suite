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
