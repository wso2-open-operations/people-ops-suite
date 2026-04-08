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

import { useState, useEffect } from "react";

import ErrorHandler from "@component/common/ErrorHandler";

import {
  Card,
  CardContent,
  TextField,
  IconButton,
  Tooltip,
  InputAdornment,
  Stack,
  Typography,
  CircularProgress,
  Box,
  Divider,
} from "@mui/material";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { createWifiAccount } from "@slices/wifiSlice/wifi";

const WifiCard = () => {
  const dispatch = useAppDispatch();

  const { ssid, loading, error } = useAppSelector(
    (store: RootState) => store.wifi,
  );

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<"ssid" | "password" | "both" | null>(
    null,
  );

  const handleCopy = async (
    text: string,
    which: "ssid" | "password" | "both",
  ) => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(which);
        setTimeout(() => setCopied(null), 1800);
        dispatch(
          enqueueSnackbarMessage({
            message: "Copied to clipboard",
            type: "success",
          }),
        );
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to copy. Please select and copy manually.",
          type: "error",
        }),
      );
    }
  };

  useEffect(() => {
    dispatch(createWifiAccount("visitor")).then((res: any) => {
      setPassword(res.payload.password);
    });
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
          p: 4,
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="body1" color="text.secondary">
          Fetching WiFi credentials...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <ErrorHandler message={error} />;
  }

  const fullCredentials = `SSID: ${ssid}\nPassword: ${password}`;

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        maxWidth: 560,
        mx: "auto",
        mt: 4,
        mb: 6,
        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <WifiRoundedIcon color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h5" component="h1" fontWeight={600}>
              Wi-Fi Network Details
            </Typography>
          </Stack>

          <Typography variant="body1" color="text.secondary">
            Use these credentials to connect to the corporate wireless network.
          </Typography>

          <Divider sx={{ my: 1 }} />

          {/* SSID Field */}
          <TextField
            label="Network Name (SSID)"
            value={ssid}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={copied === "ssid" ? "Copied!" : "Copy SSID"}>
                    <IconButton
                      edge="end"
                      onClick={() => handleCopy(ssid, "ssid")}
                      color={copied === "ssid" ? "success" : "default"}
                    >
                      <ContentCopyRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "action.hover", borderRadius: 1 }}
          />

          {/* Password Field */}
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            fullWidth
            variant="outlined"
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <VisibilityOffRoundedIcon />
                      ) : (
                        <VisibilityRoundedIcon />
                      )}
                    </IconButton>
                  </Tooltip>

                  <Tooltip
                    title={copied === "password" ? "Copied!" : "Copy password"}
                  >
                    <IconButton
                      onClick={() => handleCopy(password, "password")}
                      color={copied === "password" ? "success" : "default"}
                      edge="end"
                    >
                      <ContentCopyRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: "action.hover", borderRadius: 1 }}
          />

          <Divider />

          {/* Unified credentials row + copy all */}
          <Box
            sx={{
              position: "relative",
              p: 2.5,
              pr: 7,
              borderRadius: 2,
              bgcolor: "grey.50",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="body2"
              fontFamily="ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace"
              sx={{ wordBreak: "break-all" }}
            >
              {showPassword
                ? fullCredentials
                : `SSID: ${ssid}   |   Password: ••••••••`}
            </Typography>

            <Tooltip title={copied === "both" ? "Copied!" : "Copy both"}>
              <IconButton
                size="large"
                onClick={() => handleCopy(fullCredentials, "both")}
                color={copied === "both" ? "success" : "primary"}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                }}
              >
                <ContentCopyRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Optional: small helper text */}
          <Typography variant="caption" color="text.secondary" align="center">
            These credentials are managed centrally. Contact IT if you encounter
            issues.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default WifiCard;
