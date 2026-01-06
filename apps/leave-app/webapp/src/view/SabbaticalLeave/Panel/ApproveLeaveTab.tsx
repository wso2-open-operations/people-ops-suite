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

import { Alert, CircularProgress, Stack, useTheme } from "@mui/material";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { useApprovalHistoryData } from "@root/src/hooks/hooks";
import { ApprovalStatus } from "@root/src/types/types";

import ApproveLeaveTable from "../component/ApproveLeaveTable";

export default function ApproveLeaveTab() {
  const theme = useTheme();
  // fetch the approval history data.
  const { data, loading, refetch } = useApprovalHistoryData([ApprovalStatus.PENDING]);

  return (
    <Stack gap="2rem" flexDirection="column" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        borderBottom={`1px solid ${theme.palette.divider}`}
        pb="1rem"
      >
        <Title firstWord="Leave" secondWord="Approval" borderEnabled={false} />
        <Alert variant="outlined" severity="warning">
          {data.percentageOfEmployeesOnSabbaticalLeave} of your subordinates are on sabbatical leave
        </Alert>
      </Stack>
      {loading ? (
        <CircularProgress size={30} />
      ) : (
        <ApproveLeaveTable rows={data.leaveApprovalStatusList} onRefresh={refetch} />
      )}
    </Stack>
  );
}
