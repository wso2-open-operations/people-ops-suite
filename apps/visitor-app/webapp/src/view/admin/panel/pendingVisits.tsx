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
import { Box, IconButton, Alert, Typography, TextField } from "@mui/material";
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
import { State, VisitStatus, ConfirmationType } from "@/types/types";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import ErrorHandler from "@component/common/ErrorHandler";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import { useConfirmationModalContext } from "@root/src/context/DialogContext";

dayjs.extend(utc);
dayjs.extend(timezone);

const toLocalDateTime = (utcString: string) => {
  return dayjs
    .utc(utcString)
    .tz(dayjs.tz.guess())
    .format("YYYY-MM-DD HH:mm:ss");
};

const PendingVisits = () => {
  const dispatch = useAppDispatch();
  const { visits, state, statusUpdateState, stateMessage } = useAppSelector(
    (state: RootState) => state.visit
  );
  const dialogContext = useConfirmationModalContext();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [blink, setBlink] = useState<string[]>([]);
  const [, setTempPassNumber] = useState("");
  const [, setTempRejectionReason] = useState("");
  const [, setCurrentVisitId] = useState<string | null>(null);

  const visitsList = visits?.visits ?? [];
  const totalVisits = visits?.totalCount || 0;

  useEffect(() => {
    dispatch(
      fetchVisits({
        limit: pageSize,
        offset: page * pageSize,
        status: VisitStatus.request,
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

  // Validation function for pass number
  const validatePassNumber = (passNumber: string): boolean => {
    // Check if pass number is not empty and contains only digits
    return passNumber.trim() !== "" && /^\d+$/.test(passNumber.trim());
  };

  const handleApproveSingleVisit = async (
    visitId: string,
    passNumber: string
  ) => {
    const trimmedPassNumber = passNumber.trim();

    if (!validatePassNumber(trimmedPassNumber)) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Please enter a valid pass number (numbers only)",
          type: "error",
        })
      );
      setBlink([visitId]);
      setTimeout(() => setBlink([]), 1000);
      return;
    }

    try {
      const payload = {
        visitId: +visitId,
        passNumber: +trimmedPassNumber,
        status: VisitStatus.approve,
      };

      await dispatch(visitStatusUpdate(payload));

      // Clear the form state
      setTempPassNumber("");
      setCurrentVisitId(null);

      // Refresh the visits list
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.request,
        })
      );
    } catch (error) {
      console.error("Error approving visit:", error);
    }
  };

  const handleRejectSingleVisit = async (
    visitId: string,
    rejectionReason: string
  ) => {
    try {
      const payload = {
        visitId: +visitId,
        status: VisitStatus.reject,
        rejectionReason: rejectionReason.trim(),
      };

      await dispatch(visitStatusUpdate(payload));

      setCurrentVisitId(null);

      // Refresh the visits list
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.request,
        })
      );
    } catch (error) {
      console.error("Error rejecting visit:", error);
    }
  };

  // Function to show approval dialog
  const showApprovalDialog = (visitId: string) => {
    setCurrentVisitId(visitId);
    setTempPassNumber("");

    dialogContext.showConfirmation(
      "Approve Visit",
      <Box>
        <Typography sx={{ mb: 2 }}>
          Enter pass number for visit ID {visitId}
        </Typography>
        <TextField
          autoFocus
          label="Pass Number"
          type="text"
          fullWidth
          variant="outlined"
          onChange={(e) => {
            setTempPassNumber(e.target.value);
          }}
          placeholder="Enter pass number"
          helperText="Numbers only"
          error={blink.includes(visitId)}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: blink.includes(visitId) ? "#fff3f3" : "inherit",
              transition: "background-color 0.5s",
            },
          }}
        />
      </Box>,
      ConfirmationType.accept,
      async () => {
        var tempValue;
        setTempPassNumber((value) => {
          tempValue = value;
          return value;
        });
        await handleApproveSingleVisit(visitId, tempValue || "");
      },
      "Confirm",
      "Cancel"
    );
  };

  // Function to show rejection dialog
  const showRejectionDialog = (visitId: string) => {
    setCurrentVisitId(visitId);
    setTempRejectionReason("");

    dialogContext.showConfirmation(
      "Reject Visit",
      <Box>
        <Typography sx={{ mb: 2 }}>
          Enter rejection reason for visit ID {visitId}
        </Typography>
        <TextField
          autoFocus
          label="Rejection Reason"
          type="text"
          fullWidth
          variant="outlined"
          onChange={(e) => {
            setTempRejectionReason(e.target.value);
          }}
          placeholder="Enter rejection reason"
          helperText="Provide a reason for rejection"
        />
      </Box>,
      ConfirmationType.accept,
      async () => {
        var tempValue;
        setTempRejectionReason((value) => {
          tempValue = value;
          return value;
        });
        await handleRejectSingleVisit(visitId, tempValue || "");
      },
      "Confirm",
      "Cancel"
    );
  };

  const columns: GridColDef[] = [
    { field: "id", headerName: "Visit ID", minWidth: 100, flex: 1 },
    { field: "name", headerName: "Visitor Name", minWidth: 180, flex: 1.5 },
    {
      field: "companyName",
      headerName: "Company Name",
      minWidth: 150,
      flex: 1,
    },
    { field: "purposeOfVisit", headerName: "Purpose", minWidth: 150, flex: 1 },
    {
      field: "timeOfEntry",
      headerName: "Scheduled Date",
      minWidth: 150,
      flex: 1,
      renderCell: (params) =>
        params.value ? toLocalDateTime(params.value) : "N/A",
    },
    { field: "status", headerName: "Status", minWidth: 120, flex: 1 },
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
            onClick={() => showApprovalDialog(String(params.row.id))}
            disabled={
              state === State.loading || statusUpdateState === State.loading
            }
            title="Approve Visit"
          >
            <CheckCircle />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => showRejectionDialog(String(params.row.id))}
            disabled={
              state === State.loading || statusUpdateState === State.loading
            }
            title="Reject Visit"
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
              }}
            />
          </Box>
        )
      ) : null}
    </Box>
  );
};

export default PendingVisits;
