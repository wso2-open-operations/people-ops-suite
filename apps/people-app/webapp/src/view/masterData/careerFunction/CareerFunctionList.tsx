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

import { alpha, Box, IconButton, Skeleton, Tooltip, Typography, useTheme } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useMemo } from "react";
import { CareerFunction, Designation } from "@slices/careerFunctionSlice/careerFunction";

const SKELETON_ROW_COUNT = 5;

interface CareerFunctionListProps {
  careerFunctions: CareerFunction[];
  designations: Designation[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onAdd: () => void;
  onEdit: (cf: CareerFunction) => void;
  isLoading: boolean;
}

export default function CareerFunctionList({
  careerFunctions,
  designations,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  isLoading,
}: CareerFunctionListProps) {
  const theme = useTheme();

  // Active career functions first, then inactive ones, each group sorted by name.
  // Mirrors how HierarchyView orders its org-chart columns.
  const sortedCareerFunctions = useMemo(
    () =>
      [...careerFunctions].sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.careerFunction.localeCompare(b.careerFunction);
      }),
    [careerFunctions],
  );

  const unassignedCount = useMemo(
    () => designations.filter((d) => d.careerFunctionId === null).length,
    [designations],
  );

  const showUnassigned = designations.some((d) => d.careerFunctionId === null);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          minHeight: 56,
          maxHeight: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: theme.palette.text.primary,
            letterSpacing: "0.04em",
          }}
        >
          Career Functions
        </Typography>
        <Tooltip title="Add Career Function" arrow>
          <IconButton size="small" onClick={onAdd} aria-label="Add career function" sx={{ color: theme.palette.primary.main }}>
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {isLoading ? (
          Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 52,
                px: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Skeleton variant="rectangular" height={20} width="60%" sx={{ borderRadius: 1 }} />
              <Skeleton variant="circular" height={24} width={24} />
            </Box>
          ))
        ) : sortedCareerFunctions.length === 0 && !showUnassigned ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography sx={{ fontSize: 14, color: "text.disabled" }}>No career functions yet.</Typography>
          </Box>
        ) : (
          <>
            {sortedCareerFunctions.map((cf) => {
              const designationCount = designations.filter((d) => d.careerFunctionId === cf.id).length;
              const selected = selectedId === cf.id;
              return (
                <Box
                  key={cf.id}
                  component="button"
                  type="button"
                  onClick={() => onSelect(cf.id)}
                  sx={{
                    all: "unset",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: 52,
                    pl: 2,
                    pr: 0.5,
                    cursor: "pointer",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    borderLeft: selected
                      ? `3px solid ${theme.palette.primary.main}`
                      : "3px solid transparent",
                    backgroundColor: selected
                      ? theme.palette.action.selected
                      : alpha(theme.palette.background.paper, 0.5),
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      backgroundColor: selected ? theme.palette.action.focus : theme.palette.action.hover,
                      "& .career-function-actions": { opacity: 1 },
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: selected ? 600 : 400,
                      color: cf.isActive ? theme.palette.text.primary : theme.palette.text.disabled,
                      textDecoration: cf.isActive ? "none" : "line-through",
                    }}
                  >
                    {cf.careerFunction} ({designationCount})
                  </Typography>
                  <Box
                    className="career-function-actions"
                    sx={{ opacity: selected ? 1 : 0, transition: "opacity 0.15s" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title="Edit" arrow>
                      <IconButton
                        size="small"
                        aria-label={`Edit ${cf.careerFunction}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(cf);
                        }}
                      >
                        <EditIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })}

            {showUnassigned && (
              <Box
                component="button"
                type="button"
                onClick={() => onSelect(null)}
                sx={{
                  all: "unset",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  boxSizing: "border-box",
                  minHeight: 52,
                  pl: 2,
                  pr: 0.5,
                  cursor: "pointer",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  borderLeft: selectedId === null
                    ? `3px solid ${theme.palette.primary.main}`
                    : "3px solid transparent",
                  backgroundColor:
                    selectedId === null
                      ? theme.palette.action.selected
                      : alpha(theme.palette.background.paper, 0.5),
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor:
                      selectedId === null ? theme.palette.action.focus : theme.palette.action.hover,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: selectedId === null ? 600 : 400,
                    color: theme.palette.text.primary,
                  }}
                >
                  Unassigned ({unassignedCount})
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
