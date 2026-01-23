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

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

import { useState } from "react";

export interface LeaveCardProps {
  id: number;
  type: string;
  startDate: string;
  endDate: string;
  duration: string;
  month: string;
  day: string;
  cancelling: boolean;
  onDelete?: (id: number) => void;
}

export default function LeaveCard({
  id,
  duration,
  type,
  startDate,
  endDate,
  month,
  day,
  cancelling,
  onDelete,
}: LeaveCardProps) {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleConfirmDelete = () => {
    onDelete?.(id);
    setOpenDialog(false);
  };

  const isCancelDisabled = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaveStart = new Date(startDate);
    leaveStart.setHours(0, 0, 0, 0);
    const diffInDays = (leaveStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays < 1;
  };

  return (
    <Card
      sx={{
        borderRadius: "12px",
        border: `1px solid ${theme.palette.divider}`,
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(5, 5, 5, 0.08)",
        "&:hover": {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-2px)",
          transition: "all 0.2s ease",
        },
      }}
    >
      <CardContent sx={{ p: "1.25rem" }}>
        <Stack direction="row" spacing="1rem" alignItems="center">
          <Stack spacing="1rem" flex={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                }}
              >
                {type.toLocaleUpperCase()} LEAVE
              </Typography>
              <Tooltip title="Cancel" arrow>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleOpenDialog}
                    disabled={isCancelDisabled()}
                    sx={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "4px",
                      color: isCancelDisabled()
                        ? theme.palette.text.disabled
                        : theme.palette.common.white,
                      backgroundColor: isCancelDisabled()
                        ? theme.palette.action.disabledBackground
                        : theme.palette.error.main,
                      "&:hover": {
                        backgroundColor: theme.palette.error.dark,
                      },
                      "&.Mui-disabled": {
                        backgroundColor: theme.palette.action.disabledBackground,
                        color: theme.palette.text.disabled,
                      },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            <Stack direction="row" gap="1rem" alignItems="center">
              {/* Mini Calendar */}
              <Box
                sx={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "8px",
                  border: `2px solid ${theme.palette.primary.main}`,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {/* Month header */}
                <Box
                  sx={{
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    textAlign: "center",
                    py: "2px",
                    flex: "0 0 auto",
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {month}
                  </Typography>
                </Box>

                {/* Date */}
                <Box
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              </Box>

              {/* Leave Details */}
              <Stack spacing="4px" flex={1}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 500,
                  }}
                >
                  {startDate} - {endDate}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                  }}
                >
                  {duration}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Cancel Leave Request</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to cancel this leave request? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary" disabled={cancelling}>
            No, Keep It
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : null}
            disabled={cancelling}
            autoFocus
          >
            {cancelling ? "Cancelling..." : "Yes, Cancel"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
