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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DateRangeIcon from "@mui/icons-material/DateRange";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Avatar,
  Box,
  Card,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridRenderCellParams, GridRowSelectionModel } from "@mui/x-data-grid";
import dayjs from "dayjs";

import React from "react";
import { useEffect, useRef, useState } from "react";

import { CustomModal } from "@component/common/CustomModal";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import NoDataView from "@component/common/NoDataView";
import ParStatusChip from "@component/common/ParStatusChip";
import { LoadingEffect } from "@component/ui/Loading";
import { shortDateFormat, tooltipVisibilityDelay, uiMessages } from "@config/constant";
import { ParLeadStatus } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParRatingShort } from "@root/src/slices/teamSlice/team";
import { selectUserEmail } from "@slices/authSlice/auth";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import {
  fetchCurrentParCycleOfEmployee,
  selectEmployeeStatus,
} from "@slices/employeeSlice/employee";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import {
  fetchDirectAndIndirectReports,
  selectReportData,
  selectReportStatus,
} from "@slices/reportSlice/report";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";

import { Review } from "../components/Review";

const EmployeeReportView = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const apiController = useRef(new AbortController());
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectReportData);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const reportStatus = useAppSelector(selectReportStatus);

  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: "include",
    ids: new Set(),
  });

  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>("");
  const [reviewEmployeeView, setReviewEmployeeView] = useState(false);
  const parCycleLoadingStatus = useAppSelector(selectEmployeeStatus);

  const handleSelectionModelChange = (newSelectionModel: GridRowSelectionModel) => {
    setSelectionModel(newSelectionModel);
  };

  const fetchData = async () => {
    if (userEmail) {
      const fetchParCycleResult = await dispatch(fetchCurrentParCycleOfEmployee(userEmail));

      if (fetchCurrentParCycleOfEmployee.fulfilled.match(fetchParCycleResult)) {
        const currentCycle = fetchParCycleResult.payload.currentCycle;

        if (userEmail && currentCycle.parCycleId) {
          apiController.current = new AbortController();
          dispatch(
            fetchDirectAndIndirectReports({
              parCycleId: currentCycle.parCycleId,
              leadEmail: userEmail,
            }),
          );
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      field: "parEmployeeName",
      headerName: "Team Member",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <Box display="flex" alignItems="center" position="relative">
          <Avatar
            src={employeeMap[params.row?.parEmployeeEmail]?.employeeThumbnail}
            alt={
              employeeMap[params.row?.parEmployeeEmail]?.employeeName ||
              params.row?.parEmployeeEmail
            }
            sx={{ marginRight: 2, height: "2.2rem", width: "2.2rem" }}
          />
          <Box
            sx={{
              position: "relative",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "translateY(-10px)",
              },
              "&:hover > div": {
                opacity: 1,
              },
            }}
          >
            <Typography variant="h5">{params.row?.parEmployeeName}</Typography>
            <Box
              sx={{
                position: "absolute",
                top: "100%",
                left: 0,
                display: "flex",
                alignItems: "center",
                padding: "1px 0",
                borderRadius: "4px",
                opacity: 0,
                transition: "opacity 0.3s",
              }}
            >
              <Typography color={"GrayText"} variant="h6" mr={1}>
                {params.row?.parEmployeeEmail}
              </Typography>
              <Tooltip
                title="Copy Email"
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <IconButton
                  size="small"
                  aria-label="Copy Email"
                  onClick={() => {
                    navigator.clipboard.writeText(params.row?.parEmployeeEmail);
                    dispatch(ShowSnackBarMessage("Email copied", "success"));
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: "15px" }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "parEmployeeStatus",
      headerName: "Employee PAR",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parEmployeeStatus || ""} />
      ),
    },
    {
      field: "par360ReviewStatus",
      headerName: "360° Feedback",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip
          content={params.row?.par360ReviewStatus || ""}
          countDetails={{
            completed: params.row?.par360ReviewCounts?.sharedReviewCount || 0,
            total: params.row?.par360ReviewCounts?.requestedReviewCount || 0,
          }}
        />
      ),
    },
    {
      field: "parLeadStatus",
      headerName: "Lead's PAR",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parLeadStatus || ""} />
      ),
    },
    {
      field: "parRating",
      headerName: "Rating",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parRating || ""} />
      ),
    },
    {
      field: "parSpecialRating",
      headerName: "Top 5%/20% Rating",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parSpecialRating || ""} />
      ),
    },
    {
      field: "parF2fStatus",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <ParStatusChip content={params.row?.parF2fStatus || ""} />
      ),
    },

    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<ParRatingShort>) => (
        <IconButton
          sx={{
            color: "primary.main",
            "&:hover": {
              bgcolor: "primary.main",
              color: "white",
            },
          }}
          onClick={() => handleMembersTableClick(params.row)}
        >
          {params.row.parLeadStatus === ParLeadStatus.SHARED ? (
            <Tooltip
              arrow
              title="View"
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <VisibilityIcon />
            </Tooltip>
          ) : (
            <Tooltip
              arrow
              title="Review"
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <RateReviewIcon />
            </Tooltip>
          )}
        </IconButton>
      ),
    },
  ];

  const handleMembersTableClick = (parRating: ParRatingShort) => {
    openReviewEmployeeView(parRating.parEmployeeEmail);
  };

  const openReviewEmployeeView = (employeeEmail: string) => {
    setSelectedEmployeeEmail(employeeEmail);
    setReviewEmployeeView(true);
  };

  const closeReviewEmployeeView = () => {
    setReviewEmployeeView(false);
    setSelectedEmployeeEmail("");
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const getFilteredRows = () => {
    const searchFiltered = reports.filter((row) => {
      const searchTerm = searchQuery.toLowerCase();
      return row.parEmployeeEmail?.toLowerCase().includes(searchTerm);
    });
    return searchFiltered.filter((row) => row.reportingType?.toLowerCase() === "indirect");
  };

  const openCycleDeadlines = () => {
    setIsParCycleDatesOpen(true);
  };
  const closeCycleDeadlines = () => {
    setIsParCycleDatesOpen(false);
  };

  useEffect(() => {
    if (dayjs().diff(currentCycle.parEmployeeDeadline, "day", true) >= 0) {
      setActiveStep(1);
    }
    if (dayjs().diff(currentCycle.parLeadDeadline, "day", true) - 1 >= 0) {
      setActiveStep(2);
    }
    if (dayjs().diff(currentCycle.parSpecialRatingDeadline, "day", true) >= 0) {
      setActiveStep(3);
    }
    if (dayjs().diff(currentCycle.parEvaluationEndDate, "day", true) >= 0) {
      setActiveStep(4);
    }
  }, [dispatch, currentCycle]);

  return (
    <Box
      sx={{
        height: "100%",
        borderRadius: "5px",
        minWidth: "1200px",
        minHeight: "70vh",
      }}
    >
      {parCycleLoadingStatus === RequestState.LOADING && (
        <Box sx={{ height: "70vh" }}>
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        </Box>
      )}

      {parCycleLoadingStatus === RequestState.SUCCEEDED && !currentCycle?.parCycleId && (
        <Box sx={{ height: "70vh" }}>
          <NoDataView text={uiMessages.error.noParCycleFound} />
        </Box>
      )}

      {parCycleLoadingStatus === RequestState.SUCCEEDED && currentCycle?.parCycleId && (
        <>
          {reviewEmployeeView && currentCycle?.parCycleId ? (
            <Review
              selectedEmployeeEmail={selectedEmployeeEmail}
              closeReviewEmployeeView={closeReviewEmployeeView}
            />
          ) : (
            <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <Grid
                container
                spacing={2}
                sx={{
                  mb: 2,
                  alignItems: "center",
                }}
              >
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" component="div">
                      {currentCycle.parCycleName}{" "}
                    </Typography>
                    <Typography color="GrayText" sx={{ ml: 1 }}>
                      ({dayjs(currentCycle.parCycleStartDate).format(shortDateFormat)} -{" "}
                      {dayjs(currentCycle.parCycleEndDate).format(shortDateFormat)})
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search employees..."
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

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    <Tooltip
                      arrow
                      title="Open Cycle Dates"
                      enterDelay={tooltipVisibilityDelay}
                      enterNextDelay={tooltipVisibilityDelay}
                    >
                      <IconButton
                        sx={{
                          color: "primary.main",
                          "&:hover": {
                            bgcolor: "primary.main",
                            color: "white",
                          },
                        }}
                        onClick={openCycleDeadlines}
                      >
                        <DateRangeIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>

              <Card
                variant="outlined"
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "auto",
                  height: "auto",
                }}
              >
                <Box sx={{ width: "100%", minHeight: 400 }}>
                  <DataGrid
                    sx={{
                      border: "none",
                      "& .MuiDataGrid-row:hover": {
                        backgroundColor: "inherit",
                      },
                    }}
                    getRowId={(row) => row.parEmployeeEmail}
                    columns={columns}
                    rowHeight={50}
                    checkboxSelection={false}
                    // FIX: Modernized v6+ prop names
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 20, 25]}
                    rowSelectionModel={selectionModel}
                    onRowSelectionModelChange={handleSelectionModelChange}
                    loading={reportStatus === RequestState.LOADING}
                    initialState={{
                      pagination: {
                        paginationModel: {
                          pageSize: 10,
                          page: 0,
                        },
                      },
                    }}
                    rows={getFilteredRows() as unknown as ParRatingShort[]}
                  />
                </Box>
              </Card>
            </Box>
          )}

          <CustomModal open={isParCycleDatesOpen} onClose={closeCycleDeadlines} width="80vw">
            <Typography id="dashboard-modal-title" variant="h4" pb={2}>
              Cycle Dates
            </Typography>
            <Divider sx={{ bgcolor: "primary.main" }} />
            <Box pt={9} pb={5}>
              <CycleDatesStepper cycle={currentCycle} activeStep={activeStep} />
            </Box>
          </CustomModal>
        </>
      )}
    </Box>
  );
};

export default EmployeeReportView;
