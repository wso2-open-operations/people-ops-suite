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

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useAppDispatch } from "@root/src/slices/store";
import { useNavigate } from "react-router-dom";

const ScanVisit: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const hasScannedRef = useRef(false);

  const [activeTab, setActiveTab] = useState(0);
  const [pin, setPin] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const readerId = "qr-reader";

  const safeStop = async () => {
    try {
      if (html5QrCodeRef.current && isRunningRef.current) {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
        isRunningRef.current = false;
      }
    } catch {
      // ignore — prevents "scanner not running" error
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(value);
  };

  const handlePinSubmit = async () => {
    navigate(`/admin-panel?tab=active-visits&visitVerificationCode=${pin}`);
  };

  const handleTabChange = async (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    if (newValue === 1) {
      // Switching to PIN mode - stop scanner
      await safeStop();
    } else {
      // Switching to QR mode - restart scanner
      setPin("");
      setIsValidating(false);
    }
  };

  useEffect(() => {
    const startScanner = async () => {
      // Only start scanner if on QR tab
      if (activeTab !== 0) return;

      try {
        html5QrCodeRef.current = new Html5Qrcode(readerId);

        await html5QrCodeRef.current.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1,
          },
          async (decodedText: string) => {
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            await safeStop();

            navigate(
              `/admin-panel?tab=active-visits&visitVerificationCode=${decodedText}`,
            );
          },
          () => {},
        );

        isRunningRef.current = true;
      } catch {
        dispatch(
          enqueueSnackbarMessage({
            message: "Unable to access camera",
            type: "error",
          }),
        );
      }
    };

    startScanner();

    return () => {
      safeStop();
    };
  }, [dispatch, navigate, activeTab]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Card
        elevation={0}
        sx={{
          maxWidth: 520,
          mx: "auto",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Verify Visit
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {activeTab === 0
              ? "Ask the visitor to present their QR code. The system will automatically validate once detected."
              : "Enter the 6-digit PIN provided to the visitor."}
          </Typography>

          {/* Tabs for QR / PIN */}
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Scan QR Code" />
            <Tab label="Enter PIN" />
          </Tabs>

          {/* QR Scanner */}
          {activeTab === 0 && (
            <>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  bgcolor: "#000",
                  borderRadius: 1,
                  overflow: "hidden",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box id={readerId} sx={{ width: "100%", height: "100%" }} />
              </Box>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 2 }}
              >
                Ensure the QR code is clear and visible to the camera.
              </Typography>
            </>
          )}

          {/* PIN Input */}
          {activeTab === 1 && (
            <Box sx={{ py: 2 }}>
              <TextField
                fullWidth
                label="Enter 6-digit PIN"
                value={pin}
                onChange={handlePinChange}
                placeholder="000000"
                inputProps={{
                  maxLength: 6,
                  style: {
                    fontSize: "1.5rem",
                    textAlign: "center",
                    letterSpacing: "0.5rem",
                  },
                }}
                sx={{ mb: 3 }}
                disabled={isValidating}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handlePinSubmit();
                  }
                }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handlePinSubmit}
                disabled={pin.length !== 6 || isValidating}
                sx={{ py: 1.5 }}
              >
                {isValidating ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Verify PIN"
                )}
              </Button>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 2, textAlign: "center" }}
              >
                The PIN is shared with the visitor via email or SMS.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ScanVisit;
