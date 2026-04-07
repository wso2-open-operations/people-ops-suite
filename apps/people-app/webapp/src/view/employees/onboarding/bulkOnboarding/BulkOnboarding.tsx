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

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Popover,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  resetBulkUploadState,
  uploadBulkEmployees,
} from "@slices/bulkOnboardingSlice/bulkOnboarding";
import { State } from "@/types/types";
import {
  BULK_TEMPLATE_HEADERS,
  BULK_TEMPLATE_EXAMPLE_ROW,
  BULK_TEMPLATE_FILENAME,
  BULK_REQUIRED_FIELDS,
  BULK_OPTIONAL_FIELDS,
} from "@config/constant";
import {
  escapeCsvCell,
  parseCsvRows,
  countCsvDataRows,
  stripBom,
} from "@utils/utils";

interface StepBadgeProps {
  step: number;
  label: string;
  description: string;
  action?: React.ReactNode;
  accent: string;
}

function StepBadge({
  step,
  label,
  description,
  action,
  accent,
}: StepBadgeProps) {
  const theme = useTheme();
  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box
        sx={{
          minWidth: 34,
          height: 34,
          borderRadius: "50%",
          backgroundColor: alpha(accent, 0.15),
          border: `2px solid ${alpha(accent, 0.4)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mt: 0.25,
          flexShrink: 0,
        }}
      >
        <Typography
          fontWeight={700}
          sx={{ color: accent, lineHeight: 1, fontSize: "0.85rem" }}
        >
          {step}
        </Typography>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
          {label}
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: theme.palette.text.secondary, lineHeight: 1.6 }}
        >
          {description}
        </Typography>
        {action && <Box sx={{ mt: 1.25 }}>{action}</Box>}
      </Box>
    </Stack>
  );
}

function ColumnInfoPopover({ accent }: { accent: string }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  return (
    <>
      <Tooltip title="View all columns" placement="top">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            p: 0.5,
            color: alpha(accent, 0.7),
            "&:hover": {
              color: accent,
              bgcolor: alpha(accent, 0.08),
            },
            transition: "color 0.15s, background-color 0.15s",
          }}
          aria-label="View all CSV column details"
        >
          <InfoOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              p: 2,
              maxWidth: 480,
              bgcolor: isDark
                ? theme.palette.background.paper
                : theme.palette.background.default,
              border: `1px solid ${alpha(accent, 0.2)}`,
              borderRadius: 2,
              boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.15)}`,
            },
          },
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          CSV Column Reference
        </Typography>

        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ color: accent, display: "block", mb: 0.75 }}
        >
          Required ({BULK_REQUIRED_FIELDS.length})
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1.5 }}>
          {BULK_REQUIRED_FIELDS.map((f) => (
            <Chip
              key={f}
              label={f}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontFamily: "monospace",
                backgroundColor: alpha(accent, 0.12),
                color: theme.palette.text.primary,
              }}
            />
          ))}
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            color: theme.palette.text.secondary,
            display: "block",
            mb: 0.75,
          }}
        >
          Optional ({BULK_OPTIONAL_FIELDS.length})
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {BULK_OPTIONAL_FIELDS.map((f) => (
            <Chip
              key={f}
              label={f}
              size="small"
              variant="outlined"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontFamily: "monospace",
                borderColor: alpha(theme.palette.divider, 0.6),
                color: theme.palette.text.secondary,
              }}
            />
          ))}
        </Box>

        <Typography
          variant="body2"
          sx={{
            display: "block",
            mt: 1.5,
            color: theme.palette.text.disabled,
            fontStyle: "italic",
          }}
        >
          additionalManagerEmails: semicolon-separated &middot; emergencyContact
          fields travel together &middot; house auto-assigned when blank
        </Typography>
      </Popover>
    </>
  );
}

function buildRowNames(rows: string[][]): Record<number, string> {
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z]/g, ""));
  const firstIdx = headers.indexOf("firstname");
  const lastIdx = headers.indexOf("lastname");
  const names: Record<number, string> = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const firstName = firstIdx >= 0 ? (row[firstIdx] ?? "").trim() : "";
    const lastName = lastIdx >= 0 ? (row[lastIdx] ?? "").trim() : "";
    const name = [firstName, lastName].filter(Boolean).join(" ");
    if (name) names[i + 1] = name;
  }
  return names;
}

export default function BulkOnboarding() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const errorsRef = useRef<HTMLDivElement | null>(null);

  const { state, errors, created, skipped } = useAppSelector(
    (store) => store.bulkOnboarding,
  );

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [rowNames, setRowNames] = useState<Record<number, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const isUploading = state === State.loading;
  const isSuccess = state === State.success;
  const isFailed = state === State.failed;
  const accent = theme.palette.secondary.contrastText;
  const isDark = theme.palette.mode === "dark";

  const errorsByRow = useMemo(() => {
    const map = new Map<number, typeof errors>();
    for (const err of errors) {
      if (!map.has(err.row)) map.set(err.row, []);
      map.get(err.row)!.push(err);
    }
    return [...map.entries()].sort(([rowA], [rowB]) => rowA - rowB);
  }, [errors]);

  useEffect(() => {
    if (errors.length > 0 && errorsRef.current) {
      setTimeout(() => {
        errorsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 80);
    }
  }, [errors]);

  useEffect(() => {
    if (state === State.success) {
      setSelectedFile(null);
      setRowCount(null);
      setRowNames({});
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [state]);

  const handleDownloadTemplate = useCallback(() => {
    const csv = [
      BULK_TEMPLATE_HEADERS.map(escapeCsvCell).join(","),
      BULK_TEMPLATE_EXAMPLE_ROW.map(escapeCsvCell).join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = BULK_TEMPLATE_FILENAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      setFileError(null);
      dispatch(resetBulkUploadState());

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setFileError("Only .csv files are supported.");
        setSelectedFile(null);
        setRowCount(null);
        setRowNames({});
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const raw = typeof reader.result === "string" ? reader.result : "";
        const parsed = parseCsvRows(stripBom(raw));
        setRowCount(countCsvDataRows(parsed));
        setRowNames(buildRowNames(parsed));
        setSelectedFile(file);
      };
      reader.onerror = () => {
        setFileError("Failed to read the CSV file.");
        setSelectedFile(null);
        setRowCount(null);
        setRowNames({});
      };
      reader.readAsText(file);
    },
    [dispatch],
  );

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;
    await dispatch(uploadBulkEmployees(selectedFile));
  }, [dispatch, selectedFile]);

  const handleReset = useCallback(() => {
    dispatch(resetBulkUploadState());
    setSelectedFile(null);
    setRowCount(null);
    setRowNames({});
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [dispatch]);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={3}
        alignItems="stretch"
      >
        {/* Instructions panel */}
        <Paper
          elevation={0}
          sx={{
            flex: { lg: "0 0 38%" },
            p: 2.5,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.18 : 0.14)}`,
            background: isDark
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.95),
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h6" fontWeight={700}>
            How it works ?
          </Typography>

          <Stack spacing={2}>
            <StepBadge
              step={1}
              accent={accent}
              label="Download the template"
              description="Get the CSV with all required and optional columns pre-filled with an example row."
              action={
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={handleDownloadTemplate}
                  sx={{ textTransform: "none" }}
                >
                  Download Template
                </Button>
              }
            />
            <Divider />
            <StepBadge
              step={2}
              accent={accent}
              label="Fill in your data"
              description="Add one employee per row. Required fields must be present; optional fields can be left blank."
            />
            <Divider />
            <StepBadge
              step={3}
              accent={accent}
              label="Upload & validate"
              description="Drop your CSV on the right. All rows are validated before any employee is created."
            />
          </Stack>

          <Box
            sx={{
              mt: "auto",
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(accent, isDark ? 0.08 : 0.05),
              border: `1px solid ${alpha(accent, 0.15)}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{ color: accent }}
              >
                {BULK_REQUIRED_FIELDS.length} required&nbsp;&middot;&nbsp;
                <Typography
                  component="span"
                  variant="body1"
                  sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}
                >
                  {BULK_OPTIONAL_FIELDS.length} optional
                </Typography>
              </Typography>
              <ColumnInfoPopover accent={accent} />
            </Stack>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {BULK_REQUIRED_FIELDS.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    fontFamily: "monospace",
                    backgroundColor: alpha(accent, 0.1),
                    color: theme.palette.text.primary,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {/* Upload panel */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            minWidth: 0,
          }}
        >
          <Box
            component="div"
            onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() =>
              !selectedFile && !isSuccess && fileInputRef.current?.click()
            }
            sx={{
              flex: 1,
              minHeight: 220,
              borderRadius: 3,
              border: `2px dashed ${
                isDragOver
                  ? accent
                  : alpha(theme.palette.divider, isDark ? 0.35 : 0.45)
              }`,
              backgroundColor: isDragOver
                ? alpha(accent, 0.06)
                : isSuccess
                  ? alpha(theme.palette.success.main, 0.04)
                  : isFailed
                    ? alpha(theme.palette.error.main, 0.03)
                    : alpha(theme.palette.background.paper, isDark ? 0.4 : 0.6),
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: selectedFile || isSuccess ? "default" : "pointer",
              transition: "border-color 0.18s, background-color 0.18s",
              p: 3,
              "&:hover": !(selectedFile || isSuccess)
                ? {
                    borderColor: alpha(accent, 0.55),
                    backgroundColor: alpha(accent, 0.04),
                  }
                : {},
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              hidden
              onChange={handleFileChange}
            />

            {isSuccess ? (
              <Stack alignItems="center" spacing={2}>
                <CheckCircleOutlineIcon
                  sx={{ fontSize: 56, color: theme.palette.success.main }}
                />
                <Typography variant="h6" fontWeight={700}>
                  Upload complete
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      textAlign: "center",
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <Typography
                      variant="h5"
                      fontWeight={800}
                      sx={{ color: theme.palette.success.main }}
                    >
                      {created}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: theme.palette.text.secondary }}
                    >
                      {created === 1 ? "employee" : "employees"} created
                    </Typography>
                  </Paper>
                  {skipped > 0 && (
                    <Paper
                      elevation={0}
                      sx={{
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        textAlign: "center",
                        backgroundColor: alpha(
                          theme.palette.warning.main,
                          0.08,
                        ),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      }}
                    >
                      <Typography
                        variant="h5"
                        fontWeight={800}
                        sx={{ color: theme.palette.warning.main }}
                      >
                        {skipped}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{ color: theme.palette.text.secondary }}
                      >
                        empty {skipped === 1 ? "row" : "rows"} skipped
                      </Typography>
                    </Paper>
                  )}
                </Stack>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ textTransform: "none" }}
                >
                  Upload another file
                </Button>
              </Stack>
            ) : selectedFile ? (
              <Stack alignItems="center" spacing={2} sx={{ width: "100%" }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    backgroundColor: alpha(accent, isDark ? 0.12 : 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InsertDriveFileOutlinedIcon
                    sx={{ fontSize: 28, color: accent }}
                  />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedFile.name}
                  </Typography>
                  {rowCount !== null && (
                    <Chip
                      label={`${rowCount} data row${rowCount !== 1 ? "s" : ""} detected`}
                      size="small"
                      sx={{
                        mt: 0.5,
                        backgroundColor: alpha(accent, 0.12),
                        color: accent,
                        fontWeight: 600,
                        fontSize: "0.78rem",
                      }}
                    />
                  )}
                </Box>
                {fileError && (
                  <Chip
                    icon={<ErrorOutlineIcon />}
                    label={fileError}
                    color="error"
                    size="small"
                    sx={{ fontSize: "0.75rem" }}
                  />
                )}
                <Stack direction="row" spacing={1.5}>
                  <Button
                    size="small"
                    variant="outlined"
                    component="label"
                    startIcon={<UploadFileOutlinedIcon />}
                    sx={{ textTransform: "none" }}
                  >
                    Change File
                    <input
                      type="file"
                      accept=".csv"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      isUploading ? (
                        <CircularProgress size={14} color="inherit" />
                      ) : (
                        <CloudUploadOutlinedIcon />
                      )
                    }
                    onClick={handleUpload}
                    disabled={isUploading}
                    sx={{
                      textTransform: "none",
                      backgroundColor: accent,
                      "&:hover": { backgroundColor: alpha(accent, 0.85) },
                    }}
                  >
                    {isUploading ? "Uploading…" : "Upload & Create"}
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    backgroundColor: alpha(accent, isDark ? 0.12 : 0.08),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CloudUploadOutlinedIcon
                    sx={{ fontSize: 36, color: accent }}
                  />
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" fontWeight={600}>
                    Drop your CSV here
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ color: theme.palette.text.secondary, mt: 0.25 }}
                  >
                    or{" "}
                    <Typography
                      component="span"
                      variant="body1"
                      fontWeight={600}
                      sx={{ color: accent, cursor: "pointer" }}
                    >
                      click to browse
                    </Typography>
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: theme.palette.text.disabled }}
                >
                  .csv files only
                </Typography>
              </Stack>
            )}
          </Box>

          {fileError && !selectedFile && (
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.error.main, 0.08),
                border: `1px solid ${alpha(theme.palette.error.main, 0.25)}`,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ErrorOutlineIcon
                sx={{ fontSize: 20, color: theme.palette.error.main }}
              />
              <Typography
                variant="body1"
                sx={{ color: theme.palette.error.main }}
              >
                {fileError}
              </Typography>
            </Paper>
          )}
        </Box>
      </Stack>

      {/* Validation errors */}
      {errors.length > 0 && (
        <Box ref={errorsRef}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: alpha(theme.palette.error.main, 0.12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ErrorOutlineIcon
                sx={{ color: theme.palette.error.main, fontSize: 22 }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ color: theme.palette.error.main }}
                >
                  Validation Errors
                </Typography>
                <Chip
                  label={`${errors.length} error${errors.length !== 1 ? "s" : ""} across ${errorsByRow.length} row${errorsByRow.length !== 1 ? "s" : ""}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    backgroundColor: alpha(theme.palette.error.main, 0.12),
                    color: theme.palette.error.main,
                  }}
                />
              </Stack>
              <Typography
                variant="body1"
                sx={{ color: theme.palette.text.secondary, mt: 0.25 }}
              >
                Fix all issues listed below and re-upload — no employees were
                created.
              </Typography>
            </Box>
          </Stack>

          <Stack spacing={1.5}>
            {errorsByRow.map(([rowNum, rowErrors]) => (
              <Accordion
                key={rowNum}
                defaultExpanded
                elevation={0}
                sx={{
                  border: `1px solid ${alpha(theme.palette.error.main, 0.22)}`,
                  borderRadius: "10px !important",
                  backgroundColor: isDark
                    ? alpha(theme.palette.error.main, 0.06)
                    : alpha(theme.palette.error.main, 0.03),
                  "&:before": { display: "none" },
                  "&.Mui-expanded": { margin: "12px 0" },
                }}
              >
                <AccordionSummary
                  expandIcon={
                    <ExpandMoreIcon
                      sx={{ color: theme.palette.error.main, fontSize: 20 }}
                    />
                  }
                  sx={{
                    minHeight: 48,
                    px: 2,
                    "&.Mui-expanded": { minHeight: 48 },
                    "& .MuiAccordionSummary-content": {
                      alignItems: "center",
                      gap: 1.5,
                      my: "10px",
                    },
                  }}
                >
                  <Chip
                    label={`Row ${rowNum}`}
                    size="small"
                    sx={{
                      height: 26,
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      backgroundColor: alpha(theme.palette.error.main, 0.14),
                      color: theme.palette.error.main,
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                  {rowNames[rowNum] && (
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {rowNames[rowNum]}
                    </Typography>
                  )}
                  <Chip
                    label={`${rowErrors.length} error${rowErrors.length !== 1 ? "s" : ""}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      color: theme.palette.error.main,
                      ml: "auto",
                      flexShrink: 0,
                    }}
                  />
                </AccordionSummary>

                <AccordionDetails sx={{ px: 2, pt: 0, pb: 1.5 }}>
                  <Divider
                    sx={{
                      mb: 1.25,
                      borderColor: alpha(theme.palette.error.main, 0.15),
                    }}
                  />
                  <Stack spacing={1}>
                    {rowErrors.map((error, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        alignItems="flex-start"
                        spacing={1}
                        sx={{ flexWrap: "wrap" }}
                      >
                        <Typography
                          component="code"
                          sx={{
                            fontSize: "0.82rem",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            px: 0.75,
                            py: 0.2,
                            borderRadius: 0.75,
                            backgroundColor: alpha(
                              theme.palette.error.main,
                              0.1,
                            ),
                            color: theme.palette.error.main,
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          {error.field}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "0.82rem",
                            color: theme.palette.text.secondary,
                            lineHeight: "1.6rem",
                          }}
                        >
                          —
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ color: theme.palette.text.primary }}
                        >
                          {error.message}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
