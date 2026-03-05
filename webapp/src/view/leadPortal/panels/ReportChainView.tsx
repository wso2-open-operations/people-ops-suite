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

import {
  Box,
  Card,
  Grid,
  Link,
  Avatar,
  Switch,
  Tooltip,
  Divider,
  TextField,
  IconButton,
  Typography,
  Breadcrumbs,
  InputAdornment,
  FormControlLabel,
} from "@mui/material";
import React from "react";
import dayjs from "dayjs";
import { Review } from "../components/Review";
import { useEffect, useRef, useState } from "react";
import { selectUserEmail } from "@slices/authSlice/auth";
import SearchIcon from "@mui/icons-material/Search";
import Groups3Icon from "@mui/icons-material/Groups3";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { LoadingEffect } from "@component/ui/Loading";
import NoDataView from "@component/common/NoDataView";
import DateRangeIcon from "@mui/icons-material/DateRange";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import RateReviewIcon from "@mui/icons-material/RateReview";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ParStatusChip from "@component/common/ParStatusChip";
import { CustomModal } from "@component/common/CustomModal";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useAppSelector, useAppDispatch } from "@slices/store";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { ShowSnackBarMessage } from "@slices/commonSlice/common";
import { CycleDatesStepper } from "@component/common/CycleDatesStepper";
import { RequestState } from "@utils/types";
import { uiMessages, shortDateFormat, tooltipVisibilityDelay } from "@config/constant";
import { fetchCurrentParCycleOfEmployee, selectEmployeeStatus } from "@slices/employeeSlice/employee";
import { DataGrid, GridRowId, GridRowSelectionModel, GridRenderCellParams } from "@mui/x-data-grid";
import { selectReportStatus, fetchDirectEmployeePars, selectDirectEmployeePars } from "@slices/reportSlice/report";
import { ParLeadStatus } from "@root/src/slices/employeeHistorySlice/employeeHistory";

const ReportChainView = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const apiController = useRef(new AbortController());
  const dispatch = useAppDispatch();
  const reports = useAppSelector(selectDirectEmployeePars);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const currentCycle = useAppSelector(selectCurrentCycle);
  const reportStatus = useAppSelector(selectReportStatus);

  // FIX 1: Explicitly type as an array of GridRowIds
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({
    type: 'include',
    ids: new Set(),
  });
  const [isParCycleDatesOpen, setIsParCycleDatesOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState<string>("");
  const [reviewEmployeeView, setReviewEmployeeView] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<{ email: string; name: string }[]>([
    { email: userEmail || "", name: "Direct Reports" },
  ]);
  const parCycleLoadingStatus = useAppSelector(selectEmployeeStatus);

  const handleSelectionModelChange = (newSelectionModel: GridRowSelectionModel) => {
    setSelectionModel(newSelectionModel);
  };
  const [showLeadsOnly, setShowLeadsOnly] = useState(false);

  const getFilteredRows = () => {
    const searchTerm = searchQuery.toLowerCase();
    return reports.filter(
      (row) =>
        row.parEmployeeEmail?.toLowerCase().includes(searchTerm) &&
        (!showLeadsOnly || row.isEmployeeALead?.toLowerCase() === showLeadsOnly.toString().toLowerCase())
    );
  };

  const fetchEmployeePars = async (leadEmail: string) => {
    if (!userEmail) return;

    const fetchParCycleResult = await dispatch(fetchCurrentParCycleOfEmployee(userEmail));

    if (!fetchCurrentParCycleOfEmployee.fulfilled.match(fetchParCycleResult)) return;

    const currentCycle = fetchParCycleResult.payload.currentCycle;
    if (!currentCycle.parCycleId) return;

    apiController.current = new AbortController();
    dispatch(
      fetchDirectEmployeePars({
        parCycleId: currentCycle.parCycleId,
        leadEmail: leadEmail,
      })
    );
  };

  const fetchData = async () => {
    if (userEmail) {
      await fetchEmployeePars(userEmail);
    }
  };

  const handleBreadcrumbNavigation = async (index: number) => {
    const newHistory = navigationHistory.slice(0, index + 1);
    setNavigationHistory(newHistory);

    const { email } = newHistory[index];
    if (email) {
      await fetchEmployeePars(email);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadSubordinates = async (employeeEmail: string, employeeName: string) => {
    if (currentCycle.parCycleId) {
      setNavigationHistory((prev) => [
        ...prev,
        {
          email: employeeEmail,
          name: employeeName,
        },
      ]);

      dispatch(
        fetchDirectEmployeePars({
          parCycleId: currentCycle.parCycleId,
          leadEmail: employeeEmail,
        })
      );
      setShowLeadsOnly(false);
      setSearchQuery("");
    }
  };

  const columns = [
    {
      field: "parEmployeeName",
      headerName: "Team Member",
      flex: 0.2,
      renderCell: (params: GridRenderCellParams<any>) => (
        <Box display="flex" alignItems="center" position="relative">
          <Avatar
            src={employeeMap[params.row?.parEmployeeEmail]?.employeeThumbnail}
            alt={employeeMap[params.row?.parEmployeeEmail]?.employeeName || params.row?.parEmployeeEmail}
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
              <Tooltip title="Copy Email" enterDelay={tooltipVisibilityDelay} enterNextDelay={tooltipVisibilityDelay}>
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
      renderCell: (params: GridRenderCellParams<any>) => (
        <ParStatusChip content={params.row?.parEmployeeStatus || ""} />
      ),
    },
    {
      field: "par360ReviewStatus",
      headerName: "360° Feedback",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<any>) => (
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
      renderCell: (params: GridRenderCellParams<any>) => (
        <ParStatusChip content={params.row?.parLeadStatus || ""} />
      ),
    },
    {
      field: "parRating",
      headerName: "Rating",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<any>) => (
        <ParStatusChip content={params.row?.parRating || ""} />
      ),
    },
    {
      field: "parSpecialRating",
      headerName: "Top 5%/20% Rating",
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<any>) => (
        <ParStatusChip content={params.row?.parSpecialRating || ""} />
      ),
    },
    {
      field: "parF2fStatus",
      headerName: "F2F",
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<any>) => (
        <ParStatusChip content={params.row?.parF2fStatus || ""} />
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.1,
      renderCell: (params: GridRenderCellParams<any>) => (
        <>
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
              <Tooltip arrow title="View" enterDelay={tooltipVisibilityDelay} enterNextDelay={tooltipVisibilityDelay}>
                <VisibilityIcon />
              </Tooltip>
            ) : (
              <Tooltip arrow title="Review" enterDelay={tooltipVisibilityDelay} enterNextDelay={tooltipVisibilityDelay}>
                <RateReviewIcon />
              </Tooltip>
            )}
          </IconButton>
          {params.row.isEmployeeALead === "True" && (
            <IconButton
              sx={{
                color: "primary.main",
                "&:hover": {
                  bgcolor: "primary.main",
                  color: "white",
                },
              }}
              onClick={() => loadSubordinates(params.row.parEmployeeEmail, params.row.parEmployeeName)}
            >
              <Tooltip
                arrow
                title={`View ${params.row.parEmployeeName}'s Subordinates`}
                enterDelay={tooltipVisibilityDelay}
                color="error"
                enterNextDelay={tooltipVisibilityDelay}
              >
                <Groups3Icon />
              </Tooltip>
            </IconButton>
          )}
        </>
      ),
    },
  ];

  const handleMembersTableClick = (row: any) => {
    openReviewEmployeeView(row.parEmployeeEmail);
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

  const handleLeadsOnlyFilter = () => {
    setShowLeadsOnly(!showLeadsOnly);
  };

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
              <ReportChainBreadcrumbs navigationHistory={navigationHistory} onNavigate={handleBreadcrumbNavigation} />
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
                    <FormControlLabel
                      value="end"
                      control={<Switch color="primary" checked={showLeadsOnly} onChange={handleLeadsOnlyFilter} />}
                      label="Show Leads Only"
                      labelPlacement="end"
                    />
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
                  disableRowSelectionOnClick
                  autoHeight
                  loading={reportStatus === RequestState.LOADING}
                  pageSizeOptions={[10, 20, 25]}
                  initialState={{
                    pagination: {
                      paginationModel: {
                        pageSize: 10,
                        page: 0,
                      },
                    },
                  }}
                  rows={getFilteredRows()}
                  rowSelectionModel={selectionModel}
                  onRowSelectionModelChange={handleSelectionModelChange}
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

interface ReportChainBreadcrumbsProps {
  navigationHistory: { email: string; name: string }[];
  onNavigate: (index: number) => void;
}

const ReportChainBreadcrumbs: React.FC<ReportChainBreadcrumbsProps> = ({ navigationHistory, onNavigate }) => {
  return (
    <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} className="mb-4">
      {navigationHistory.map((item, index) => {
        const isLast = index === navigationHistory.length - 1;
        return isLast ? (
          <Typography key={item.email} color="text.primary">
            {item.name}
          </Typography>
        ) : (
          <Link key={item.email} component="button" onClick={() => onNavigate(index)} underline="hover" color="primary">
            {item.name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default ReportChainView;
