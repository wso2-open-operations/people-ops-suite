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
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PregnantWomanIcon from "@mui/icons-material/PregnantWoman";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WorkOffIcon from "@mui/icons-material/WorkOff";
import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

import { useMemo, useEffect } from "react";

import {
  DayPortion,
  DayPortionLabel,
  EmployeeLocation,
  LeaveLabel,
  LeaveTooltip,
  LeaveType,
} from "@root/src/types/types";

import DatePill from "./DatePill";
import LeaveSelectionIcon from "./LeaveSelectionIcon";

/** Describes a leave type option shown in the UI. */
interface LeaveTypeOption {
  type: LeaveType;
  label: LeaveLabel;
  icon: SvgIconComponent;
  tooltip?: string;
}

/** Shared leave types available to all locations. */
const COMMON_LEAVE_TYPES: LeaveTypeOption[] = [
  { type: LeaveType.MATERNITY, label: LeaveLabel.MATERNITY, icon: PregnantWomanIcon },
  { type: LeaveType.PATERNITY, label: LeaveLabel.PATERNITY, icon: FamilyRestroomIcon },
  { type: LeaveType.LIEU, label: LeaveLabel.LIEU, icon: AccessTimeIcon },
];

/** Location‑specific leave types (rendered before the common ones). */
const LOCATION_LEAVE_TYPES: Record<string, LeaveTypeOption[]> = {
  [EmployeeLocation.LK]: [
    { type: LeaveType.CASUAL, label: LeaveLabel.CASUAL, icon: WorkOffIcon },
  ],
  [EmployeeLocation.FR]: [
    {
      type: LeaveType.CONGES_PAYES,
      label: LeaveLabel.CONGES_PAYES,
      icon: BeachAccessIcon,
      tooltip: LeaveTooltip[LeaveType.CONGES_PAYES],
    },
    {
      type: LeaveType.RTT,
      label: LeaveLabel.RTT,
      icon: ScheduleIcon,
      tooltip: LeaveTooltip[LeaveType.RTT],
    },
    {
      type: LeaveType.SICK,
      label: LeaveLabel.SICK,
      icon: LocalHospitalIcon,
    },
  ],
  [EmployeeLocation.ES]: [
    {
      type: LeaveType.SPAIN_ANNUAL,
      label: LeaveLabel.SPAIN_ANNUAL,
      icon: EventAvailableIcon,
      tooltip: LeaveTooltip[LeaveType.SPAIN_ANNUAL],
    },
    {
      type: LeaveType.SPAIN_CASUAL,
      label: LeaveLabel.SPAIN_CASUAL,
      icon: WorkOffIcon,
      tooltip: LeaveTooltip[LeaveType.SPAIN_CASUAL],
    },
    {
      type: LeaveType.SICK,
      label: LeaveLabel.SICK,
      icon: LocalHospitalIcon,
    },
  ],
};

interface LeaveSelectionProps {
  daysSelected: number;
  selectedLeaveType: LeaveType;
  onLeaveTypeChange: (leaveType: LeaveType) => void;
  selectedDayPortion: DayPortion | null;
  onDayPortionChange: (dayPortion: DayPortion | null) => void;
  /** Employee location (e.g. "Sri Lanka", "France", "Spain"). */
  location: string | null;
}

export default function LeaveSelection({
  daysSelected,
  selectedLeaveType,
  onLeaveTypeChange,
  selectedDayPortion,
  onDayPortionChange,
  location,
}: LeaveSelectionProps) {
  const theme = useTheme();
  const isHalfDayDisabled = daysSelected !== 1;

  /** Build the list of leave type options based on the employee location. */
  const leaveTypeOptions = useMemo<LeaveTypeOption[]>(() => {
    const locationSpecific =
      LOCATION_LEAVE_TYPES[location ?? EmployeeLocation.LK] ??
      LOCATION_LEAVE_TYPES[EmployeeLocation.LK];
    return [...locationSpecific, ...COMMON_LEAVE_TYPES];
  }, [location]);

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
      <Box
        display="grid"
        gridTemplateColumns="repeat(auto-fill, minmax(4.5rem, 1fr))"
        gap="0.75rem"
        width="100%"
      >
        {leaveTypeOptions.map((opt) => {
          const iconEl = (
            <LeaveSelectionIcon
              Icon={opt.icon}
              label={opt.label}
              isSelected={selectedLeaveType === opt.type}
              onClick={() => handleLeaveTypeSelection(opt.type)}
            />
          );
          return opt.tooltip ? (
            <Tooltip key={opt.type} title={opt.tooltip} arrow placement="top">
              <Box>{iconEl}</Box>
            </Tooltip>
          ) : (
            <Box key={opt.type}>{iconEl}</Box>
          );
        })}
      </Box>
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
