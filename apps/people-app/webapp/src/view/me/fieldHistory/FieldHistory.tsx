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

import HistoryIcon from "@mui/icons-material/History";
import {
  Box,
  Divider,
  IconButton,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useMemo, useState } from "react";

import { useAppSelector } from "@slices/store";

/**
 * The changes recorded for one field, opened from beside the field itself.
 *
 * Reads the history already fetched for the profile rather than requesting per field:
 * the endpoint returns every event for the person in one response, so a field view is
 * a filter over data in the store. Twenty controls therefore cost one request, not
 * twenty.
 *
 * Renders nothing when the field has no events. A control that always opens "no
 * changes recorded" teaches a reader that clicking is not worth it, which costs the
 * fields that do have history.
 */
const FieldHistory = ({
  field,
  label,
  onViewAll,
}: {
  /** Audit column name, as it arrives on an event's `field`. */
  field: string;
  /** Field name as shown on the profile, used as the popover heading. */
  label: string;
  /** Opens the full timeline; omitted when there is nowhere to send the reader. */
  onViewAll?: () => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const history = useAppSelector((state) => state.employeeHistory.history);

  const events = useMemo(
    () => (history?.events ?? []).filter((event) => event.field === field),
    [history, field],
  );

  if (events.length === 0) return null;

  const open = Boolean(anchorEl);

  return (
    <>
      <Tooltip title={`${label} history`}>
        <IconButton
          size="small"
          aria-label={`${label} history`}
          onClick={(e) => {
            // The field sits inside an AccordionSummary in some sections; without this
            // the click would also toggle the section shut behind the popover.
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          className="field-history-button"
          sx={(theme) => ({
            p: 0.25,
            ml: 0.5,
            // Muted at rest and coloured on hover: the control is always visible, so a
            // reader can find it without knowing to hover, but twenty of them in the
            // accent colour would compete with the values they sit beside.
            color: open
              ? theme.palette.secondary.contrastText
              : theme.palette.text.disabled,
            transition: theme.transitions.create("color", {
              duration: theme.transitions.duration.shortest,
            }),
            "&:hover": {
              color: theme.palette.secondary.contrastText,
              backgroundColor: alpha(
                theme.palette.secondary.contrastText,
                theme.palette.mode === "dark" ? 0.16 : 0.08,
              ),
            },
          })}
        >
          <HistoryIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 360, p: 1.75 } } }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
            mb: 1,
          }}
        >
          {label} · {events.length} {events.length === 1 ? "change" : "changes"}
        </Typography>

        {events.map((event, index) => (
          <Box key={`${event.occurredOn}-${index}`} sx={{ py: 0.85 }}>
            {index > 0 && <Divider sx={{ mb: 1.35, mt: -0.5 }} />}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 0.85,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              {event.previousValue && (
                <>
                  <Box
                    component="span"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      textDecoration: "line-through",
                    }}
                  >
                    {event.previousValue}
                  </Box>
                  <Box component="span" sx={{ color: "text.disabled" }}>
                    →
                  </Box>
                </>
              )}
              <Box component="span">{event.currentValue || "—"}</Box>
            </Box>
            <Typography
              sx={{ fontSize: 11.5, color: "text.disabled", mt: 0.25 }}
            >
              {new Date(event.occurredOn).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {/* Withheld on a self-view, where the backend strips attribution. */}
              {event.actionBy ? ` · by ${event.actionBy}` : ""}
            </Typography>
          </Box>
        ))}

        {onViewAll && (
          <>
            <Divider sx={{ mt: 1, mb: 1 }} />
            <Typography
              onClick={() => {
                setAnchorEl(null);
                onViewAll();
              }}
              sx={(theme) => ({
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                color: theme.palette.secondary.contrastText,
                "&:hover": { textDecoration: "underline" },
              })}
            >
              View full history
            </Typography>
          </>
        )}
      </Popover>
    </>
  );
};

export default FieldHistory;
