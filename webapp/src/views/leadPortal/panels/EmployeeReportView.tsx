// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Box,
  Card,
  Grid,
  Avatar,
  Divider,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  InputAdornment,
} from "@mui/material";
import {
  DataGrid,
  GridRowId,
  GridSelectionModel,
  GridRenderCellParams,
} from "@mui/x-data-grid";
import {
  uiMessages,
  shortDateFormat,
  tooltipVisibilityDelay,
} from "@config/constant";
import {
  selectReportData,
  selectReportStatus,
  fetchDirectAndIndirectReports,
} from "@slices/reportSlice";
import React from "react";
import dayjs from "dayjs";
import { Review } from "../components/Review";
import { useEffect, useRef, useState } from "react";
import { selectUserEmail } from "@slices/authSlice";
import SearchIcon from "@mui/icons-material/Search";
import { selectEmployeeMap } from "@slices/metaSlice";
import { selectCurrentCycle } from "@slices/parCycleSlice";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RateReviewIcon from "@mui/icons-material/RateReview";
import ParStatusChip from "@components/common/ParStatusChip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useAppSelector, useAppDispatch } from "@slices/store";
import { showSnackBarMessage } from "@slices/commonSlice/common";
import { fetchCurrentParCycleOfEmployee, selectEmployeeStatus } from "@slices/employeeSlice";
import { RequestState, ParLeadStatus, ParRatingShort } from "@utils/types";
import DateRangeIcon from "@mui/icons-material/DateRange";
import { CustomModal } from "@components/common/CustomModal";
import { CycleDatesStepper } from "@components/common/CycleDatesStepper";
import NoDataView from "@components/common/NoDataView";
import { LoadingEffect } from "@components/ui/Loading";

const EmployeeReportView = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const apiController = useRef(new AbortController());
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectReportData);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const reportStatus = useAppSelector(selectReportStatus);
  const [selectionModel, setSelectionModel] = useState<GridRowId[]>([]);
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] =
    useState<string>("");
  const [reviewEmployeeView, setReviewEmployeeView] = useState(false);
  const parCycleLoadingStatus = useAppSelector(selectEmployeeStatus);

  const handleSelectionModelChange = (
    newSelectionModel: GridSelectionModel
  ) => {
    setSelectionModel(newSelectionModel);
  };

  const fetchData = async () => {
    if (userEmail) {
      const fetchParCycleResult = await dispatch(
        fetchCurrentParCycleOfEmployee(userEmail)
      );

      if (fetchCurrentParCycleOfEmployee.fulfilled.match(fetchParCycleResult)) {
        const currentCycle = fetchParCycleResult.payload.currentCycle;

        if (userEmail && currentCycle.parCycleId) {
          apiController.current = new AbortController();
          dispatch(
            fetchDirectAndIndirectReports({
              parCycleId: currentCycle.parCycleId,
              leadEmail: userEmail,
            })
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
                    dispatch(showSnackBarMessage("Email copied", "success"));
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
    return searchFiltered.filter(
      (row) => row.reportingType?.toLowerCase() === "indirect"
    );
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
            <Review selectedEmployeeEmail={selectedEmployeeEmail} closeReviewEmployeeView={closeReviewEmployeeView} />
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
                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
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

                <Grid item xs={12} md={4}>
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
                  disableSelectionOnClick
                  autoHeight
                  loading={reportStatus === RequestState.LOADING}
                  rowsPerPageOptions={[10, 20, 25]}
                  initialState={{
                    pagination: {
                      pageSize: 10,
                      page: 0,
                    },
                  }}
                  rows={getFilteredRows()}
                  selectionModel={selectionModel}
                  onSelectionModelChange={handleSelectionModelChange}
                />
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
