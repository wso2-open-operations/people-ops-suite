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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  CheckCircle,
  Cancel,
  CorporateFare,
  Visibility,
} from "@mui/icons-material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";

import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@root/src/slices/store";
import { fetchVisits, visitStatusUpdate } from "@slices/visitSlice/visit";
import {
  State,
  VisitStatus,
  VisitAction,
  ConfirmationType,
} from "@/types/types";
import ErrorHandler from "@component/common/ErrorHandler";
import FloorRoomSelector from "@root/src/view/employee/component/floorRoomSelector";
import { useConfirmationModalContext } from "@root/src/context/DialogContext";
import BackgroundLoader from "@root/src/component/common/BackgroundLoader";

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
  { floor: "15th Floor", rooms: ["Common Area"] },
  { floor: "Rooftop", rooms: ["Basketball Court"] },
];

const toLocalDateTime = (utcString: string) => {
  return dayjs
    .utc(utcString)
    .tz(dayjs.tz.guess())
    .format("YYYY-MM-DD HH:mm:ss");
};

const approvalValidationSchema = Yup.object({
  passNumber: Yup.string().required("Pass number is required"),
  selectedFloorsAndRooms: Yup.array()
    .min(1, "At least one floor and room must be selected")
    .required("Floor and room selection is required"),
});

const ActiveVisits = () => {
  const dispatch = useAppDispatch();
  const { visits, state, submitState, stateMessage } = useAppSelector(
    (state: RootState) => state.visit
  );

  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isApprovalModalOpen, setIsApprovalModalOpen] =
    useState<boolean>(false);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);
  const [viewAccessibleFloors, setViewAccessibleFloors] =
    useState<boolean>(false);
  const [accessibleFloors, setAccessibleFloors] = useState<
    { floor: string; rooms: string[] }[]
  >([]);
  const dialogContext = useConfirmationModalContext();

  const visitsList = visits?.visits ?? [];
  const totalVisits = visits?.totalCount || 0;

  useEffect(() => {
    dispatch(
      fetchVisits({
        limit: pageSize,
        offset: page * pageSize,
        statusArray: [VisitStatus.requested, VisitStatus.approved],
      })
    );
  }, [dispatch, page, pageSize]);

  const handleApproveSingleVisit = async (
    visitId: string,
    passNumber: string,
    accessibleLocations: { floor: string; rooms: string[] }[]
  ) => {
    try {
      const payload = {
        visitId: +visitId,
        passNumber: passNumber.trim(),
        status: VisitAction.approve,
        accessibleLocations,
        rejectionReason: null,
      };

      await dispatch(visitStatusUpdate(payload));
      setCurrentVisitId(null);
      setIsApprovalModalOpen(false);

      dispatch(
        fetchVisits({
          limit: pageSize,
          offset: page * pageSize,
          statusArray: [VisitStatus.requested, VisitStatus.approved],
        })
      );
    } catch (error) {
      console.error("Error approving visit:", error);
    }
  };

  const handleRejectSingleVisit = (visitId: string) => {
    dialogContext.showConfirmation(
      "Do you want to reject this visit request?",
      "Please share the reason for declining this request.",
      ConfirmationType.accept, // You can change icon type to "update", "send", etc. if desired
      async (reason?: string) => {
        try {
          const payload = {
            visitId: +visitId,
            status: VisitAction.reject,
            rejectionReason: reason?.trim(),
            passNumber: null,
            accessibleLocations: null,
          };

          await dispatch(visitStatusUpdate(payload));

          dispatch(
            fetchVisits({
              limit: pageSize,
              offset: page * pageSize,
              statusArray: [VisitStatus.requested, VisitStatus.approved],
            })
          );
        } catch (error) {
          console.error("Error rejecting visit:", error);
        }
      },
      "Reject",
      "Cancel",
      {
        label: "Rejection Reason",
        mandatory: true,
        type: "textarea",
      }
    );
  };

  const handleCompleteSingleVisit = (visitId: string) => {
    dialogContext.showConfirmation(
      "Do you want to complete this?",
      `This action will mark the visit as completed.`,
      ConfirmationType.accept,
      async () => {
        const payload = {
          visitId: +visitId,
          status: VisitAction.complete,
          passNumber: null,
          accessibleLocations: null,
          rejectionReason: null,
        };

        await dispatch(visitStatusUpdate(payload));
        dispatch(
          fetchVisits({
            limit: pageSize,
            offset: page * pageSize,
            statusArray: [VisitStatus.requested, VisitStatus.approved],
          })
        );
      },
      "Confirm",
      "Cancel"
    );
  };

  const showApprovalModal = (visitId: string) => {
    setCurrentVisitId(visitId);
    setIsApprovalModalOpen(true);
  };

  const showViewAccessibleFloors = (
    locations: { floor: string; rooms: string[] }[]
  ) => {
    setAccessibleFloors(locations || []);
    setViewAccessibleFloors(true);
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "Visitor Name", minWidth: 180, flex: 1.5 },
    {
      field: "contactNumber",
      headerName: "Contact Number",
      minWidth: 150,
      flex: 1,
    },
    { field: "email", headerName: "Visitor Email", minWidth: 200, flex: 1.5 },
    { field: "nicNumber", headerName: "Visitor NIC", minWidth: 150, flex: 1 },
    {
      field: "companyName",
      headerName: "Company Name",
      minWidth: 150,
      flex: 1,
    },
    { field: "passNumber", headerName: "Pass Number", minWidth: 120, flex: 1 },
    { field: "purposeOfVisit", headerName: "Purpose", minWidth: 150, flex: 1 },
    {
      field: "timeOfEntry",
      headerName: "Time Of Entry",
      minWidth: 150,
      flex: 1,
      renderCell: (params) =>
        params.value ? toLocalDateTime(params.value) : "N/A",
    },
    { field: "status", headerName: "Status", minWidth: 120, flex: 1 },
    {
      field: "accessibleLocations",
      headerName: "Accessible Locations",
      minWidth: 100,
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const locations = params.value || [];
        return (
          <Tooltip title="View Attachments" arrow>
            <IconButton
              color="info"
              onClick={() => showViewAccessibleFloors(locations)}
              title="View Accessible Floors"
              disabled={locations.length === 0}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
        );
      },
    },
    {
      field: "action",
      headerName: "Action",
      minWidth: 150,
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => {
        const visit = params.row;
        const isRequested = visit.status === VisitStatus.requested;
        const isApproved = visit.status === VisitStatus.approved;

        return (
          <>
            {isRequested && (
              <>
                <IconButton
                  color="primary"
                  onClick={() => showApprovalModal(String(visit.id))}
                  disabled={
                    state === State.loading || submitState === State.loading
                  }
                  title="Approve Visit"
                >
                  <CheckCircle />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => {
                    handleRejectSingleVisit(visit.id);
                  }}
                  disabled={
                    state === State.loading || submitState === State.loading
                  }
                  title="Reject Visit"
                >
                  <Cancel />
                </IconButton>
              </>
            )}
            {isApproved && (
              <IconButton
                color="secondary"
                onClick={() => handleCompleteSingleVisit(visit.id)}
                disabled={
                  state === State.loading || submitState === State.loading
                }
                title="Complete Visit"
              >
                <AssignmentTurnedInIcon />
              </IconButton>
            )}
          </>
        );
      },
    },
  ];

  return (
    <Box>
      {state === State.loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
            width: "100%",
            py: 4,
          }}
        >
          <CircularProgress />
          <Typography mt={2} color="textSecondary">
            {state === State.loading
              ? stateMessage || "Loading, please wait..."
              : ""}
          </Typography>
        </Box>
      )}

      <BackgroundLoader
        open={submitState === State.loading}
        message={
          submitState === State.loading
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
            width: 800,
            maxHeight: "80vh",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            overflowY: "auto",
          }}
        >
          <Typography
            id="approve-visit-modal"
            variant="h6"
            sx={{ mb: 2, fontWeight: "bold" }}
          >
            Approve Visit ID {currentVisitId}
          </Typography>
          <Formik
            initialValues={{
              passNumber: "",
              selectedFloorsAndRooms: [],
            }}
            validationSchema={approvalValidationSchema}
            onSubmit={(values) => {
              handleApproveSingleVisit(
                currentVisitId || "",
                values.passNumber,
                values.selectedFloorsAndRooms
              );
            }}
          >
            {({ setFieldValue, values, errors, touched }) => (
              <Form>
                <Typography sx={{ mb: 2 }}>
                  Enter pass number and select access floors
                </Typography>
                <Field
                  as={TextField}
                  name="passNumber"
                  label="Pass Number"
                  fullWidth
                  variant="outlined"
                  placeholder="Enter pass number"
                  helperText={
                    (touched.passNumber && errors.passNumber) ??
                    errors.passNumber
                  }
                  error={touched.passNumber && Boolean(errors.passNumber)}
                  sx={{ mb: 2 }}
                />
                <FloorRoomSelector
                  availableFloorsAndRooms={AVAILABLE_FLOORS_AND_ROOMS}
                  selectedFloorsAndRooms={values.selectedFloorsAndRooms}
                  onChange={(value) =>
                    setFieldValue("selectedFloorsAndRooms", value)
                  }
                />
                {touched.selectedFloorsAndRooms &&
                  errors.selectedFloorsAndRooms && (
                    <Typography color="error" sx={{ mt: 1 }}>
                      {errors.selectedFloorsAndRooms}
                    </Typography>
                  )}
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
                    No
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    disabled={
                      state === State.loading || submitState === State.loading
                    }
                  >
                    Yes
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Modal>

      {/* Accessible Floors Dialog */}
      <Dialog
        open={viewAccessibleFloors}
        onClose={() => setViewAccessibleFloors(false)}
      >
        <DialogTitle>Accessible Floors</DialogTitle>
        <DialogContent>
          {accessibleFloors.length === 0 ? (
            <Typography>
              Oops! Looks like there are no accessible floors.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "row", gap: 0.5 }}>
              <List
                sx={{
                  width: "100%",
                  maxWidth: 360,
                  bgcolor: "background.paper",
                }}
              >
                {accessibleFloors.map((floorRoom, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar>
                        <CorporateFare />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={floorRoom.floor}
                      secondary={
                        floorRoom.rooms.length > 0
                          ? floorRoom.rooms.join(", ")
                          : "All rooms"
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setViewAccessibleFloors(false)}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Data Table */}
      {state === State.failed ? (
        <ErrorHandler message={stateMessage || "Failed to load visits."} />
      ) : state === State.success ? (
        visitsList.length === 0 ? (
          <ErrorHandler message="Oops! Looks like there are no active visits." />
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

export default ActiveVisits;
