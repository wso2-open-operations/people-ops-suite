// Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import {
  Box,
  Card,
  Grid,
  Link,
  Avatar,
  Switch,
  Tooltip,
  TextField,
  IconButton,
  Typography,
  Breadcrumbs,
  InputAdornment,
  FormControlLabel,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { selectUserEmail } from "@slices/authSlice/auth";
import SearchIcon from "@mui/icons-material/Search";
import Groups3Icon from "@mui/icons-material/Groups3";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Employee,
  fetchEntityEmployees,
  resetSubordinates,
  selectSubordinatesArray,
  selectSubordinates,
  selectEmployeeMap,
  selectManagerEmailSet,
} from "@slices/metaSlice/meta";
import { LoadingEffect } from "@component/ui/Loading";
import NoDataView from "@component/common/NoDataView";
import VisibilityIcon from "@mui/icons-material/Visibility";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { tooltipVisibilityDelay, uiMessages } from "@config/constant";
import EmployeeHistoryCard from "@component/common/EmployeeHistoryCard";
import { RequestState } from "@utils/types";
import {
  DataGrid,
  GridRenderCellParams,
  GridRowSelectionModel,
} from "@mui/x-data-grid";

interface NavEntry {
  email: string;
  name: string;
}

interface SelectedEmployee {
  email: string;
  name: string;
  thumbnail: string;
}

const ChainViewTab = () => {
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const subordinates = useAppSelector(selectSubordinatesArray);
  const subordinatesStatus = useAppSelector(selectSubordinates);
  const managerEmailSet = useAppSelector(selectManagerEmailSet);

  const [navigationHistory, setNavigationHistory] = useState<NavEntry[]>([]);
  const [showLeadsOnly, setShowLeadsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectionModel, setSelectionModel] = useState<GridRowSelectionModel>({ type: "include", ids: new Set() });
  const [selectedEmployee, setSelectedEmployee] = useState<SelectedEmployee | null>(null);

  const isLoading = subordinatesStatus === RequestState.LOADING;
  const hasError = subordinatesStatus === RequestState.FAILED;

  const loadForEmail = useCallback(
    (email: string) => {
      dispatch(fetchEntityEmployees({ leadEmail: email }));
    },
    [dispatch]
  );

  useEffect(() => {
    if (userEmail) {
      const displayName = employeeMap[userEmail]?.employeeName ?? "My Team";
      setNavigationHistory([{ email: userEmail, name: displayName }]);
      loadForEmail(userEmail);
    }
    return () => {
      dispatch(resetSubordinates());
    };
  }, [userEmail]);

  const loadSubordinates = (row: Employee) => {
    const name = employeeMap[row.workEmail]?.employeeName ?? row.employeeName;
    setNavigationHistory((prev) => [...prev, { email: row.workEmail, name }]);
    setShowLeadsOnly(false);
    setSearchQuery("");
    loadForEmail(row.workEmail);
  };

  const handleBreadcrumbNav = (index: number) => {
    const newHistory = navigationHistory.slice(0, index + 1);
    setNavigationHistory(newHistory);
    setShowLeadsOnly(false);
    setSearchQuery("");
    loadForEmail(newHistory[index].email);
  };

  const handleBack = () => {
    if (navigationHistory.length > 1) {
      handleBreadcrumbNav(navigationHistory.length - 2);
    }
  };

  const getFilteredRows = () => {
    const term = searchQuery.toLowerCase();
    return subordinates.filter(
      (s) =>
        (s.employeeName.toLowerCase().includes(term) ||
          s.workEmail.toLowerCase().includes(term)) &&
        (!showLeadsOnly || s.isLead === true)
    );
  };

  const columns = [
    {
      field: "employeeName",
      headerName: "Name",
      flex: 0.35,
      renderCell: (params: GridRenderCellParams<Employee>) => (
        <Box display="flex" alignItems="center">
          <Avatar
            src={
              employeeMap[params.row.workEmail]?.employeeThumbnail ??
              params.row.employeeThumbnail
            }
            alt={params.row.employeeName}
            sx={{ mr: 1.5, height: "2.2rem", width: "2.2rem" }}
          />
          <Box>
            <Typography variant="h5">{params.row.employeeName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {params.row.workEmail}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "",
      sortable: false,
      flex: 0.15,
      renderCell: (params: GridRenderCellParams<Employee>) => (
        <Box display="flex" alignItems="center">
          <Tooltip
            arrow
            title="View PAR History"
            enterDelay={tooltipVisibilityDelay}
            enterNextDelay={tooltipVisibilityDelay}
          >
            <IconButton
              sx={{
                color: "primary.main",
                "&:hover": { bgcolor: "primary.main", color: "white" },
              }}
              onClick={() =>
                setSelectedEmployee({
                  email: params.row.workEmail,
                  name:
                    employeeMap[params.row.workEmail]?.employeeName ??
                    params.row.employeeName,
                  thumbnail:
                    employeeMap[params.row.workEmail]?.employeeThumbnail ??
                    params.row.employeeThumbnail ??
                    "",
                })
              }
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>

          {params.row.isLead === true && managerEmailSet.has(params.row.workEmail) && (
            <Tooltip
              arrow
              title={`View ${params.row.employeeName}'s Subordinates`}
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <IconButton
                sx={{
                  color: "primary.main",
                  "&:hover": { bgcolor: "primary.main", color: "white" },
                }}
                onClick={() => loadSubordinates(params.row)}
              >
                <Groups3Icon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  if (selectedEmployee) {
    return (
      <Box sx={{ minHeight: "60vh" }}>
        <EmployeeHistoryCard
          onClose={() => setSelectedEmployee(null)}
          empName={selectedEmployee.name}
          empEmail={selectedEmployee.email}
          empThumbnail={selectedEmployee.thumbnail}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {isLoading && (
        <Box sx={{ height: "60vh" }}>
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        </Box>
      )}

      {!isLoading && !hasError && subordinates.length === 0 && (
        <Box sx={{ height: "60vh" }}>
          <NoDataView text="No subordinates found." />
        </Box>
      )}

      {!isLoading && (subordinates.length > 0 || hasError) && (
        <>
          <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
            {navigationHistory.length > 1 && (
              <Tooltip
                arrow
                title="Go Back"
                enterDelay={tooltipVisibilityDelay}
                enterNextDelay={tooltipVisibilityDelay}
              >
                <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
            )}
            <ChainBreadcrumbs
              navigationHistory={navigationHistory}
              onNavigate={handleBreadcrumbNav}
            />
          </Box>

          <Grid container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Box display="flex" justifyContent="flex-end">
                <FormControlLabel
                  control={
                    <Switch
                      color="primary"
                      checked={showLeadsOnly}
                      onChange={() => setShowLeadsOnly((v) => !v)}
                    />
                  }
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
            }}
          >
            <DataGrid
              sx={{
                border: "none",
                "& .MuiDataGrid-row:hover": { backgroundColor: "inherit" },
              }}
              getRowId={(row) => row.workEmail}
              columns={columns}
              rowHeight={55}
              checkboxSelection={false}
              disableRowSelectionOnClick
              autoHeight
              pageSizeOptions={[10, 20, 25]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              rows={getFilteredRows()}
              rowSelectionModel={selectionModel}
              onRowSelectionModelChange={(m: GridRowSelectionModel) =>
                setSelectionModel(m)
              }
            />
          </Card>
        </>
      )}
    </Box>
  );
};

interface ChainBreadcrumbsProps {
  navigationHistory: NavEntry[];
  onNavigate: (index: number) => void;
}

const ChainBreadcrumbs: React.FC<ChainBreadcrumbsProps> = ({
  navigationHistory,
  onNavigate,
}) => (
  <Breadcrumbs
    separator={<NavigateNextIcon fontSize="small" />}
  >
    {navigationHistory.map((item, index) => {
      const isLast = index === navigationHistory.length - 1;
      return isLast ? (
        <Typography key={item.email} color="text.primary">
          {item.name}
        </Typography>
      ) : (
        <Link
          key={item.email}
          component="button"
          onClick={() => onNavigate(index)}
          underline="hover"
          color="primary"
        >
          {item.name}
        </Link>
      );
    })}
  </Breadcrumbs>
);

export default ChainViewTab;
