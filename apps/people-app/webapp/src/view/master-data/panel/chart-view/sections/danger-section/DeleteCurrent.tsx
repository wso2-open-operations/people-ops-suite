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
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { useState } from "react";

import ConfirmationDialog from "@component/common/ConfirmationDialog";

interface DeleteCurrentProps {
  onDelete: (reason: string) => void;
}

export const DeleteCurrent: React.FC<DeleteCurrentProps> = ({ onDelete }) => {
  const theme = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = (reason: string) => {
    setConfirmOpen(false);
    onDelete(reason);
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
            maxWidth: "320px",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.customText.primary.p2.active,
              fontWeight: 500
            }}
          >
            Delete this business unit
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
            Once you delete a business unit, there is no going back. Please be certain.
          </Typography>
        </Box>

        <Button variant="outlined" color="error" onClick={() => setConfirmOpen(true)}>
          Delete
        </Button>
      </Box>

      <ConfirmationDialog
        open={confirmOpen}
        title="Delete Business Unit"
        message="This action is irreversible. All associated data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};
