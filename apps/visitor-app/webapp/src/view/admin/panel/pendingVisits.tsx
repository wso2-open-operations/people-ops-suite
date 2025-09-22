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
  Box,
  Button,
  Dialog,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { CheckCircle, Cancel } from "@mui/icons-material";
import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@root/src/slices/store";
import {
  fetchVisits,
  visitStatusUpdate,
  resetStatusUpdateState,
} from "@slices/visitSlice/visit";
import { State, VisitStatus } from "@/types/types";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import ErrorHandler from "@component/common/ErrorHandler";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";

const toLocalDateTime = (utcString: string) => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  return dayjs
    .utc(utcString)
    .tz(dayjs.tz.guess())
    .format("YYYY-MM-DD HH:mm:ss");
};

const PendingVisits = () => {
  const dispatch = useAppDispatch();
  const {
    visits,
    state,
    statusUpdateState,
    statusUpdateMessage,
    statusUpdateError,
    stateMessage,
  } = useAppSelector((state: RootState) => state.visit);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [blink, setBlink] = useState<string[]>([]);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);
  const [tempPassNumber, setTempPassNumber] = useState("");

  const visitsList = visits?.visits ?? [];
  const totalVisits = visits?.totalCount || 0;

  useEffect(() => {
    dispatch(
      fetchVisits({
        limit: pageSize,
        offset: page * pageSize,
        status: VisitStatus.pending,
      })
    );
  }, [dispatch, page, pageSize]);

  useEffect(() => {
    if (
      statusUpdateState === State.success ||
      statusUpdateState === State.failed
    ) {
      const timer = setTimeout(() => {
        dispatch(resetStatusUpdateState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusUpdateState, dispatch]);

  const handleApproveSingleVisit = () => {
    if (!currentVisitId || !tempPassNumber.trim()) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Please enter a pass number",
          type: "error",
        })
      );
      setBlink([currentVisitId || ""]);
      setTimeout(() => setBlink([]), 1000);
      return;
    }

    setOpenApproveDialog(false);

    const payload = {
      id: +currentVisitId,
      passNumber: +tempPassNumber,
      status: VisitStatus.accepted,
    };
    dispatch(visitStatusUpdate(payload)).then(() => {
      setTempPassNumber("");
      setCurrentVisitId(null);
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.pending,
        })
      );
    });
  };

  const handleRejectSingleVisit = () => {
    if (!currentVisitId) return;

    setOpenRejectDialog(false);

    const payload = {
      id: +currentVisitId,
      status: VisitStatus.rejected,
    };
    dispatch(visitStatusUpdate(payload)).then(() => {
      setCurrentVisitId(null);
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.pending,
        })
      );
    });
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: "Visit ID",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "name",
      headerName: "Visitor Name",
      minWidth: 180,
      flex: 1.5,
    },
    {
      field: "companyName",
      headerName: "Company Name",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "purposeOfVisit",
      headerName: "Purpose",
      minWidth: 150,
      flex: 1,
    },
    {
      field: "timeOfEntry",
      headerName: "Scheduled Date",
      minWidth: 150,
      flex: 1,
      renderCell: (params) =>
        params.value ? toLocalDateTime(params.value) : "N/A",
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "invitationId",
      headerName: "Invitation ID",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 120,
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <>
          <IconButton
            color="primary"
            onClick={() => {
              setCurrentVisitId(String(params.row.id));
              setTempPassNumber("");
              setOpenApproveDialog(true);
            }}
            disabled={
              state === State.loading || statusUpdateState === State.loading
            }
          >
            <CheckCircle />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => {
              setCurrentVisitId(String(params.row.id));
              setOpenRejectDialog(true);
            }}
            disabled={
              state === State.loading || statusUpdateState === State.loading
            }
          >
            <Cancel />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <BackgroundLoader
        open={state === State.loading || statusUpdateState === State.loading}
        message={
          state === State.loading || statusUpdateState === State.loading
            ? stateMessage || "Loading, please wait..."
            : ""
        }
      />

      {state === State.failed ? (
        <ErrorHandler message={stateMessage || "Failed to load visits."} />
      ) : state === State.success ? (
        visitsList.length === 0 ? (
          <ErrorHandler message="Oops! Looks like there are no pending visits." />
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr",
              paddingX: 2,
              paddingTop: 1,
            }}
          >
            <DataGrid
              pagination
              columns={columns}
              rows={visitsList}
              rowCount={totalVisits}
              paginationMode="server"
              pageSizeOptions={[5, 10, 20]}
              rowHeight={47}
              columnHeaderHeight={70}
              disableRowSelectionOnClick
              paginationModel={{ pageSize, page }}
              onPaginationModelChange={(model) => {
                setPageSize(model.pageSize);
                setPage(model.page);
              }}
              sx={{
                border: 0,
                width: "100%",
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#e0e0e0",
                },
              }}
            />
          </Box>
        )
      ) : null}

      <Dialog
        open={openApproveDialog}
        onClose={() => {
          setOpenApproveDialog(false);
          setTempPassNumber("");
          setCurrentVisitId(null);
        }}
      >
        <DialogTitle>Approve Visit</DialogTitle>
        <DialogContent>
          <Typography>
            Enter pass number for visit ID {currentVisitId}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Pass Number"
            type="text"
            fullWidth
            variant="outlined"
            value={tempPassNumber}
            onChange={(e) => setTempPassNumber(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: blink.includes(currentVisitId || "")
                  ? "#fff3f3"
                  : "inherit",
                transition: "background-color 0.5s",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenApproveDialog(false);
              setTempPassNumber("");
              setCurrentVisitId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApproveSingleVisit}
            variant="contained"
            color="primary"
            disabled={!tempPassNumber.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openRejectDialog}
        onClose={() => {
          setOpenRejectDialog(false);
          setCurrentVisitId(null);
        }}
      >
        <DialogTitle>Reject Visit</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reject visit ID {currentVisitId}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenRejectDialog(false);
              setCurrentVisitId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRejectSingleVisit}
            variant="contained"
            color="error"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingVisits;
