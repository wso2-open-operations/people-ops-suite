// Copyright (c) 2025, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Box,
  Card,
  Chip,
  Grid,
  Table,
  Paper,
  alpha,
  Stack,
  TableRow,
  useTheme,
  TableCell,
  TableBody,
  TableHead,
  TextField,
  Typography,
  TableContainer,
  InputAdornment,
  Alert,
} from "@mui/material";
import {
  fetchQuotaGroupRatings,
  selectQuotaGroupsStatus,
  selectSpecialRatingAllocation,
} from "@slices/specialQuotaSlice/specialQuota";
import { tokens } from "@src/theme";
import { uiMessages } from "@config/constant";
import SearchIcon from "@mui/icons-material/Search";
import { selectUserEmail } from "@slices/authSlice/auth";
import { LoadingEffect } from "@component/ui/Loading";
import NoDataView from "@component/common/NoDataView";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState,  } from "@utils/types";
import { SpecialRatingAllocation } from "@slices/specialQuotaSlice/specialQuota";

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

const SpecialRatingAllocationView = ({
  isAdminView,
}: SpecialRatingAllocationViewProps) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const colors = tokens(theme.palette.mode);
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
          })
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAdminView]
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
        `${item.parBusinessUnit} ${item.parDepartment}`.toLowerCase();
      const businessUnitMatch = item.parBusinessUnit
        ?.toLowerCase()
        .includes(searchTerm);
      const departmentMatch = item.parDepartment
        ?.toLowerCase()
        .includes(searchTerm);
      const combinedMatch = combinedText.includes(searchTerm);

      // Highlight if any part matches
      const shouldHighlight =
        searchTerm && (businessUnitMatch || departmentMatch || combinedMatch);

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

    const regex = new RegExp(
      `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span
          key={index}
          style={{ backgroundColor: "#ffeb3b", fontWeight: "bold" }}
        >
          {part}
        </span>
      ) : (
        part
      )
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
              <Grid size={{ xs:12 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search by business unit or unit..."
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
              <Grid size={{ xs:12 }}>
                <NoDataView text={uiMessages.information.noAllocations} />
              </Grid>
            )}
          </>

          {processedGroupedData.length === 0 && searchQuery.trim() && (
            <Grid size={{ xs: 12 }} >
              <Typography variant="body1" color="text.secondary" align="center">
                No results found for "{searchQuery}"
              </Typography>
            </Grid>
          )}

          {processedGroupedData.map((group) => {
            const top20 =
              group.top5Quota === 1 && group.top20Quota === 0
                ? 1
                : group.top20Quota;
            return (
              <Grid size={{ xs: 12 }} key={group.quotaId}>
                <Card
                  sx={{
                    height: "fit-content",
                    display: "flex",
                    flexDirection: "row",
                  }}
                >
                  <Box
                    sx={{
                      p: 2,
                      bgcolor:
                        theme.palette.mode === "light"
                          ? alpha(theme.palette.primary.light, 0.1)
                          : alpha(theme.palette.primary.main, 0.25),
                      color: "primary.contrastText",
                      width: "250px",
                      minWidth: "250px",
                    }}
                  >
                    <Stack direction="column" spacing={2} alignItems="center">
                      <Typography
                        variant="h6"
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
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "inherit",
                          width: "90%",
                        }}
                      />
                      <Chip
                        label={`Top 20%: ${top20}`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(255,255,255,0.2)",
                          color: "inherit",
                          width: "90%",
                        }}
                      />
                    </Stack>
                  </Box>
                  {/* Department Table */}

                  <TableContainer component={Paper} elevation={0}>
                    {group.top5Quota === 1 && group.top20Quota === 0 && (
                      <Alert severity="warning">
                        The total allocation for the top 5% and top 20%
                        categories is 1 due to the small team size. This means
                        only one team member can be placed in <b>either</b> the
                        top 5% or the top 20%. The allocation appears as “1” for
                        each category solely for system purposes; it does not
                        mean you can allocate one person to each category. Once
                        a slot is used for any of the categories, the overall
                        quota is considered utilised
                      </Alert>
                    )}
                    <Table size="small">
                      <TableBody>
                        {group.departments.map((dept, index) => (
                          <TableRow
                            key={`${dept.parQuotaId}-${dept.parDepartment}-${index}`}
                            sx={{
                              "&:last-child td, &:last-child th": { border: 0 },
                              backgroundColor: dept.highlight
                                ? alpha(theme.palette.warning.light, 0.3)
                                : "transparent",
                            }}
                          >
                            <TableCell
                              sx={{ width: "40%", wordWrap: "break-word" }}
                            >
                              <Typography
                                variant="body2"
                                noWrap
                                title={dept.parBusinessUnit}
                              >
                                {highlightText(
                                  dept.parBusinessUnit,
                                  searchQuery.trim()
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell
                              sx={{ width: "60%", wordWrap: "break-word" }}
                            >
                              <Typography
                                variant="body2"
                                noWrap
                                title={dept.parDepartment}
                              >
                                {highlightText(
                                  dept.parDepartment,
                                  searchQuery.trim()
                                )}
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
