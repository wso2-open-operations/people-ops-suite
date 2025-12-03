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

import { Box, Stack } from "@mui/material";

import Title from "@root/src/component/common/Title";
import { PAGE_MAX_WIDTH } from "@root/src/config/ui";

import { mockLeaveHistory } from "./MockData";
import LeaveCard from "./component/LeaveCard";

export default function LeaveHistory() {
  return (
    <Stack maxWidth={PAGE_MAX_WIDTH} margin="auto" gap="1.5rem">
      <Title firstWord="Leave" secondWord="History" />
      <Box gap="2rem" display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr" }}>
        {mockLeaveHistory.map((leave) => (
          <LeaveCard
            key={leave.id}
            id={leave.id}
            type={leave.type}
            startDate={leave.startDate}
            endDate={leave.endDate}
            duration={leave.duration}
            status={leave.status}
            month={leave.month}
            day={leave.day}
          />
        ))}
      </Box>
    </Stack>
  );
}
