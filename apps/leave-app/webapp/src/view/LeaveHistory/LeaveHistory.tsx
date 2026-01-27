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

import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import { useEffect, useState } from "react";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import {
  cancelLeave,
  fetchLeaveHistory,
  selectCancellingLeaveId,
  selectLeaveState,
  selectLeaves,
} from "@root/src/slices/leaveSlice/leave";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { selectUser } from "@root/src/slices/userSlice/user";
import { OrderBy, State, Status } from "@root/src/types/types";

import LeaveCard from "./component/LeaveCard";

export default function LeaveHistory() {
  const dispatch = useAppDispatch();
  const [currentYear] = useState<number>(new Date().getFullYear());
  const userInfo = useAppSelector(selectUser);
  const leaveState = useAppSelector(selectLeaveState);
  const leaves = useAppSelector(selectLeaves);
  const cancellingLeaveId = useAppSelector(selectCancellingLeaveId);
  const loading = leaveState === State.loading;

  useEffect(() => {
    if (userInfo?.workEmail) {
      dispatch(
        fetchLeaveHistory({
          email: userInfo.workEmail,
          startDate: `${currentYear}-01-01`, // first day of the current year
          statuses: [Status.APPROVED, Status.PENDING],
          orderBy: OrderBy.DESC,
        }),
      );
    }
  }, [dispatch, currentYear, userInfo?.workEmail]);

  const getMonthAndDay = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = date.getDate().toString();
    return { month, day };
  };

  const handleDeleteLeave = async (id: number) => {
    dispatch(cancelLeave(id));
  };

  return (
    <Stack maxWidth={PAGE_MAX_WIDTH} margin="auto" gap="1.5rem">
      <Title firstWord="Leave" secondWord={`History (${currentYear})`} />
      <Box
        gap="2rem"
        display="grid"
        gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }}
        minHeight="200px"
      >
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="100%"
            gridColumn="1 / -1"
            minHeight="200px"
          >
            <CircularProgress size={30} />
          </Box>
        )}
        {!loading && leaves.length === 0 && <Typography>No leave history available.</Typography>}
        {!loading &&
          leaves.map((leave) => {
            const { month, day } = getMonthAndDay(leave.startDate);
            return (
              <LeaveCard
                key={leave.id}
                id={leave.id}
                type={`${leave.leaveType}`}
                startDate={leave.startDate.substring(0, 10)}
                endDate={leave.endDate.substring(0, 10)}
                duration={`${leave.numberOfDays} days`}
                month={month}
                day={day}
                cancelling={cancellingLeaveId === leave.id}
                onDelete={handleDeleteLeave}
              />
            );
          })}
      </Box>
    </Stack>
  );
}
