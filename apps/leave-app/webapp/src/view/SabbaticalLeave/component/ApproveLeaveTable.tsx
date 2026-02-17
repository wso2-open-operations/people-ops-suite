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

import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { useEffect, useState } from "react";

import { getLeaveHistory } from "@root/src/services/leaveService";
import { approveLeaveAction, selectApproveState } from "@root/src/slices/leaveSlice/leave";
import { useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { selectUser } from "@root/src/slices/userSlice/user";
import {
  Action,
  LeaveHistoryResponse,
  LeaveType,
  SingleLeaveHistory,
  State,
  Status,
} from "@root/src/types/types";

interface ApproveLeaveTableProps {
  rows: SingleLeaveHistory[];
  onRefresh?: () => void;
}

interface ConfirmationDialogState {
  open: boolean;
  isApproval: boolean;
  leaveItem: SingleLeaveHistory | null;
}

export default function ApproveLeaveTable({ rows, onRefresh }: ApproveLeaveTableProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUser);
  const approveState = useAppSelector(selectApproveState);
  const [subordinateCount] = useState<number>(userInfo?.subordinateCount || 0);
  const [subordinateOnSabbaticalPercentage, setSubordinateOnSabbaticalPercentage] =
    useState<string>("0%");
  // calculate the subordinate percentage on sabbatical leave during the given period
  const calculateSubordinatePercentage = async (startDate: string, endDate: string) => {
    try {
      const subordinateHistoryOnSabbatical: LeaveHistoryResponse = await getLeaveHistory({
        startDate: startDate,
        endDate: endDate,
        approverEmail: userInfo?.workEmail,
        leaveCategory: [LeaveType.SABBATICAL],
        statuses: [Status.APPROVED],
      });

      if (subordinateCount > 0) {
        setSubordinateOnSabbaticalPercentage(
          (subordinateHistoryOnSabbatical.leaves.length / Number(subordinateCount)) * 100 + "%",
        );
      }
    } catch (error) {
      console.error("Failed to fetch subordinate sabbatical leave history", error);
    }
  };
  const [dialogState, setDialogState] = useState<ConfirmationDialogState>({
    open: false,
    isApproval: true,
    leaveItem: null,
  });
  const isSubmitting = approveState === State.loading;

  useEffect(() => {
    if (dialogState.open && dialogState.leaveItem?.startDate && dialogState.leaveItem?.endDate) {
      calculateSubordinatePercentage(
        dialogState.leaveItem.startDate,
        dialogState.leaveItem.endDate,
      );
    }
  }, [dialogState.open, dialogState.leaveItem?.startDate, dialogState.leaveItem?.endDate]);

  const handleOpenDialog = (item: SingleLeaveHistory, isApproval: boolean) => {
    setDialogState({
      open: true,
      isApproval,
      leaveItem: item,
    });
  };

  const handleCloseDialog = () => {
    setDialogState({
      open: false,
      isApproval: true,
      leaveItem: null,
    });
  };

  const handleConfirm = async () => {
    if (!dialogState.leaveItem) return;

    const result = await dispatch(
      approveLeaveAction({
        leaveId: String(dialogState.leaveItem.id),
        action: dialogState.isApproval ? Action.APPROVE : Action.REJECT,
      }),
    );

    if (approveLeaveAction.fulfilled.match(result)) {
      handleCloseDialog();
      onRefresh?.();
    }
  };

  const columns: GridColDef[] = [
    {
      field: "email",
      headerName: "Employee",
      type: "string",
      flex: 1,
      editable: false,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      type: "string",
      flex: 1,
      editable: false,
      renderCell: (params) => <span>{String(params.row?.startDate ?? "").substring(0, 10)}</span>,
    },
    {
      field: "endDate",
      headerName: "End Date",
      type: "string",
      flex: 1,
      editable: false,
      renderCell: (params) => <span>{String(params.row?.endDate ?? "").substring(0, 10)}</span>,
    },
    {
      field: "numberOfDays",
      headerName: "Day Count",
      type: "string",
      flex: 1,
      editable: false,
    },
    {
      field: "approval",
      headerName: "Approval",
      type: "actions",
      flex: 1.4,
      editable: false,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="space-around"
          alignItems="center"
          width="100%"
          height="100%"
        >
          <Button
            onClick={() => handleOpenDialog(params.row, true)}
            startIcon={<CheckCircleOutlineIcon />}
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: "white",
              width: "40%",
              ":hover": { backgroundColor: theme.palette.primary.light },
            }}
          >
            Approve
          </Button>
          <Button
            onClick={() => handleOpenDialog(params.row, false)}
            startIcon={<CancelOutlinedIcon />}
            sx={{
              color: theme.palette.error.main,
              width: "40%",
              border: `1px solid ${theme.palette.error.main}`,
              ":hover": { backgroundColor: theme.palette.error.light, color: "white" },
            }}
          >
            Reject
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5]}
        disableRowSelectionOnClick
        showToolbar
        slotProps={{
          columnsPanel: {
            sx: {
              "& .MuiTypography-root": {
                color: theme.palette.text.primary,
              },
            },
          },
        }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={dialogState.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogState.isApproval ? "Approve Leave Request" : "Reject Leave Request"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {subordinateOnSabbaticalPercentage} of your subordinates will be on sabbatical leave
            during this period. <br />
            <br />
            {dialogState.isApproval
              ? `Are you sure you want to approve the sabbatical leave request for ${dialogState.leaveItem?.email}?`
              : `Are you sure you want to reject the sabbatical leave request for ${dialogState.leaveItem?.email}?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={isSubmitting} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            variant="contained"
            color={dialogState.isApproval ? "primary" : "error"}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {isSubmitting
              ? "Processing..."
              : dialogState.isApproval
                ? "Confirm Approval"
                : "Confirm Rejection"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
