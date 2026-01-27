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
import { Stack, Typography, useTheme } from "@mui/material";

import { useEffect } from "react";

import { DayPortion, DayPortionLabel, LeaveLabel, LeaveType } from "@root/src/types/types";

import DatePill from "./DatePill";
import LeaveSelectionIcon from "./LeaveSelectionIcon";

interface LeaveSelectionProps {
  daysSelected: number;
  selectedLeaveType: LeaveType;
  onLeaveTypeChange: (leaveType: LeaveType) => void;
  selectedDayPortion: DayPortion | null;
  onDayPortionChange: (dayPortion: DayPortion | null) => void;
}

export default function LeaveSelection({
  daysSelected,
  selectedLeaveType,
  onLeaveTypeChange,
  selectedDayPortion,
  onDayPortionChange,
}: LeaveSelectionProps) {
  const theme = useTheme();
  const isHalfDayDisabled = daysSelected !== 1;

  useEffect(() => {
    if (
      (daysSelected > 1 || selectedDayPortion === null) &&
      selectedDayPortion !== DayPortion.FULL
    ) {
      onDayPortionChange(DayPortion.FULL);
    }
  }, [daysSelected, selectedDayPortion, onDayPortionChange]);

  const handleLeaveTypeSelection = (leaveType: LeaveType) => {
    onLeaveTypeChange(leaveType);
  };

  const handleDayPortionSelection = (dayPortion: DayPortion) => {
    if (daysSelected > 1) return; // Prevent changing when days > 1
    onDayPortionChange(dayPortion);
  };

  return (
    <Stack direction="column" width={{ md: "50%" }} gap="1rem">
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Leave Type
      </Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <LeaveSelectionIcon
          Icon={WorkOffIcon}
          label={LeaveLabel.CASUAL}
          isSelected={selectedLeaveType === LeaveType.CASUAL}
          onClick={() => handleLeaveTypeSelection(LeaveType.CASUAL)}
        />
        <LeaveSelectionIcon
          Icon={PregnantWomanIcon}
          label={LeaveLabel.MATERNITY}
          isSelected={selectedLeaveType === LeaveType.MATERNITY}
          onClick={() => handleLeaveTypeSelection(LeaveType.MATERNITY)}
        />
        <LeaveSelectionIcon
          Icon={FamilyRestroomIcon}
          label={LeaveLabel.PATERNITY}
          isSelected={selectedLeaveType === LeaveType.PATERNITY}
          onClick={() => handleLeaveTypeSelection(LeaveType.PATERNITY)}
        />
        <LeaveSelectionIcon
          Icon={AccessTimeIcon}
          label={LeaveLabel.LIEU}
          isSelected={selectedLeaveType === LeaveType.LIEU}
          onClick={() => handleLeaveTypeSelection(LeaveType.LIEU)}
        />
      </Stack>
      <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
        Portion of the day
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent={{ md: "space-between" }}
        gap={{ xs: "2rem" }}
        alignItems="center"
      >
        <DatePill
          partOfDay={DayPortionLabel.FULL}
          isSelected={selectedDayPortion === DayPortion.FULL}
          onClick={() => handleDayPortionSelection(DayPortion.FULL)}
        />
        <DatePill
          partOfDay={DayPortionLabel.FIRST}
          isSelected={selectedDayPortion === DayPortion.FIRST}
          onClick={
            isHalfDayDisabled ? undefined : () => handleDayPortionSelection(DayPortion.FIRST)
          }
          disabled={isHalfDayDisabled}
        />
        <DatePill
          partOfDay={DayPortionLabel.SECOND}
          isSelected={selectedDayPortion === DayPortion.SECOND}
          onClick={
            isHalfDayDisabled ? undefined : () => handleDayPortionSelection(DayPortion.SECOND)
          }
          disabled={isHalfDayDisabled}
        />
      </Stack>
    </Stack>
  );
}
