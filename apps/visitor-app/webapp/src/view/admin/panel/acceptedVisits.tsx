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
  IconButton,
  Alert,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Done } from "@mui/icons-material";
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

const AcceptedVisits = () => {
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
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);

  const visitsList = visits?.visits ?? [];
  const totalVisits = visits?.totalCount || 0;

  useEffect(() => {
    dispatch(
      fetchVisits({
        limit: pageSize,
        offset: page * pageSize,
        status: VisitStatus.accepted,
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

  const handleCompleteVisit = () => {
    if (!currentVisitId) return;

    setOpenCompleteDialog(false);

    const payload = {
      id: +currentVisitId,
      status: VisitStatus.completed,
    };

    dispatch(visitStatusUpdate(payload)).then(() => {
      setCurrentVisitId(null);
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.accepted,
        })
      );
    });
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "Visit ID", minWidth: 100, flex: 1 },
    { field: "name", headerName: "Visitor Name", minWidth: 160, flex: 1.2 },
    // { field: "nicNumber", headerName: "NIC Number", minWidth: 160, flex: 1 },
    // {
    //   field: "contactNumber",
    //   headerName: "Contact Number",
    //   minWidth: 160,
    //   flex: 1,
    // },
    // { field: "email", headerName: "Email", minWidth: 200, flex: 1.5 },
    {
      field: "companyName",
      headerName: "Company Name",
      minWidth: 150,
      flex: 1,
    },
    { field: "passNumber", headerName: "Pass Number", minWidth: 140, flex: 1 },
    {
      field: "timeOfEntry",
      headerName: "Scheduled Date",
      minWidth: 160,
      flex: 1.2,
      renderCell: (params) =>
        params.value ? toLocalDateTime(params.value) : "N/A",
    },
    { field: "status", headerName: "Status", minWidth: 120, flex: 1 },
    {
      field: "action",
      headerName: "Action",
      minWidth: 120,
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <IconButton
          color="success"
          onClick={() => {
            setCurrentVisitId(String(params.row.id));
            setOpenCompleteDialog(true);
          }}
          disabled={
            state === State.loading || statusUpdateState === State.loading
          }
        >
          <Done />
        </IconButton>
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

      {statusUpdateError && (
        <Alert severity="error" sx={{ m: 2 }}>
          {statusUpdateError}
        </Alert>
      )}
      {statusUpdateMessage && statusUpdateState === State.success && (
        <Alert severity="success" sx={{ m: 2 }}>
          {statusUpdateMessage}
        </Alert>
      )}

      {state === State.failed ? (
        <ErrorHandler message={stateMessage || "Failed to load visits."} />
      ) : state === State.success ? (
        visitsList.length === 0 ? (
          <ErrorHandler message="No accepted visits found." />
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
        open={openCompleteDialog}
        onClose={() => {
          setOpenCompleteDialog(false);
          setCurrentVisitId(null);
        }}
      >
        <DialogTitle>Complete Visit</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark visit ID {currentVisitId} as
            completed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCompleteDialog(false);
              setCurrentVisitId(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCompleteVisit}
            variant="contained"
            color="success"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcceptedVisits;
