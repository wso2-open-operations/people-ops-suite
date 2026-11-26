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
import { Box, Dialog, DialogActions, DialogContent, IconButton, Typography } from "@wso2/oxygen-ui";
import { X } from "@wso2/oxygen-ui-icons-react";

import { useId } from "react";

import { BRAND_ORANGE, BRAND_TINT, useIsDark } from "@config/brand";

const TONES = {
  success: { color: "#10B981", background: "rgba(16,185,129,0.15)" },
  brand: { color: BRAND_ORANGE, background: BRAND_TINT.soft },
};

interface StatusDialogProps {
  open: boolean;
  onClose: () => void;
  tone: keyof typeof TONES;
  // A round badge with an icon in it, or a picture of its own; one of them is given.
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  title: string;
  // The width of the pop-up; wider for one that holds a form.
  maxWidth?: "xs" | "sm";
  children: React.ReactNode;
  actions: React.ReactNode;
}

// A centered confirmation pop-up: a picture or an icon badge, a title, some text and a row of buttons, on a card with
// a soft orange glow in its corner and a button to close it.
const StatusDialog = ({
  open,
  onClose,
  tone,
  icon,
  illustration,
  title,
  maxWidth = "xs",
  children,
  actions,
}: StatusDialogProps) => {
  const isDark = useIsDark();
  // The title names the pop-up for screen readers.
  const titleId = useId();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth={maxWidth}
      // The page behind is dimmed more in dark mode, so the card stands out from it in both modes.
      slotProps={{
        backdrop: { sx: { backgroundColor: isDark ? "rgba(2,6,16,0.78)" : undefined } },
      }}
      PaperProps={{
        sx: {
          position: "relative",
          overflow: "hidden",
          borderRadius: "20px",
          textAlign: "center",
          backgroundColor: isDark ? "#0F1626" : "#FFFFFF",
          backgroundImage: isDark
            ? "radial-gradient(circle at 0% 0%, rgba(255,103,0,0.30) 0%, rgba(255,103,0,0) 48%)"
            : "radial-gradient(circle at 0% 0%, rgba(255,103,0,0.16) 0%, rgba(255,103,0,0) 48%)",
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.18)" : "divider",
          boxShadow: isDark ? "0 24px 70px rgba(0,0,0,0.7)" : "0 24px 60px rgba(7,20,46,0.25)",
          // A thin orange arc across the corner.
          "&::before": {
            content: '""',
            position: "absolute",
            top: -330,
            left: -250,
            width: 460,
            height: 460,
            borderRadius: "50%",
            border: "1px solid rgba(255,103,0,0.35)",
            pointerEvents: "none",
          },
        },
      }}
    >
      <IconButton
        aria-label="Close"
        onClick={onClose}
        size="small"
        sx={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 1,
          width: 36,
          height: 36,
          color: "text.primary",
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(7,20,46,0.06)",
          "&:hover": { backgroundColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(7,20,46,0.12)" },
        }}
      >
        <X size={18} />
      </IconButton>
      <DialogContent sx={{ pt: 5, pb: 1, position: "relative" }}>
        {illustration ? (
          <Box sx={{ mx: "auto", mb: 2, display: "flex", justifyContent: "center" }}>
            {illustration}
          </Box>
        ) : (
          <Box
            sx={{
              width: 72,
              height: 72,
              mx: "auto",
              mb: 2,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: TONES[tone].background,
              color: TONES[tone].color,
              boxShadow: `0 0 30px ${TONES[tone].background}`,
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          id={titleId}
          fontWeight={800}
          fontSize="1.7rem"
          lineHeight={1.25}
          color="text.primary"
          mb={1.5}
        >
          {title}
        </Typography>
        {children}
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: "center", gap: 1.5, pb: 4, pt: 2.5, position: "relative" }}
      >
        {actions}
      </DialogActions>
    </Dialog>
  );
};

export default StatusDialog;
