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

import { CircularProgress, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useEffect, useState } from "react";

import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { Privileges } from "@root/src/slices/authSlice/auth";
import {
  fetchLeaveHistory,
  selectLeaveState,
  selectLeaves,
} from "@root/src/slices/leaveSlice/leave";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { selectUser } from "@root/src/slices/userSlice/user";
import { LeaveType, State, Status } from "@root/src/types/types";
import ApprovalHistoryTable from "@root/src/view/SabbaticalLeave/component/ApprovalHistoryTable";

export default function AdminSabbaticalTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUser);
  const leaveState = useAppSelector(selectLeaveState);
  const leaves = useAppSelector(selectLeaves);
  const loading = leaveState === State.loading;
  const [showAllEmployees, setShowAllEmployees] = useState(false);

  const isPeopleOpsTeam = userInfo?.privileges.includes(Privileges.PEOPLE_OPS_TEAM);

  useEffect(() => {
    if (userInfo?.workEmail) {
      dispatch(
        fetchLeaveHistory({
          leaveCategory: [LeaveType.SABBATICAL],
          statuses: [Status.PENDING, Status.APPROVED, Status.REJECTED, Status.CANCELLED],
          ...(showAllEmployees ? {} : { approverEmail: userInfo.workEmail }),
        }),
      );
    }
  }, [dispatch, userInfo?.workEmail, showAllEmployees]);

  return (
    <Stack gap="2rem" flexDirection="column" maxWidth={PAGE_MAX_WIDTH} mx="auto">
      {isPeopleOpsTeam && (
        <Stack direction="row" justifyContent="flex-end">
          <FormControlLabel
            control={
              <Switch
                checked={showAllEmployees}
                onChange={(e) => setShowAllEmployees(e.target.checked)}
              />
            }
            labelPlacement="bottom"
            label={
              showAllEmployees ? (
                <Typography color={theme.palette.text.primary}>All Employees</Typography>
              ) : (
                <Typography color={theme.palette.text.primary}>Subordinates Only</Typography>
              )
            }
          />
        </Stack>
      )}
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
