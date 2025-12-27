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

import { Alert, Stack, useTheme } from "@mui/material";

import { useState } from "react";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";

import ApproveLeaveTable, { EmployeeApprovalData } from "../component/ApproveLeaveTable";

export default function ApproveLeaveTab() {
  const theme = useTheme();
  const [percentageOnSabbaticalLeave, setPercentageOnSabbaticalLeave] = useState("0%");
  const mockEmployeeApprovalData: EmployeeApprovalData[] = [];
  return (
    <Stack gap="2rem" flexDirection="column" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderBottom={`1px solid ${theme.palette.divider}`}
        pb="1rem"
      >
        <Title firstWord="Leave" secondWord="Approval / Rejection" borderEnabled={false} />
        <Alert variant="outlined" severity="warning">
          {percentageOnSabbaticalLeave} of the team is on sabbatical leave
        </Alert>
      </Stack>
      <ApproveLeaveTable rows={mockEmployeeApprovalData} />
    </Stack>
  );
}
