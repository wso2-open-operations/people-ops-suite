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
import { Box, Button, Typography, useTheme } from "@mui/material";

import { useEffect, useRef, useState } from "react";

import ConfirmationDialog from "@component/common/ConfirmationDialog";
import { SPLIT_VIEW_SKELETON_DELAY_MS } from "@root/src/config/constant";
import { useMinimumLoadingVisibility } from "@root/src/hooks/useMinimumLoadingVisibility";
import { NodeType } from "@root/src/utils/types";
import { convertDataTypeToLabel } from "@root/src/utils/utils";

interface DeleteCurrentProps {
  onDelete: (reason: string) => Promise<void>;
  isDeleting: boolean;
  onDeleteSuccessComplete?: () => void;
  nodeType: NodeType;
}

export const DeleteCurrent: React.FC<DeleteCurrentProps> = ({
  onDelete,
  isDeleting,
  onDeleteSuccessComplete,
  nodeType,
}) => {
  const theme = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingCloseAfterSpinner, setPendingCloseAfterSpinner] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isMountedRef = useRef(true);

  const isDeleteInProgress = isDeleting || confirming;
  const showSpinner = useMinimumLoadingVisibility(isDeleteInProgress, SPLIT_VIEW_SKELETON_DELAY_MS);
  const dialogSubmitting = isDeleteInProgress || (pendingCloseAfterSpinner && showSpinner);
  const nodeTypeLabel = convertDataTypeToLabel(nodeType);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!confirmOpen || !pendingCloseAfterSpinner || showSpinner) return;

    setConfirmOpen(false);
    setPendingCloseAfterSpinner(false);
    onDeleteSuccessComplete?.();
  }, [confirmOpen, pendingCloseAfterSpinner, showSpinner, onDeleteSuccessComplete]);

  const handleConfirm = async (reason: string) => {
    setConfirming(true);
    try {
      await onDelete(reason);
      if (!isMountedRef.current) return;
      setPendingCloseAfterSpinner(true);
    } catch (e) {
      console.error(`Delete ${nodeTypeLabel} failed`, e);
    } finally {
      if (!isMountedRef.current) return;
      setConfirming(false);
    }
  };

  const handleCancel = () => {
    if (dialogSubmitting) return;
    setPendingCloseAfterSpinner(false);
    setConfirmOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "start",
          justifyContent: "space-between",
          padding: "12px",
          borderRadius: "6px",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            justifyContent: "center",
            maxWidth: "360px",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.customText.primary.p2.active,
              fontWeight: 500,
            }}
          >
            Delete this {nodeTypeLabel}
          </Typography>

          <Typography
            sx={{
              fontSize: "12px",
              fontFamily: "Geist, sans-serif",
              fontWeight: 400,
              lineHeight: 1.6,
              letterSpacing: "0.12px",
              color: theme.palette.customText.primary.p3.active,
              whiteSpace: "pre-wrap",
            }}
          >
            Once you delete a {nodeTypeLabel}, there is no going back. Please be certain.
          </Typography>
        </Box>

        <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </Box>

      <ConfirmationDialog
        open={confirmOpen}
        title={`Delete ${nodeTypeLabel}`}
        message="This action is irreversible. All associated data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isSubmitting={dialogSubmitting}
      />
    </>
  );
};
