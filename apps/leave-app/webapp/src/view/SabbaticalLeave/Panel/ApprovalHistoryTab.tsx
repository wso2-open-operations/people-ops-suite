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

import { CircularProgress, Stack } from "@mui/material";

import { useEffect } from "react";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import {
  fetchLeaveHistory,
  selectLeaveState,
  selectLeaves,
} from "@root/src/slices/leaveSlice/leave";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { selectUser } from "@root/src/slices/userSlice/user";
import { State, Status } from "@root/src/types/types";
import ApprovalHistoryTable from "@root/src/view/SabbaticalLeave/component/ApprovalHistoryTable";

export default function ApprovalHistoryTab() {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUser);
  const leaveState = useAppSelector(selectLeaveState);
  const leaves = useAppSelector(selectLeaves);
  const loading = leaveState === State.loading;

  useEffect(() => {
    if (userInfo?.workEmail) {
      dispatch(
        fetchLeaveHistory({
          approverEmail: userInfo.workEmail,
          statuses: [Status.APPROVED, Status.REJECTED],
        }),
      );
    }
  }, [dispatch, userInfo?.workEmail]);

  return (
    <Stack gap="2rem" flexDirection="column" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      <Title firstWord="Approval" secondWord="History" />
      {loading ? (
        <Stack alignItems="center" justifyContent="center" minHeight="200px">
          <CircularProgress size={30} />
        </Stack>
      ) : (
        <ApprovalHistoryTable rows={leaves} />
      )}
    </Stack>
  );
}
