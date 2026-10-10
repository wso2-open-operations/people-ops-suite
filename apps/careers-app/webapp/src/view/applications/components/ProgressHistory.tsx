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

import { Box, Stack, Typography } from "@mui/material";

import type { Application } from "@/types/types";
import { formatDate } from "@view/applications/applicationHelpers";
import SectionTitle from "@view/applications/components/SectionTitle";

interface ProgressHistoryProps {
  timeline: NonNullable<Application["timeline"]>;
}

// The application's stage changes, newest first.
const ProgressHistory = ({ timeline }: ProgressHistoryProps) => {
  if (timeline.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <SectionTitle>PROGRESS HISTORY</SectionTitle>
      <Stack gap={1}>
        {[...timeline].reverse().map((event, index) => (
          <Stack key={`${event.stage}-${event.date}-${index}`} direction="row" gap={2}>
            <Typography fontSize="0.85rem" color="text.secondary" sx={{ minWidth: 96 }}>
              {formatDate(event.date)}
            </Typography>
            <Typography fontSize="0.9rem" fontWeight={600}>
              {event.stage}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default ProgressHistory;
