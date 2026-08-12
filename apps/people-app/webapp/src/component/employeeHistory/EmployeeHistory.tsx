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

import { useEffect, useMemo } from "react";
import { format } from "date-fns/format";
import { isValid } from "date-fns/isValid";
import { parseISO } from "date-fns/parseISO";
import { alpha, Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import CircularProgress from "@mui/material/CircularProgress";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import { State } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  EmploymentPeriod,
  fetchEmployeeHistory,
  HistoryEvent,
  PromotionRecord,
} from "@slices/employeeSlice/employeeHistory";

// Raw audit column names -> reader-facing labels. Keep in sync with
// TRACKED_EMPLOYEE_FIELDS in backend/modules/database/history.bal.
const FIELD_LABELS: Record<string, string> = {
  business_unit_id: "Business Unit",
  team_id: "Team",
  sub_team_id: "Sub-team",
  unit_id: "Unit",
  designation_id: "Designation",
  employment_type_id: "Employment Type",
  company_id: "Company",
  office_id: "Office",
  manager_email: "Reporting to",
  employee_status: "Employee Status",
  work_location: "Work Location",
  job_role: "Job Role",
  secondary_job_title: "Secondary Job Title",
  external_designation: "External Designation",
  house_id: "House",
  epf: "EPF Number",
  probation_end_date: "Probation End Date",
  agreement_end_date: "Agreement End Date",
  start_date: "Start Date",
};

const fieldLabel = (field: string): string =>
  FIELD_LABELS[field] ??
  field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// occurredOn/promotedDate arrive as raw SQL date/timestamp strings (the audit
// tables use TIMESTAMP columns), so a strict yyyy-MM-dd parser would blank
// them out. Parse leniently and format for display only.
const formatEventDate = (value: string | null | undefined): string => {
  if (!value) return "-";
  const parsed = parseISO(value.includes(" ") ? value.replace(" ", "T") : value);
  return isValid(parsed) ? format(parsed, "d MMM yyyy") : value;
};

const statusChipColors = (theme: Theme, status: string) => {
  const normalized = status.trim().toLowerCase();
  const mainColor =
    normalized === "marked leaver"
      ? theme.palette.warning.main
      : normalized === "left"
        ? theme.palette.error.main
        : theme.palette.success.main;
  return {
    color: mainColor,
    backgroundColor: alpha(mainColor, theme.palette.mode === "dark" ? 0.18 : 0.12),
  };
};

// A single row rendered on the spine: either a field-level change, a
// synthetic "Joined" row derived from the period's start date, or a
// promotion.
interface TimelineRow {
  key: string;
  // What the date column displays. Nullable for promotions whose promoted date
  // was never recorded in HRIS — those show their cycle name instead.
  date: string | null;
  // What the row is ordered by, kept separate from what it displays. For a
  // promotion this is its created date, which is always present even when the
  // promoted date is not.
  sortKey: string;
  isPromo: boolean;
  isJoin: boolean;
  isSystem: boolean;
  field: string;
  previousValue: string | null;
  currentValue: string | null;
  actionBy?: string;
  promotion?: PromotionRecord;
}

const buildRows = (period: EmploymentPeriod, events: HistoryEvent[]): TimelineRow[] => {
  const rows: TimelineRow[] = [];

  events
    .filter((event) => event.employeePkId === period.id)
    .forEach((event, index) => {
      rows.push({
        key: `event-${period.id}-${index}`,
        date: event.occurredOn,
        sortKey: event.occurredOn,
        isPromo: false,
        isJoin: false,
        isSystem: event.isSystem,
        field: event.field,
        previousValue: event.previousValue,
        currentValue: event.currentValue,
        actionBy: event.actionBy,
      });
    });

  period.promotions.forEach((promotion, index) => {
    rows.push({
      key: `promo-${period.id}-${index}`,
      date: promotion.promotedDate,
      // Ordered by when the request was raised, not by the promoted date —
      // the latter is frequently null in HRIS.
      sortKey: promotion.createdOn,
      isPromo: true,
      isJoin: false,
      isSystem: false,
      field: "Promotion",
      previousValue: promotion.currentJobBand,
      currentValue: promotion.nextJobBand,
      promotion,
    });
  });

  // Newest first, ordered by sortKey rather than the displayed date so a
  // promotion sits at the point its request was raised even when it displays
  // a cycle name instead of a date.
  rows.sort((a, b) =>
    a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0,
  );

  // The diff engine never emits a change event for the record that created
  // the employment row (an INSERT is a baseline, not a change), so "Joined"
  // is synthesized here from the period itself and always sits last.
  rows.push({
    key: `join-${period.id}`,
    date: period.startDate,
    sortKey: period.startDate,
    isPromo: false,
    isJoin: true,
    isSystem: false,
    field: "Joined",
    previousValue: null,
    currentValue: period.employmentType,
  });

  return rows;
};

const Dot = ({ isPromo, isJoin }: { isPromo: boolean; isJoin: boolean }) => (
  <Box sx={{ position: "relative", width: 32, height: 15, flexShrink: 0 }}>
    <Box
      sx={(theme) => ({
        position: "absolute",
        left: isPromo ? 10 : 11,
        top: isPromo ? 4 : 5,
        width: isPromo ? 9 : 7,
        height: isPromo ? 9 : 7,
        borderRadius: "50%",
        backgroundColor: isPromo
          ? theme.palette.secondary.contrastText
          : isJoin
            ? theme.palette.text.secondary
            : theme.palette.divider,
        boxShadow: `0 0 0 3px ${theme.palette.background.paper}`,
      })}
    />
  </Box>
);

const EventRow = ({ row }: { row: TimelineRow }) => {
  const theme = useTheme();
  const label = row.isJoin || row.isPromo ? row.field : fieldLabel(row.field);
  const isStatusField = row.field === "employee_status";
  const statusValue = (row.currentValue ?? "").trim().toLowerCase();
  const showStatusChip =
    isStatusField && (statusValue === "marked leaver" || statusValue === "left");

  return (
    <Box
      sx={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: "32px 96px 1fr",
        alignItems: "baseline",
        gap: "0 14px",
        py: 1.125,
        borderTop: `1px solid ${theme.palette.divider}`,
        "&:first-of-type": { borderTop: "none" },
      }}
    >
      <Dot isPromo={row.isPromo} isJoin={row.isJoin} />
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {row.date
          ? formatEventDate(row.date)
          : (row.promotion?.cycleName ?? "-")}
      </Typography>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            color: "text.secondary",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            mb: 0.25,
          }}
        >
          {label}
        </Typography>

        {row.isJoin ? (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography sx={{ fontWeight: 550 }}>{row.currentValue}</Typography>
          </Stack>
        ) : row.isPromo ? (
          <>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography
                sx={{
                  color: "text.secondary",
                  textDecoration: "line-through",
                  textDecorationColor: theme.palette.divider,
                }}
              >
                {row.previousValue}
              </Typography>
              <Typography sx={{ color: "text.disabled" }}>{"→"}</Typography>
              <Typography sx={{ fontWeight: 550 }}>{row.currentValue}</Typography>
              <Chip
                size="small"
                label="Approved"
                sx={{
                  height: 20,
                  fontWeight: 600,
                  fontSize: 11,
                  color: theme.palette.secondary.contrastText,
                  backgroundColor: alpha(
                    theme.palette.secondary.contrastText,
                    theme.palette.mode === "dark" ? 0.18 : 0.12,
                  ),
                }}
              />
            </Stack>
            {row.promotion && (
              <Box
                sx={{
                  mt: 0.875,
                  p: 1.25,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: 2.25,
                  rowGap: 0.5,
                }}
              >
                {(
                  [
                    // The cycle name stands in for the date when HRIS has no
                    // promoted date, so it is only repeated here when a real
                    // date occupies the date column.
                    ...(row.date
                      ? [["Cycle", row.promotion.cycleName]]
                      : []),
                    ["Type", row.promotion.promotionType],
                    ["Role", row.promotion.jobRole],
                  ] as [string, string][]
                ).map(([dt, dd]) => (
                  <Box key={dt} sx={{ display: "flex", gap: 0.75 }}>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {dt}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 550,
                        fontVariantNumeric: "tabular-nums",
                        color: "text.primary",
                      }}
                    >
                      {dd || "-"}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {row.previousValue !== null && (
              <>
                <Typography
                  sx={{
                    color: "text.secondary",
                    textDecoration: "line-through",
                    textDecorationColor: theme.palette.divider,
                  }}
                >
                  {row.previousValue}
                </Typography>
                <Typography sx={{ color: "text.disabled" }}>{"→"}</Typography>
              </>
            )}
            {showStatusChip ? (
              <Chip
                size="small"
                label={row.currentValue}
                sx={{
                  height: 20,
                  fontWeight: 600,
                  fontSize: 11,
                  ...statusChipColors(theme, row.currentValue ?? ""),
                }}
              />
            ) : (
              <Typography sx={{ fontWeight: 550 }}>{row.currentValue}</Typography>
            )}
          </Stack>
        )}

        {row.actionBy && (
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.disabled", mt: 0.375 }}
          >
            by {row.actionBy}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const PeriodSection = ({
  period,
  events,
  periods,
}: {
  period: EmploymentPeriod;
  events: HistoryEvent[];
  periods: EmploymentPeriod[];
}) => {
  const theme = useTheme();
  const rows = useMemo(() => buildRows(period, events), [period, events]);
  const visibleRows = rows.filter((row) => !row.isSystem);
  const systemCount = rows.length - visibleRows.length;

  // continuousServiceRecord holds the linked period's employee_id string
  // (see getEmploymentPeriodsQuery: `csr.employee_id AS continuousServiceRecord`),
  // not the linked period's numeric `id` — a period without an employeeId can
  // never be a link target.
  const linkedPeriod = period.continuousServiceRecord
    ? periods.find((p) => p.employeeId === period.continuousServiceRecord)
    : undefined;
  const linkedLabel = linkedPeriod
    ? `${linkedPeriod.employmentType} · ${linkedPeriod.employeeId}`
    : period.continuousServiceRecord;

  return (
    <Box sx={{ mb: 3.75 }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.25}
        flexWrap="wrap"
        sx={{ pb: 1.125, borderBottom: `1px solid ${theme.palette.divider}`, mb: 0.5 }}
      >
        <Typography sx={{ fontWeight: 640, fontSize: 14.5 }}>
          {period.employmentType}
        </Typography>
        {period.employeeId && (
          <Typography
            variant="caption"
            sx={{
              fontFamily:
                'ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace',
              color: "text.secondary",
              backgroundColor: theme.palette.action.hover,
              px: 0.75,
              py: 0.125,
              borderRadius: 0.5,
            }}
          >
            {period.employeeId}
          </Typography>
        )}
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontVariantNumeric: "tabular-nums",
            ml: "auto",
          }}
        >
          {formatEventDate(period.startDate)} — {period.endDate ? formatEventDate(period.endDate) : "present"}
        </Typography>
      </Stack>

      {period.continuousServiceRecord && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ color: "text.secondary", fontSize: 12, pt: 0.875, pb: 0.375, pl: 1.875 }}
        >
          <LinkOutlinedIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Continuous service — linked to {linkedLabel}
          </Typography>
        </Stack>
      )}

      <Box sx={{ position: "relative" }}>
        {visibleRows.map((row) => (
          <EventRow key={row.key} row={row} />
        ))}
      </Box>

      {systemCount > 0 && (
        <Typography variant="caption" sx={{ color: "text.disabled", display: "block", mt: 0.75 }}>
          SYSTEM · {systemCount} {systemCount === 1 ? "run" : "runs"} collapsed
        </Typography>
      )}
    </Box>
  );
};

export default function EmployeeHistory({ employeeId }: { employeeId: string }) {
  const dispatch = useAppDispatch();
  const { state, history, errorMessage } = useAppSelector((s) => s.employeeHistory);

  useEffect(() => {
    if (employeeId) dispatch(fetchEmployeeHistory(employeeId));
    // Fetch once when this component mounts (i.e. on first expand by the parent);
    // do not add `state` here or every expand/collapse would re-trigger it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, dispatch]);

  if (state === State.loading || state === State.idle) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 5 }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">
          Loading history...
        </Typography>
      </Stack>
    );
  }

  if (state === State.failed) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ py: 5 }}>
        <Typography variant="body2" color="error">
          {errorMessage || "Failed to load employee history."}
        </Typography>
      </Stack>
    );
  }

  const periods = history?.periods ?? [];
  const events = history?.events ?? [];

  if (periods.length === 0 && events.length === 0) {
    return (
      <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ py: 5 }}>
        <HistoryOutlinedIcon sx={{ fontSize: 32, color: "text.disabled" }} />
        <Typography variant="body2" color="text.secondary">
          No events recorded yet.
        </Typography>
      </Stack>
    );
  }

  const sortedPeriods = [...periods].sort((a, b) =>
    a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0,
  );

  return (
    <Box>
      {history?.promotionsUnavailable && (
        <Box
          sx={(theme) => ({
            mb: 2.25,
            px: 1.625,
            py: 1.125,
            borderLeft: `2px solid ${theme.palette.warning.main}`,
            backgroundColor: alpha(
              theme.palette.warning.main,
              theme.palette.mode === "dark" ? 0.12 : 0.08,
            ),
            borderRadius: "0 6px 6px 0",
          })}
        >
          <Typography variant="body2" color="text.secondary">
            Promotion history is temporarily unavailable. The rest of the
            timeline below is unaffected.
          </Typography>
        </Box>
      )}

      {sortedPeriods.map((period) => (
        <PeriodSection
          key={period.id}
          period={period}
          events={events}
          periods={periods}
        />
      ))}
    </Box>
  );
}
