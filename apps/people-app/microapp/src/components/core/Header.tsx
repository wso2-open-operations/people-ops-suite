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

import { SearchInput } from "@/components/ui";
import { goToMyAppsScreen } from "@/components/microapp-bridge";
import { AppsSharp } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";
import { useState } from "react";

function Header() {
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-white px-4 sticky top-0 z-20">
        <div className="pt-[calc(var(--safe-top)+12px)] pb-4 border-b border-[#E5E5E5]">
          <div className="relative h-10 mb-4">
            <h1 className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-[1.125rem] font-semibold text-[#1F2A44] whitespace-nowrap">
              People
            </h1>
            <IconButton
              onClick={() => setIsExitDialogOpen(true)}
              aria-label="Back to Super App"
              size="small"
              className="!absolute !left-0 !top-1/2 !-translate-y-1/2"
            >
              <AppsSharp className="text-[#1F2A44]" />
            </IconButton>
          </div>
          <SearchInput />
        </div>
      </header>

      <Dialog
        open={isExitDialogOpen}
        onClose={() => setIsExitDialogOpen(false)}
        fullWidth
        maxWidth="xs"
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
    </>
  );
}

export default Header;
