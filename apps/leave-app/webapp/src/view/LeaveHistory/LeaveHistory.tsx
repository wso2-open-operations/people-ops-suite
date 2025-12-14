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
import { Box, CircularProgress, Stack } from "@mui/material";
import { useSelector } from "react-redux";

import { useEffect, useState } from "react";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";
import { getLeaveHistory } from "@root/src/services/leaveService";
import { selectUserEmail } from "@root/src/slices/userSlice/user";
import { SingleLeaveHistory } from "@root/src/types/types";

import LeaveCard from "./component/LeaveCard";

export default function LeaveHistory() {
  const [leaves, setLeaves] = useState<SingleLeaveHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const userInfo = useSelector(selectUserEmail);

  useEffect(() => {
    const fetchLeaveHistory = async () => {
      setLoading(true);

      try {
        const response = await getLeaveHistory({
          isActive: true,
          email: userInfo?.workEmail || "",
          startDate: `${new Date().getFullYear()}-01-01`, // first day of the current year
        });

        setLeaves(response.leaves);
      } catch (err) {
        console.error("Failed to load leave history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveHistory();
  }, []);

  const getMonthAndDay = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const day = date.getDate().toString();
    return { month, day };
  };

  return (
    <Stack maxWidth={PAGE_MAX_WIDTH} margin="auto" gap="1.5rem">
      <Title firstWord="Leave" secondWord="History" />
      <Box gap="2rem" display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr" }}>
        {loading && <CircularProgress size={30} />}
        {leaves.map((leave) => {
          const { month, day } = getMonthAndDay(leave.startDate);
          return (
            <LeaveCard
              key={leave.id}
              id={leave.id}
              type={`${leave.leaveType.toUpperCase()} LEAVE`}
              startDate={leave.startDate.substring(0, 10)}
              endDate={leave.endDate.substring(0, 10)}
              duration={`${leave.numberOfDays} days`}
              status="approved"
              month={month}
              day={day}
            />
          );
        })}
      </Box>
    </Stack>
  );
}
