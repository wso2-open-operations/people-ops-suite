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
import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Checkbox,
  Typography,
  CircularProgress,
  TablePagination,
  Paper,
  Alert,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@root/src/slices/store";
import {
  fetchVisits,
  approveVisits,
  resetApproveState,
  Visit,
} from "@slices/visitSlice/visit";
import { State } from "@/types/types";
import { enqueueSnackbarMessage } from "@root/src/slices/commonSlice/common";

const VisitsManagement = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { visits, state, approveState, approveMessage, approveError } =
    useSelector((state: RootState) => state.visit);

  const [selectedVisits, setSelectedVisits] = useState<string[]>([]);
  const [passNumbers, setPassNumbers] = useState<{ [key: string]: string }>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Fetch pending visits
  useEffect(() => {
    dispatch(
      fetchVisits({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        status: "PENDING",
      })
    );
  }, [dispatch, page, rowsPerPage]);

  // Reset approval state after success or error
  useEffect(() => {
    if (approveState === State.success || approveState === State.failed) {
      const timer = setTimeout(() => {
        dispatch(resetApproveState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [approveState, dispatch]);

  // Handle visit selection
  const handleSelectVisit = (visitId: number) => {
    setSelectedVisits((prev) =>
      prev.includes(String(visitId))
        ? prev.filter((id) => id !== String(visitId))
        : [...prev, String(visitId)]
    );
  };

  // Handle select all visits
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedVisits(visits?.visits.map((visit) => String(visit.id)) || []);
    } else {
      setSelectedVisits([]);
    }
  };

  // Handle pass number change
  const handlePassNumberChange = (visitId: number, value: string) => {
    setPassNumbers((prev) => ({
      ...prev,
      [String(visitId)]: value,
    }));
  };

  // Handle approve visits
  const handleApproveVisits = () => {
    if (selectedVisits.length === 0) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Please select at least one visit",
          type: "error",
        })
      );
      return;
    }

    // Check if all selected visits have a pass number
    const missingPassNumbers = selectedVisits.filter(
      (id) => !passNumbers[id]?.trim()
    );
    if (missingPassNumbers.length > 0) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Please enter a pass number for all selected visits",
          type: "error",
        })
      );
      return;
    }

    const payload = selectedVisits.map((id) => ({
      id: +id,
      passNumber: +passNumbers[id],
      status: "ACCEPTED",
    }));
    dispatch(approveVisits(payload)).then(() => {
      setSelectedVisits([]);
      setPassNumbers({}); // Clear pass numbers
      dispatch(
        fetchVisits({
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          status: "PENDING",
        })
      );
    });
  };

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Pending Visits Management
      </Typography>

      {approveError && (
        <Alert severity="error" sx={{ my: 2 }}>
          {approveError}
        </Alert>
      )}
      {approveMessage && approveState === State.success && (
        <Alert severity="success" sx={{ my: 2 }}>
          {approveMessage}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    visits?.visits &&
                    selectedVisits.length > 0 &&
                    selectedVisits.length < visits.visits.length
                  }
                  checked={
                    visits?.visits &&
                    visits.visits.length > 0 &&
                    selectedVisits.length === visits.visits.length
                  }
                  onChange={handleSelectAll}
                  disabled={state === State.loading || !visits?.visits.length}
                />
              </TableCell>
              <TableCell>Visit ID</TableCell>
              <TableCell>Visitor Name</TableCell>
              <TableCell>Company Name</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Scheduled Date</TableCell>
              <TableCell>Pass Number</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state === State.loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : !visits?.visits.length ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No pending visits found
                </TableCell>
              </TableRow>
            ) : (
              visits.visits.map((visit: Visit) => (
                <TableRow key={visit.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedVisits.includes(String(visit.id))}
                      onChange={() => handleSelectVisit(visit.id)}
                      //   disabled={state === State.loading || approveState === State.loading}
                    />
                  </TableCell>
                  <TableCell>{visit.id}</TableCell>
                  <TableCell>{visit.name || "N/A"}</TableCell>
                  <TableCell>{visit.companyName || "N/A"}</TableCell>
                  <TableCell>{visit.purposeOfVisit || "N/A"}</TableCell>
                  <TableCell>{visit.timeOfEntry || "N/A"}</TableCell>
                  <TableCell>
                    <TextField
                      value={passNumbers[String(visit.id)] || ""}
                      onChange={(e) =>
                        handlePassNumberChange(visit.id, e.target.value)
                      }
                      //   disabled={state === State.loading || approveState === State.loading}
                      variant="outlined"
                      size="small"
                      placeholder="Enter pass number"
                    />
                  </TableCell>
                  <TableCell>{visit.status || "PENDING"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={visits?.totalCount || 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        disabled={state === State.loading}
      />

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={handleApproveVisits}
          disabled={
            state === State.loading ||
            approveState === State.loading ||
            selectedVisits.length === 0
          }
        >
          Approve Selected Visits
        </Button>
      </div>
    </Container>
  );
};

export default VisitsManagement;
