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
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import PregnantWomanIcon from "@mui/icons-material/PregnantWoman";
import WorkOffIcon from "@mui/icons-material/WorkOff";
import { Stack, Typography } from "@mui/material";

import DatePill from "./DatePill";
import LeaveSelectionIcon from "./LeaveSelectionIcon";

export default function LeaveSelection() {
  return (
    <Stack direction="column" width={{ md: "50%" }} gap={4.5}>
      <Typography variant="h5" style={{}}>
        Leave Type
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <LeaveSelectionIcon Icon={WorkOffIcon} label="Casual Leave" isSelected={false} />
        <LeaveSelectionIcon Icon={PregnantWomanIcon} label="Maternity" isSelected={false} />
        <LeaveSelectionIcon Icon={FamilyRestroomIcon} label="Paternity" isSelected={false} />
        <LeaveSelectionIcon Icon={AccessTimeIcon} label="Lieu" isSelected={false} />
      </Stack>
      <Typography variant="h5" style={{}}>
        Portion of the day
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent={{ md: "space-between" }}
        gap={{ xs: "2rem" }}
        alignItems="center"
      >
        <DatePill partOfDay="Full Day" />
        <DatePill partOfDay="First Half" />
        <DatePill partOfDay="Second Half" />
      </Stack>
    </Stack>
  );
}
