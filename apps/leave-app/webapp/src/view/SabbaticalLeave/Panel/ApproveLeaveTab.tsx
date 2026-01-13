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
import { useSelector } from "react-redux";

import { useEffect, useState } from "react";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { getLeaveHistory } from "@root/src/services/leaveService";
import { selectUser } from "@root/src/slices/userSlice/user";
import { ApprovalStatus, LeaveHistoryResponse } from "@root/src/types/types";

import ApproveLeaveTable from "../component/ApproveLeaveTable";

export default function ApproveLeaveTab() {
  const theme = useTheme();
  const userInfo = useSelector(selectUser);
  const [loading, setLoading] = useState<boolean>(false);
  const [approvalHistory, setApprovalHistory] = useState<LeaveHistoryResponse>();
  // fetch the approval history data.
  useEffect(() => {
    const fetchApprovalHistory = async () => {
      setLoading(true);
      try {
        const approvalHistory: LeaveHistoryResponse = await getLeaveHistory({
          approverEmail: userInfo?.workEmail || "",
          statuses: [ApprovalStatus.PENDING],
        });
        setApprovalHistory(approvalHistory);
      } catch (error) {
        console.error("Failed to fetch approval history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchApprovalHistory();
  }, []);

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
          {userInfo?.subordinatePercentageOnSabbaticalLeave ?? "0%"} of your subordinates are on
          sabbatical leave
        </Alert>
      </Stack>
      {loading ? (
        <CircularProgress size={30} />
      ) : (
        <ApproveLeaveTable rows={approvalHistory?.leaves ?? []} />
      )}
    </Stack>
  );
}
