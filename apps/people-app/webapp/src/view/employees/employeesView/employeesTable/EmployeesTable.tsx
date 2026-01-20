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

import { Box, useTheme } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import {
  fetchFilteredEmployees,
  Employee,
} from "@slices/employeeSlice/employee";
import { SearchForm } from "../searchForm/SearchForm";
import { State } from "@src/types/types";
import { PAGE_SIZE_OPTIONS } from "@config/constant";
import { useNavigate } from "react-router-dom";

export default function EmployeesTable() {
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
          display: "flex",
          flexDirection: "column"
        }}
      >
        <Box>
          <SearchForm page={pagination.page} perPage={pagination.perPage} />
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
  );
}
