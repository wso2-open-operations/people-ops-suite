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

import { useEffect, useState } from "react";
import { serviceUrls } from "@/config/config";
import { AppsSharp, Warning } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";
import useHttp, { executeWithTokenHandling } from "@/utils/http";
import { goToMyAppsScreen } from "@/components/microapp-bridge";

export const MaintenanceBanner = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const { handleRequest, handleRequestWithNewToken } = useHttp();

  useEffect(() => {
    const fetchConfigs = () => {
      executeWithTokenHandling(
        handleRequest,
        handleRequestWithNewToken,
        serviceUrls.fetchAppConfigs(),
        "GET",
        null,
        (data: any) => {
          if (data) {
            setIsMaintenanceMode(!!data.isMaintenanceMode);
          }
        },
        (err) => {
          console.error("Failed to fetch app configs:", err);
        },
        () => {} // Optional loading function
      );
    };

    fetchConfigs();
    const interval = setInterval(fetchConfigs, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isMaintenanceMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center pointer-events-auto">
      {/* 9-dot Leave Button */}
      <div className="absolute top-[var(--safe-top,20px)] left-4 z-10 pt-4">
        <IconButton
          onClick={() => setIsExitDialogOpen(true)}
          aria-label="Back to Super App"
          size="large"
          className="bg-white/10 hover:bg-white/20"
        >
          <AppsSharp className="text-white" />
        </IconButton>
      </div>

      <div className="bg-white dark:bg-[#1F2A44] rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center space-y-4">
        <div className="w-16 h-16 bg-[#ff7300]/10 rounded-full flex items-center justify-center mb-2">
          <Warning className="text-[#ff7300]" sx={{ fontSize: 36 }} />
        </div>
        <h2 className="text-2xl font-bold text-[#1F2A44] dark:text-white">
          Under Maintenance
        </h2>
        <p className="text-[#808080] dark:text-gray-300">
          The app is currently undergoing maintenance and is temporarily unavailable. Please check back later.
        </p>
      </div>

      {/* Exit Dialog */}
      <Dialog
        open={isExitDialogOpen}
        onClose={() => setIsExitDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        sx={{ zIndex: 10000 }}
        PaperProps={{
          sx: {
            borderRadius: "16px",
            p: 1.75,
            m: 2,
          },
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <DialogTitle sx={{ p: 0, fontSize: "1rem", fontWeight: 700, lineHeight: 1.5, color: "#1F2A44" }}>
              Return to Apps
            </DialogTitle>
            <DialogContent
              sx={{
                p: 0,
                pt: 1,
                fontSize: "0.875rem",
                lineHeight: 1.2,
                color: "#5F6368",
                whiteSpace: "normal",
              }}
            >
              Are you sure you want to leave this application?
            </DialogContent>
          </Box>

          <DialogActions sx={{ p: 0, justifyContent: "flex-end", gap: 1.25 }}>
            <Button
              variant="outlined"
              onClick={() => setIsExitDialogOpen(false)}
              sx={{
                minWidth: 98,
                borderRadius: 999,
                px: 2.25,
                py: 0.75,
                borderColor: "#ff7300",
                color: "#ff7300",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#e86800",
                  backgroundColor: "rgba(255, 115, 0, 0.06)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                setIsExitDialogOpen(false);
                goToMyAppsScreen();
              }}
              sx={{
                minWidth: 98,
                borderRadius: 999,
                px: 2.25,
                py: 0.75,
                backgroundColor: "#ff7300",
                color: "#fff",
                fontWeight: 600,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: "#e86800",
                  boxShadow: "none",
                },
              }}
            >
              Leave
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </div>
  );
};
