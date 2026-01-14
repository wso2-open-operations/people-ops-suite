import { Box, useTheme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import {
  fetchFilteredEmployees,
  Employee,
} from "@slices/employeeSlice/employee";
import { SearchForm } from "../searchForm/SearchForm"
import { State } from "@root/src/types/types";
import { PAGE_SIZE_OPTIONS } from "@root/src/config/constant";
import { useNavigate } from "react-router-dom";

export default function EmployeesTable() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const employeeState = useAppSelector((state) => state.employee);
  const navigate = useNavigate();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 3,
  });

  const pagination = useMemo(
    () => ({
      page: paginationModel.page + 1,
      perPage: paginationModel.pageSize,
    }),
    [paginationModel]
  );

  const appliedFilter = useMemo(
    () => ({
      ...employeeState.employeeFilter,
      page: paginationModel.page + 1,
      perPage: paginationModel.pageSize,
    }),
    [employeeState.employeeFilter, paginationModel]
  );

  useEffect(() => {
    dispatch(fetchFilteredEmployees(appliedFilter));
  }, [dispatch, appliedFilter]);

  const rows: Employee[] =
    employeeState.filteredEmployeesResponse.employees ?? [];
  const isLoading: boolean =
    employeeState.filteredEmployeesResponseState === State.loading;

  function getFullName(firstName: string, lastName: string) {
    return `${firstName || ""} ${lastName || ""}`.trim();
  }

  const columns: GridColDef<Employee>[] = [
    {
      field: "employeeId",
      headerName: "Employee ID",
      flex: 1,
      minWidth: 160,
      resizable: false
    },
    {
      field: "fullName",
      headerName: "Employee Full Name",
      flex: 1.5,
      minWidth: 220,
      sortable: false,
      valueGetter: (_value, row) => getFullName(row.firstName, row.lastName),
      resizable: false,
    },
    {
      field: "workEmail",
      headerName: "Work Email",
      flex: 2,
      minWidth: 260,
      resizable: false,
    }
  ];


  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        borderRadius: 2,
        mb: 1,
        boxShadow: 0,
        mt: 1,
        pb: 5,
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 5,
        }}
      >
        <Box>
          <SearchForm
            page={pagination.page}
            perPage={pagination.perPage}
          />
        </Box>
        <Box>
          <DataGrid
            columns={columns}
            rows={rows}
            getRowId={(row: Employee) => row.employeeId}
            pagination
            paginationMode="server"
            rowCount={employeeState.filteredEmployeesResponse.totalCount ?? 0}
            loading={isLoading}
            paginationModel={paginationModel}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPaginationModelChange={(model) => {
              setPaginationModel({
                page: model.page,
                pageSize: model.pageSize,
              });
            }}
            onRowClick={(params) =>
              navigate(`/employees/${params.row.employeeId}`)
            }
          />
        </Box>
      </Box>
    </Box>
  );
}
