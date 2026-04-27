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
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { useForm } from "react-hook-form";

import { useEffect } from "react";

import InfoIcon from "@assets/icons/InfoIcon";
import { useNewTheme as useTheme } from "@src/theme/index";

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: (reason: string) => void | Promise<void>;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
}

interface FormValues {
  reason: string;
}

function ConfirmationDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  isSubmitting = false,
}: ConfirmationDialogProps) {
  const theme = useTheme();
  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: { reason: "" },
  });

  const reason = watch("reason");
  const isValid = reason.trim().length > 0;

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleConfirm = handleSubmit(async ({ reason }) => {
    const trimmed = reason.trim();
    if (!trimmed || isSubmitting) {
      return;
    }
    await onConfirm(trimmed);
  });

  const handleCancel = () => {
    if (isSubmitting) return;
    reset();
    onCancel();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: 400,
          borderRadius: "12px",
          border: `1px solid ${theme.palette.customBorder.primary.b3.active}`,
          boxShadow: "0px 2px 6px 0px rgba(0,0,0,0.12)",
          backgroundColor: theme.palette.surface.secondary.active,
          p: 1.5,
        },
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: "16px",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            color: theme.palette.customText.primary.p2.active,
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>

        <IconButton
          onClick={handleCancel}
          disabled={isSubmitting}
          size="small"
          sx={{
            p: 0,
            width: 16,
            height: 16,
            color: theme.palette.customText.primary.p2.active,
          }}
        >
          <CloseIcon sx={{ width: 18, height: 18 }} />
        </IconButton>
      </Box>

      {/* ── Reason textarea ── */}
      <form onSubmit={handleConfirm}>
        <TextField
          {...register("reason")}
          multiline
          minRows={3}
          maxRows={5}
          fullWidth
          placeholder="Reason for this action ?"
          disabled={isSubmitting}
          sx={{
            mb: 2,
            "& .MuiInputBase-inputMultiline": {
              padding: "4px !important",
            },
          }}
        />

        {/* ── Info / warning message ── */}
        <Box
          sx={{
            display: "flex",
            gap: "5px",
            alignItems: "flex-start",
            mb: "16px",
          }}
        >
          <Box sx={{ mt: "1px", flexShrink: 0 }}>
            <InfoIcon width={16} height={16} />
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: theme.palette.customText.primary.p2.active,
            }}
          >
            {message}
          </Typography>
        </Box>

        {/* ── Action buttons ── */}
        <Box sx={{ display: "flex", gap: "12px" }}>
          {/* Cancel — brand outline */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancel}
            disabled={isSubmitting}
            type="button"
          >
            {cancelLabel}
          </Button>

          {/* Confirm — neutral outline, brand on hover; disabled until reason typed */}
          <Button
            fullWidth
            variant="outlined"
            disabled={!isValid || isSubmitting}
            type="submit"
            startIcon={
              isSubmitting ? (
                <CircularProgress size={14} thickness={5} color="inherit" />
              ) : undefined
            }
          >
            {confirmLabel}
          </Button>
        </Box>
      </form>
    </Dialog>
  );
}

export default ConfirmationDialog;
