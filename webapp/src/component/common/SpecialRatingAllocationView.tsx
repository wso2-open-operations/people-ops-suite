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
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Card,
  Chip,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import React, { useEffect, useMemo, useState } from "react";

import NoDataView from "@component/common/NoDataView";
import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import { selectUserEmail } from "@slices/authSlice/auth";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import {
  fetchQuotaGroupRatings,
  selectQuotaGroupsStatus,
  selectSpecialRatingAllocation,
} from "@slices/specialQuotaSlice/specialQuota";
import { SpecialRatingAllocation } from "@slices/specialQuotaSlice/specialQuota";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";

interface GroupedData {
  quotaId: number;
  quotaName: string;
  top5Quota: number;
  top20Quota: number;
  departments: (SpecialRatingAllocation & { highlight: boolean })[];
}

interface SpecialRatingAllocationViewProps {
  isAdminView: boolean;
}

const SpecialRatingAllocationView = ({ isAdminView }: SpecialRatingAllocationViewProps) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const userEmail = useAppSelector(selectUserEmail);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const loadingState = useAppSelector(selectQuotaGroupsStatus);
  const specialRatingAllocation = useAppSelector(selectSpecialRatingAllocation);

  useEffect(
    () => {
      if (currentCycle.parCycleId && userEmail) {
        dispatch(
          fetchQuotaGroupRatings({
            parCycleId: currentCycle.parCycleId,
            leadEmail: isAdminView ? undefined : userEmail,
          }),
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdminView],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const processedGroupedData: GroupedData[] = useMemo(() => {
    const groups = new Map<number, GroupedData>();
    const searchTerm = searchQuery.toLowerCase().trim();

    specialRatingAllocation.forEach((item) => {
      // Create combined search text for more comprehensive matching
      const combinedText =
        `${item.parBusinessUnit} ${item.parDepartment} ${item.parTeam}`.toLowerCase();
      const businessUnitMatch = item.parBusinessUnit
        ?.toLowerCase()
        .includes(searchTerm);
      const departmentMatch = item.parDepartment
        ?.toLowerCase()
        .includes(searchTerm);
      const teamMatch = item.parTeam
        ?.toLowerCase()
        .includes(searchTerm);
      const combinedMatch = combinedText.includes(searchTerm);

      // Highlight if any part matches
      const shouldHighlight =
        searchTerm && (businessUnitMatch || departmentMatch || teamMatch || combinedMatch);

      if (!groups.has(item.parQuotaId)) {
        groups.set(item.parQuotaId, {
          quotaId: item.parQuotaId,
          quotaName: item.parSpecialQuotaName,
          top5Quota: item.parTop5Quota,
          top20Quota: item.parTop20Quota,
          departments: [],
        });
      }

      groups.get(item.parQuotaId)!.departments.push({
        ...item,
        highlight: Boolean(shouldHighlight),
      });
    });

    return Array.from(groups.values());
  }, [specialRatingAllocation, searchQuery]);

  // Helper function to highlight text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: "#ffeb3b", fontWeight: "bold" }}>
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <Box
      sx={{
        height: "70vh",
        overflow: "auto",
        width: "100%",
        p: 2,
      }}
    >
      {loadingState === RequestState.LOADING && (
        <Box sx={{ height: "60vh" }}>
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        </Box>
      )}

      {loadingState === RequestState.FAILED && (
        <Box sx={{ height: "60vh", width: "100%" }}>
          <NoDataView text={uiMessages.error.noAllocations} />
        </Box>
      )}

      {loadingState === RequestState.SUCCEEDED && (
        <Grid container spacing={3}>
          <>
            {specialRatingAllocation.length > 0 ? (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by business unit, department or team..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
            ) : (
              <Grid size={{ xs: 12 }}>
                <NoDataView text={uiMessages.information.noAllocations} />
              </Grid>
            )}
          </>

          {processedGroupedData.length === 0 && searchQuery.trim() && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body1" color="text.secondary" align="center">
                No results found for "{searchQuery}"
              </Typography>
            </Grid>
          )}

          {processedGroupedData.map((group) => {
            const top20 = group.top5Quota === 1 && group.top20Quota === 0 ? 1 : group.top20Quota;
            return (
              <Grid size={{ xs: 12 }} key={group.quotaId}>
                <Card
                  sx={{
                    height: "fit-content",
                    display: "flex",
                    flexDirection: "row",
                    background: "transparent",
                    backdropFilter: "none",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      background: theme.palette.mode === "dark" ? "#1B2A49" : "#B7E4FC",
                      width: "250px",
                      minWidth: "250px",
                      borderRight: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Stack direction="column" spacing={2} alignItems="center">
                      <Typography
                        variant="h6"
                        color="text.primary"
                        sx={{
                          textTransform: "capitalize",
                          textAlign: "center",
                          wordBreak: "break-word",
                        }}
                      >
                        {group.quotaName}
                      </Typography>
                      <Chip
                        label={`Top 5%: ${group.top5Quota}`}
                        size="small"
                        sx={{ width: "90%", bgcolor: "action.selected", color: "text.primary" }}
                      />
                      <Chip
                        label={`Top 20%: ${top20}`}
                        size="small"
                        sx={{ width: "90%", bgcolor: "action.selected", color: "text.primary" }}
                      />
                    </Stack>
                  </Box>

                  {/* Department Table */}
                  <TableContainer component={Paper} elevation={0} sx={{ background: "transparent" }}>
                    {group.top5Quota === 1 && group.top20Quota === 0 && (
                      <Alert severity="warning">
                        The total allocation for the top 5% and top 20% categories is 1 due to the
                        small team size. This means only one team member can be placed in{" "}
                        <b>either</b> the top 5% or the top 20%. The allocation appears as "1" for
                        each category solely for system purposes; it does not mean you can allocate
                        one person to each category. Once a slot is used for any of the categories,
                        the overall quota is considered utilised
                      </Alert>
                    )}
                    <Table size="small">
                      <TableBody>
                        {group.departments.map((dept, index) => (
                          <TableRow
                            key={`${dept.parQuotaId}-${dept.parDepartment}-${dept.parTeam}-${index}`}
                            sx={{
                              "& td, & th": { border: 0 },
                              backgroundColor: dept.highlight
                                ? alpha(theme.palette.warning.light, 0.3)
                                : "transparent",
                            }}
                          >
                            <TableCell sx={{ width: "30%", wordWrap: "break-word" }}>
                              <Typography variant="body2" color="text.primary" noWrap title={dept.parBusinessUnit}>
                                {highlightText(dept.parBusinessUnit, searchQuery.trim())}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ width: "35%", wordWrap: "break-word" }}>
                              <Typography variant="body2" color="text.primary" noWrap title={dept.parDepartment}>
                                {highlightText(dept.parDepartment, searchQuery.trim())}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ width: "35%", wordWrap: "break-word" }}>
                              <Typography variant="body2" color="text.primary" noWrap title={dept.parTeam}>
                                {highlightText(dept.parTeam, searchQuery.trim())}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default SpecialRatingAllocationView;
