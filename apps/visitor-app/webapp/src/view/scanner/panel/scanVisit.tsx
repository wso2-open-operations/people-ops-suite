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

import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Container } from "@mui/material";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useAppDispatch } from "@root/src/slices/store";
import { useTheme } from "@mui/material/styles";

function ScanVisit() {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isValidUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10 }, false);
    // Hide info button and file selection after render
    const hideExtraElements = () => {
      const infoBtn = document.querySelector(
        ".html5-qrcode-info-button",
      ) as HTMLElement;
      if (infoBtn) infoBtn.style.display = "none";

      const fileLink = document.getElementById(
        "html5-qrcode-button-file-selection",
      ) as HTMLElement;
      if (fileLink) fileLink.style.display = "none";
    };
    scanner.render(
      (decodedText) => {
        console.log("QR Code:", decodedText);
        if (isValidUrl(decodedText)) {
          window.location.href = decodedText; // or window.open(decodedText, "_blank")
          scanner.clear();
        } else {
          dispatch(
            enqueueSnackbarMessage({
              message: "Scanned QR is not a valid URL.",
              type: "error",
            }),
          );
        }
      },
      (error) => {
        console.warn(error);
      },
    );
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <style>
        {`
          /* Start/Stop buttons match theme primary color */
          #html5-qrcode-button-camera-start,
          #html5-qrcode-button-camera-stop {
            background-color: ${theme.palette.primary.main};
            color: ${theme.palette.primary.contrastText || "white"};
            border: none;
            padding: 10px 22px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          #html5-qrcode-button-camera-start:hover,
          #html5-qrcode-button-camera-stop:hover {
            background-color: ${theme.palette.primary.dark};
          }

          #html5-qrcode-button-camera-start:disabled,
          #html5-qrcode-button-camera-stop:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          /* Hide file selection link and info icon */
          #html5-qrcode-button-file-selection,
          #reader img[alt="Info icon"] {
            display: none !important;
          }
          /* Hide "Scan an Image File" span */
      #html5-qrcode-anchor-scan-type-change {
        display: none !important;
      }
        `}
      </style>
      <div id="reader" />
    </Container>
  );
}

export default ScanVisit;
