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
  IconButton,
  Typography,
  TextField,
  Modal,
  Button,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { CheckCircle, Cancel } from "@mui/icons-material";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

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
import { State, VisitStatus, VisitAction } from "@/types/types";
import ErrorHandler from "@component/common/ErrorHandler";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";
import FloorRoomSelector from "@root/src/view/employee/component/floorRoomSelector";

dayjs.extend(utc);
dayjs.extend(timezone);

const AVAILABLE_FLOORS_AND_ROOMS = [
  { floor: "1st Floor", rooms: ["Cafeteria"] },
  { floor: "6th Floor", rooms: ["The Launchpad"] },
  { floor: "7th Floor", rooms: ["CloudScape", "DigIntel", "TerminalX"] },
  { floor: "8th Floor", rooms: ["Octave", "Melody"] },
  { floor: "9th Floor", rooms: ["Grove", "Orchard"] },
  { floor: "9th and 10th", rooms: ["The Circuit"] },
  { floor: "10th Floor", rooms: ["Elevate Zone", "Chamber"] },
  { floor: "11th Floor", rooms: ["Tinker Room"] },
  { floor: "12th Floor", rooms: ["Emerald", "Synergy"] },
  { floor: "13th Floor", rooms: ["Quarter Crunch", "Deal Den"] },
  { floor: "14th Floor", rooms: ["Cove", "Skyline", "Pinnacle", "Vertex"] },
];

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

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const [selectedFloorsAndRooms, setSelectedFloorsAndRooms] = useState<
    { floor: string; rooms: string[] }[]
  >([]);

  const [isApprovalModalOpen, setIsApprovalModalOpen] =
    useState<boolean>(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] =
    useState<boolean>(false);

  const [tempPassNumber, setTempPassNumber] = useState<string>("");
  const [tempRejectionReason, setTempRejectionReason] = useState<string>("");
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);

  const visitsList = visits?.visits ?? [];
  const totalVisits = visits?.totalCount || 0;

  useEffect(() => {
    dispatch(
      fetchVisits({
        limit: pageSize,
        offset: page * pageSize,
        status: VisitStatus.requested,
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

  const handleApproveSingleVisit = async (
    visitId: string,
    passNumber: string,
    accessibleLocations: { floor: string; rooms: string[] }[]
  ) => {
    const trimmedPassNumber = passNumber.trim();

    try {
      const payload = {
        visitId: +visitId,
        passNumber: trimmedPassNumber,
        status: VisitAction.approve,
        accessibleLocations: accessibleLocations,
        rejectionReason: null,
      };

      await dispatch(visitStatusUpdate(payload));

      // Clear the form state
      setTempPassNumber("");
      setSelectedFloorsAndRooms([]);
      setCurrentVisitId(null);
      setIsApprovalModalOpen(false);

      // Refresh the visits list
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.requested,
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
        status: VisitAction.reject,
        rejectionReason: rejectionReason.trim(),
        passNumber: null,
        accessibleLocations: null,
      };

      await dispatch(visitStatusUpdate(payload));

      setCurrentVisitId(null);
      setTempRejectionReason("");
      setIsRejectionModalOpen(false);

      // Refresh the visits list
      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          status: VisitStatus.requested,
        })
      );
    } catch (error) {
      console.error("Error rejecting visit:", error);
    }
  };

  // Function to show approval modal
  const showApprovalModal = (visitId: string) => {
    setCurrentVisitId(visitId);
    setTempPassNumber("");
    setSelectedFloorsAndRooms([]);
    setIsApprovalModalOpen(true);
  };

  const showRejectionModal = (visitId: string) => {
    setCurrentVisitId(visitId);
    setTempRejectionReason("");
    setIsRejectionModalOpen(true);
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
            onClick={() => showApprovalModal(String(params.row.id))}
            disabled={
              state === State.loading || statusUpdateState === State.loading
            }
            title="Approve Visit"
          >
            <CheckCircle />
          </IconButton>
          <IconButton
            color="error"
            onClick={() => showRejectionModal(String(params.row.id))}
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

      {/* Approval Modal */}
      <Modal
        open={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        aria-labelledby="approve-visit-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflowY: "auto",
          }}
        >
          <Typography id="approve-visit-modal" variant="h6" sx={{ mb: 2 }}>
            Approve Visit ID {currentVisitId}
          </Typography>
          <Box>
            <Typography sx={{ mb: 2 }}>
              Enter pass number and select access floors
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
            />
            <FloorRoomSelector
              availableFloorsAndRooms={AVAILABLE_FLOORS_AND_ROOMS}
              selectedFloorsAndRooms={selectedFloorsAndRooms}
              onChange={(value) => {
                setSelectedFloorsAndRooms(value);
              }}
            />
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setIsApprovalModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() =>
                  handleApproveSingleVisit(
                    currentVisitId || "",
                    tempPassNumber,
                    selectedFloorsAndRooms
                  )
                }
                disabled={
                  state === State.loading || statusUpdateState === State.loading
                }
              >
                Confirm
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        open={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        aria-labelledby="reject-visit-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflowY: "auto",
          }}
        >
          <Typography id="reject-visit-modal" variant="h6" sx={{ mb: 2 }}>
            Reject Visit ID {currentVisitId}
          </Typography>
          <Box>
            <Typography sx={{ mb: 2 }}>Enter rejection reason</Typography>
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
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setIsRejectionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() =>
                  handleRejectSingleVisit(
                    currentVisitId || "",
                    tempRejectionReason
                  )
                }
                disabled={
                  state === State.loading || statusUpdateState === State.loading
                }
              >
                Confirm
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

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
