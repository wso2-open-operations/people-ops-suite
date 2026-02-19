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
  Card,
  CardContent,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useAppDispatch } from "@root/src/slices/store";
import { useNavigate } from "react-router-dom";
import { AsgardeoConfig } from "@src/config/config";

const ScanVisit: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const hasScannedRef = useRef(false);

  const [isScanning, setIsScanning] = useState(true);

  const readerId = "qr-reader";

  const isValidUrl = (text: string): boolean => {
    try {
      const url = new URL(text);
      const redirectUrl = new URL(AsgardeoConfig.signInRedirectURL);
      return (
        url.origin === redirectUrl.origin &&
        url.pathname.startsWith(redirectUrl.pathname)
      );
    } catch {
      return false;
    }
  };

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

  useEffect(() => {
    const startScanner = async () => {
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

            if (!isValidUrl(decodedText)) {
              hasScannedRef.current = false;

              dispatch(
                enqueueSnackbarMessage({
                  message: "Invalid visit QR code",
                  type: "warning",
                }),
              );
              return;
            }

            setIsScanning(false);

            await safeStop();

            const url = new URL(decodedText);
            const safePath =
              "/" + url.pathname.replace(/^\/+/, "") + url.search + url.hash;

            navigate(safePath);
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
  }, [dispatch, navigate]);

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
            Scan Visit QR
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ask the visitor to present their QR code. The system will
            automatically validate once detected.
          </Typography>

          {/* Camera Preview */}
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

            {/* Loading overlay after scan */}
            {!isScanning && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.5)",
                }}
              >
                <CircularProgress />
              </Box>
            )}
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 2 }}
          >
            Ensure the QR code is clear and visible to the camera.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ScanVisit;
