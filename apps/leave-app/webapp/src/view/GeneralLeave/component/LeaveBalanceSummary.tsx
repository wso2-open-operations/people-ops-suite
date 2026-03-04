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

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  Box,
  CircularProgress,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";

import { useCallback, useEffect, useState } from "react";

import { getLeaveEntitlement } from "@root/src/services/leaveService";
import { useAppSelector } from "@root/src/slices/store";
import {
  EmployeeLocation,
  LeaveEntitlement,
  LeaveLabel,
  LeaveTooltip,
  LeaveType,
} from "@root/src/types/types";

/** A single balance row configuration. */
interface BalanceRow {
  label: string;
  tooltip?: string;
  entitled: number;
  consumed: number;
  periodLabel?: string;
}

/** Map a leave-type key to a friendly label. */
const LEAVE_KEY_LABEL: Record<string, { label: string; tooltip?: string }> = {
  congesPayes: { label: LeaveLabel.CONGES_PAYES, tooltip: LeaveTooltip[LeaveType.CONGES_PAYES] },
  rtt: { label: LeaveLabel.RTT, tooltip: LeaveTooltip[LeaveType.RTT] },
  spainAnnual: {
    label: LeaveLabel.SPAIN_ANNUAL,
    tooltip: LeaveTooltip[LeaveType.SPAIN_ANNUAL],
  },
  spainCasual: {
    label: LeaveLabel.SPAIN_CASUAL,
    tooltip: LeaveTooltip[LeaveType.SPAIN_CASUAL],
  },
  sick: { label: LeaveLabel.SICK },
};

/** Keys to display for each location. */
const LOCATION_KEYS: Record<string, string[]> = {
  [EmployeeLocation.FR]: ["congesPayes", "rtt", "sick"],
  [EmployeeLocation.ES]: ["spainAnnual", "spainCasual", "sick"],
};

/** Format a period label from ISO dates. */
function formatPeriod(start?: string | null, end?: string | null): string | undefined {
  if (!start || !end) return undefined;
  return `${dayjs(start).format("MMM YYYY")} – ${dayjs(end).format("MMM YYYY")}`;
}

export default function LeaveBalanceSummary() {
  const theme = useTheme();
  const userInfo = useAppSelector((state) => state.user.userInfo);
  const location = userInfo?.location ?? null;
  const email = userInfo?.workEmail ?? "";

  const [entitlement, setEntitlement] = useState<LeaveEntitlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlement = useCallback(async () => {
    if (!email || !location) return;
    // Only show for France & Spain
    if (location !== EmployeeLocation.FR && location !== EmployeeLocation.ES) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getLeaveEntitlement(email);
      if (data.length > 0) {
        setEntitlement(data[0]);
      }
    } catch (err: unknown) {
      console.error("Failed to fetch leave entitlement:", err);
      setError("Unable to load leave balance");
    } finally {
      setLoading(false);
    }
  }, [email, location]);

  useEffect(() => {
    fetchEntitlement();
  }, [fetchEntitlement]);

  // Only render for France and Spain employees
  if (!location || (location !== EmployeeLocation.FR && location !== EmployeeLocation.ES)) {
    return null;
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={2}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error" py={1}>
        {error}
      </Typography>
    );
  }

  if (!entitlement) return null;

  const keys = LOCATION_KEYS[location] ?? [];
  const rows: BalanceRow[] = keys
    .map((key) => {
      const meta = LEAVE_KEY_LABEL[key];
      if (!meta) return null;
      const entitled =
        (entitlement.leavePolicy as Record<string, number | null | undefined>)[key] ?? 0;
      const consumed =
        (entitlement.policyAdjustedLeave as Record<string, number | null | undefined>)[key] ?? 0;
      return {
        label: meta.label,
        tooltip: meta.tooltip,
        entitled,
        consumed,
        periodLabel: formatPeriod(entitlement.periodStart, entitlement.periodEnd),
      } satisfies BalanceRow;
    })
    .filter(Boolean) as BalanceRow[];

  if (rows.length === 0) return null;

  return (
    <Stack gap={1.5} py={1}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="subtitle2" fontWeight={600} color={theme.palette.text.primary}>
          Leave Balance
        </Typography>
        {rows[0]?.periodLabel && (
          <Typography variant="caption" color={theme.palette.text.secondary}>
            ({rows[0].periodLabel})
          </Typography>
        )}
      </Stack>

      {rows.map((row) => {
        const remaining = Math.max(row.entitled - row.consumed, 0);
        const progress = row.entitled > 0 ? (row.consumed / row.entitled) * 100 : 0;
        const isOverLimit = row.consumed > row.entitled && row.entitled > 0;

        return (
          <Stack key={row.label} gap={0.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" gap={0.5}>
                <Typography variant="body2" fontWeight={500}>
                  {row.label}
                </Typography>
                {row.tooltip && (
                  <Tooltip title={row.tooltip} arrow>
                    <InfoOutlinedIcon
                      sx={{ fontSize: 14, color: theme.palette.text.secondary, cursor: "help" }}
                    />
                  </Tooltip>
                )}
              </Stack>
              <Typography
                variant="body2"
                fontWeight={500}
                color={isOverLimit ? theme.palette.error.main : theme.palette.text.secondary}
              >
                {row.consumed} / {row.entitled} used
                {remaining > 0 && ` · ${remaining} remaining`}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(progress, 100)}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.action.hover,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  backgroundColor: isOverLimit
                    ? theme.palette.error.main
                    : progress > 80
                      ? theme.palette.warning.main
                      : theme.palette.primary.main,
                },
              }}
            />
          </Stack>
        );
      })}
    </Stack>
  );
}
