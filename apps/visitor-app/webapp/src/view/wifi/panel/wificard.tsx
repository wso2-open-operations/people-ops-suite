import * as React from "react";
import {
  CardContent,
  TextField,
  IconButton,
  Tooltip,
  InputAdornment,
  Stack,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import {
  RootState,
  useAppDispatch,
  useAppSelector,
} from "@root/src/slices/store";
import { fetchWifiDetails } from "@slices/wifiSlice/wifi";
import ErrorHandler from "@component/common/ErrorHandler";
import { enqueueSnackbarMessage } from "@root/src/slices/commonSlice/common";

const WifiCard = () => {
  const dispatch = useAppDispatch();

  const { ssid, password, loading, error } = useAppSelector(
    (store: RootState) => store.wifi
  );

  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [copied, setCopied] = React.useState<"ssid" | "password" | null>(null);

  const handleCopy = async (text: string, which: "ssid" | "password") => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(which);
        setTimeout(() => setCopied(null), 1400);
      } else {
        throw new Error("Clipboard not available");
      }
    } catch {
      dispatch(
        enqueueSnackbarMessage({
          message: "Failed to copy to clipboard. Please copy manually.",
          type: "error",
        })
      );
    }
  };

  React.useEffect(() => {
    dispatch(fetchWifiDetails());
  }, [dispatch]);

  if (loading) {
    return (
      <Box
        sx={{
          height: "80vh",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 4,
        }}
      >
        <CircularProgress />
        <Typography mt={2} color="textSecondary">
          {"Loading WiFi details..."}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <ErrorHandler message={"Failed to load WiFi information."} />;
  }

  return (
    <CardContent>
      <Stack
        spacing={2}
        sx={{
          width: { xs: "100%", sm: "80%", md: "60%", lg: "40%" },
          m: { xs: 1, sm: 2 },
        }}
      >
        <TextField
          label="Network (SSID)"
          value={ssid}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied === "ssid" ? "Copied!" : "Copy SSID"}>
                  <IconButton onClick={() => handleCopy(ssid, "ssid")}>
                    <ContentCopyRoundedIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={showPassword ? "Hide" : "Show"}>
                  <IconButton onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? (
                      <VisibilityOffRoundedIcon />
                    ) : (
                      <VisibilityRoundedIcon />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip
                  title={copied === "password" ? "Copied!" : "Copy Password"}
                >
                  <IconButton onClick={() => handleCopy(password, "password")}>
                    <ContentCopyRoundedIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          fullWidth
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography
            variant="body2"
            sx={{
              p: 1,
              px: 1.5,
              borderRadius: 1.5,
              fontFamily: "ui-monospace, Menlo, Consolas, monospace",
              border: (t) => `1px dashed ${t.palette.divider}`,
              bgcolor: (t) =>
                t.palette.mode === "dark" ? "action.selected" : "action.hover",
              whiteSpace: { xs: "normal", sm: "nowrap" },
              overflowX: { sm: "auto" },
            }}
            tabIndex={0}
          >
            SSID: {ssid} | Password: {showPassword ? password : "••••••••"}
          </Typography>

          <Tooltip title="Copy Share Text">
            <IconButton
              onClick={() =>
                handleCopy(`SSID: ${ssid}\nPassword: ${password}`, "ssid")
              }
            >
              <ContentCopyRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </CardContent>
  );
};

export default WifiCard;
