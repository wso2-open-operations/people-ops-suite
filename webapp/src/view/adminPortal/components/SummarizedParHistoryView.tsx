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
import {
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Share as ShareIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";

import React from "react";

import NoDataView from "@component/common/NoDataView";
import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import {
  ParLeadStatus,
  ParRatingSummary,
  selectEmployeeHistoryRatingStatus,
  selectSummarizedParHistory,
} from "@slices/employeeHistorySlice/employeeHistory";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { useAppSelector } from "@slices/store";
import { tokens } from "@src/theme";
import { ParCycleStatus, RequestState } from "@utils/types";

interface SummarizedParHistoryViewProps {
  empName: string;
  empEmail: string;
  empThumbnail: string;
  handleClose?: () => void;
}

const SummarizedParHistoryView: React.FC<SummarizedParHistoryViewProps> = ({
  empName,
  empEmail,
  empThumbnail,
  handleClose,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const historyData = useAppSelector(selectSummarizedParHistory) as ParRatingSummary[];
  const historyDataLoadingState = useAppSelector(selectEmployeeHistoryRatingStatus);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!historyData || historyData.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor: alpha(theme.palette.grey[100], 0.5),
        }}
      >
        <TimelineIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No PAR History Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No performance review cycles found for this employee.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Employee Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          backgroundColor: colors.primary[300],
          p: 1,
        }}
      >
        <Typography variant="h4" color={"white"}>
          Employee PAR Summary
        </Typography>

        <IconButton onClick={handleClose}>
          <CloseIcon sx={{ color: "white" }} />
        </IconButton>
      </Box>
      <Card sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }} variant="outlined">
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={empThumbnail}
              alt={`${empName}'s avatar`}
              sx={{
                width: 64,
                height: 64,
                border: `2px solid ${theme.palette.primary.main}`,
              }}
            >
              <PersonIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {empName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {empEmail}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      {historyDataLoadingState === RequestState.LOADING && (
        <LoadingEffect message={uiMessages.loading.pageLoading} />
      )}
      {historyDataLoadingState === RequestState.FAILED && (
        <NoDataView text={uiMessages.error.noHistory} />
      )}
      {historyDataLoadingState === RequestState.SUCCEEDED && (
        <List
          sx={{
            width: "100%",
            bgcolor: "background.paper",
            overflowY: "auto",
            maxHeight: "60vh",
            p: 1,
          }}
        >
          {[...historyData]
            .sort((a, b) => b.parCycleId - a.parCycleId)
            .map((cycle, index) => {
              return (
                <React.Fragment key={cycle.parCycleId}>
                  <ListItem
                    sx={{
                      bgcolor: "background.paper",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                      },
                      borderRadius: 1,
                      mb: 1,
                      p: 1,
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {cycle.parCycleName}
                          </Typography>
                          {cycle.parCycleStatus === ParCycleStatus.OPEN && (
                            <Chip label="Active" size="small" color="primary" variant="filled" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Stack spacing={2.5}>
                          <Card
                            elevation={0}
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.02),
                              border: "1px solid",
                              borderColor: "grey.200",
                              borderRadius: 2,
                              p: 2.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: { xs: 1.5, sm: 3 },
                                flexWrap: "wrap",
                                mb: 1,
                              }}
                            >
                              {/* Date Range */}
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <CalendarIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    color: "text.primary",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  {formatDate(cycle.parCycleStartDate)}
                                  <ArrowForwardIcon
                                    sx={{ fontSize: 14, mx: 0.5, color: "text.secondary" }}
                                  />
                                  {formatDate(cycle.parCycleEndDate)}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}>
                              {cycle.parLeadStatus === ParLeadStatus.SHARED && (
                                <Chip
                                  icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                  label={`Completed on: ${formatDateTime(cycle.parUpdatedOn)}`}
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  sx={{
                                    fontWeight: 500,
                                    "& .MuiChip-label": { fontWeight: 600 },
                                  }}
                                />
                              )}
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                mt: 1,
                                flexWrap: { xs: "wrap", sm: "nowrap" },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1.5,
                                  minWidth: "fit-content",
                                }}
                              >
                                {cycle.parLeadStatus === ParLeadStatus.SHARED ? (
                                  <>
                                    <Box
                                      sx={{
                                        p: 1,
                                        borderRadius: "50%",
                                        bgcolor: "primary.50",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <ShareIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                    </Box>
                                    {(cycle.parSharedBy || cycle.parLeadEmail) && (
                                      <Avatar
                                        src={
                                          cycle.parSharedBy
                                            ? (employeeMap[cycle.parSharedBy]?.employeeThumbnail ??
                                              "")
                                            : (employeeMap[cycle.parLeadEmail]?.employeeThumbnail ??
                                              "")
                                        }
                                        alt={cycle.parSharedBy ?? cycle.parLeadEmail}
                                        sx={{
                                          width: 32,
                                          height: 32,
                                          border: `2px solid ${theme.palette.primary.main}`,
                                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                          transition: "transform 0.2s ease-in-out",
                                          "&:hover": {
                                            transform: "scale(1.05)",
                                          },
                                        }}
                                      >
                                        <PersonIcon sx={{ fontSize: 18 }} />
                                      </Avatar>
                                    )}
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          textTransform: "uppercase",
                                          letterSpacing: 0.5,
                                          fontWeight: 600,
                                          display: "block",
                                          mb: 0.5,
                                        }}
                                      >
                                        PAR Shared By
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          color: "text.primary",
                                          fontWeight: 500,
                                          lineHeight: 1.4,
                                        }}
                                      >
                                        {cycle.parSharedBy
                                          ? (employeeMap[cycle.parSharedBy]?.employeeName ??
                                            cycle.parSharedBy)
                                          : cycle.parLeadEmail
                                            ? (employeeMap[cycle.parLeadEmail]?.employeeName ??
                                              cycle.parLeadEmail)
                                            : "Not Available"}
                                      </Typography>
                                    </Box>
                                  </>
                                ) : (
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: "text.secondary",
                                        textTransform: "uppercase",
                                        letterSpacing: 0.5,
                                        fontWeight: 600,
                                        display: "block",
                                        mb: 0.5,
                                      }}
                                    >
                                      PAR Awaiting Completion
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </Card>
                        </Stack>
                      }
                    />
                  </ListItem>

                  {index < historyData.length - 1 && <Divider variant="middle" sx={{ my: 1 }} />}
                </React.Fragment>
              );
            })}
        </List>
      )}
    </Box>
  );
};

export default SummarizedParHistoryView;
