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
  Box,
  Grid,
  Link,
  Paper,
  Avatar,
  Button,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Typography,
  Breadcrumbs,
  Table as MuiTable,
} from "@mui/material";
import "jspdf-autotable";
import jsPDF from "jspdf";
import dayjs from "dayjs";
import {
  selectEmployeeRatings,
  updateParRatingOfEmployee,
  fetchCurrentParCycleOfEmployee,
} from "@slices/employeeSlice/employee";
import { useState } from "react";
import CommentPaper from "./CommentPaper";
import EmployeeChip from "./EmployeeChip";
import { selectUserEmail } from "@slices/authSlice/auth";
import autoTable, { RowInput } from "jspdf-autotable";
import { selectEmployeeMap } from "@slices/metaSlice/meta";
import { ConfirmationDialog } from "./ConfirmationDialog";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { base64Regex, uiMessages } from "@config/constant";
import { useAppDispatch, useAppSelector } from "@slices/store";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { ParEmployeeStatus, parRatingNotAssigned, ParSpecialRating, ParLeadStatus } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParCycle } from "@root/src/slices/parCycleSlice/parCycle";

interface EmployeeParProp {
  closeParRatingView?: () => void;
  selectedCycle: Partial<ParCycle>;
  previousPageName?: string;
  isDeadlinePassed?: boolean;
}

export const EmployeePar = ({
  closeParRatingView,
  selectedCycle: currentCycle,
  previousPageName,
  isDeadlinePassed,
}: EmployeeParProp) => {
  const dispatch = useAppDispatch();
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const employeeRatings = useAppSelector(selectEmployeeRatings);
  const [isUnshareInProgress, setIsUnshareInProgress] = useState(false);
  const openUnshareConfirmationDialog = () =>
    setIsUnshareConfirmationDialogOpen(true);
  const closeUnshareConfirmationDialog = () =>
    setIsUnshareConfirmationDialogOpen(false);
  const [isUnshareConfirmationDialogOpen, setIsUnshareConfirmationDialogOpen] =
    useState(false);

  const handleParUnshare = async () => {
    setIsUnshareInProgress(true);
    const resultAction = await dispatch(
      updateParRatingOfEmployee({
        employeeId: userEmail,
        parCycleId: currentCycle.parCycleId,
        parRatingId: employeeRatings?.parRatingId,
        values: { parEmployeeStatus: ParEmployeeStatus.DRAFT },
      })
    );

    if (updateParRatingOfEmployee.fulfilled.match(resultAction) && userEmail) {
      dispatch(fetchCurrentParCycleOfEmployee(userEmail));
    }
    setIsUnshareInProgress(false);
  };

  const downloadPDF = async () => {
    dispatch(
      enqueueSnackbarMessage({
        message: "Generating the PDF",
        type: "info",
      })
    );

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    // Converts sanitized (optionally base64-encoded) HTML to plain text for PDF output,
    // preserving basic formatting like lists and text hierarchy.
    const formatCommentForPDF = (html: string): string => {
      if (!html) return "-";

      const decoded = base64Regex.test(html)
        ? decodeURIComponent(atob(html))
        : html;
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = decoded;

      const rootIndent = "    ";

      const processElement = (element: HTMLElement, depth = 0): string => {
        let result = "";
        const indent = "    ".repeat(depth);

        if (element.tagName === "UL") {
          const items = element.querySelectorAll("li");
          items.forEach((li) => {
            result += `${indent}• ${processElement(
              li as HTMLElement,
              depth + 1
            )}\n`;
          });
          return result;
        }

        if (element.tagName === "OL") {
          const items = element.querySelectorAll("li");
          items.forEach((li, index) => {
            result += `${indent}${index + 1}. ${processElement(
              li as HTMLElement,
              depth + 1
            )}\n`;
          });
          return result;
        }

        if (element.tagName === "LI") {
          return Array.from(element.childNodes)
            .map((node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent?.trim() || "";
              }
              return processElement(node as HTMLElement, depth);
            })
            .join(" ")
            .trim();
        }

        if (element.children.length > 0) {
          Array.from(element.children).forEach((child) => {
            result += processElement(child as HTMLElement, depth);
          });
        } else {
          const text = element.textContent?.replace(/\s+/g, " ").trim() || "";
          if (text) result += text + "\n";
        }

        return result;
      };

      const processedContent = processElement(tempDiv);

      return processedContent
        .split("\n")
        .map((line) => (line.trim() ? `${rootIndent}${line}` : line))
        .join("\n");
    };

    const allTableRows = [];

    if (employeeRatings.parEmployeeComment) {
      allTableRows.push([
        "Employee Comment",
        "",
        {
          content: formatCommentForPDF(employeeRatings.parEmployeeComment),
          styles: {
            textColor: [50, 50, 50],
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          },
        },
      ]);
    }

    if (employeeRatings.parLeadComment) {
      allTableRows.push([
        "Lead Comment",
        "",
        {
          content: formatCommentForPDF(employeeRatings.parLeadComment),
          styles: {
            textColor: [50, 50, 50],
            cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          },
        },
      ]);
    }

    autoTable(doc, {
      head: [
        [
          {
            content: ` - Employee: ${employeeMap[employeeRatings.parEmployeeEmail]?.employeeName ??
              employeeRatings.parEmployeeEmail
              }\n - PAR Rating: ${employeeRatings.parRating === parRatingNotAssigned
                ? "Not Assigned"
                : employeeRatings.parRating
              }\n - Top 5%/20% Rating: ${employeeRatings.parSpecialRating !== ParSpecialRating.NONE
                ? employeeRatings.parSpecialRating
                : "Not Assigned"
              }\n - PAR Shared By: ${employeeRatings.parRatingSharedBy
                ? employeeMap[employeeRatings.parRatingSharedBy]
                  ?.employeeName || employeeRatings.parRatingSharedBy
                : "Not Provided"
              }`,
            colSpan: 3,
            styles: {
              halign: "left",
              fontSize: 12,
              cellPadding: { bottom: 10, top: 10 },
            },
          },
        ],
      ],
      showHead: "firstPage",
      body: allTableRows as RowInput[],
      startY: 30,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        overflow: "linebreak",
        valign: "top",
      },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 60 },
        2: {
          cellWidth: "auto",
          fontStyle: "normal",
        },
      },
    });

    doc.save(`${employeeRatings.parEmployeeEmail}_par_summary.pdf`);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        height: `calc(100vh - ${17}rem)`,
        overflow: "hidden",
      }}
    >
      <Box
        p={1}
        pt={0}
        sx={{
          height: `calc(100vh - ${previousPageName ? 20 : 18}rem)`,
          overflow: "auto",
        }}
      >
        {previousPageName && closeParRatingView && (
          <Breadcrumbs aria-label="breadcrumb" sx={{ paddingBottom: 2 }}>
            <IconButton
              aria-label="back"
              color="primary"
              onClick={closeParRatingView}
            >
              <ArrowBackIcon />
            </IconButton>

            <Link
              underline="hover"
              color="inherit"
              onClick={closeParRatingView}
            >
              {previousPageName ? previousPageName : "Home"}
            </Link>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography display="inline" variant="h5">
                  {currentCycle.parCycleName}{" "}
                </Typography>
                <Typography display="inline">
                  ({dayjs(currentCycle.parCycleStartDate).format("D MMM 'YY")} -{" "}
                  {dayjs(currentCycle.parCycleEndDate).format("D MMM 'YY")})
                </Typography>
              </Box>
            </Box>
          </Breadcrumbs>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: employeeRatings?.parLeadStatus === ParLeadStatus.SHARED ? 6 : 12 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                height: "100%",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                mb={1}
                justifyContent="space-between"
              >
                <Box display="flex" alignItems="center" gap={2}>
                  {userEmail ? (
                    <Avatar
                      src={
                        employeeMap[userEmail ?? ""]?.employeeThumbnail ?? ""
                      }
                      alt={employeeRatings.parLeadEmail}
                      sx={{
                        width: 48,
                        height: 48,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        E
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography
                      variant="h5"
                      fontWeight="700"
                      color="primary.main"
                      sx={{ mb: 0.5 }}
                    >
                      Employee PAR
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdfIcon />}
                  onClick={downloadPDF}
                  sx={{
                    "&:hover": { boxShadow: "none" },
                  }}
                >
                  DOWNLOAD
                </Button>
              </Box>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #bfdbfe",
                  mb: 1,
                  minHeight:
                    employeeRatings?.parLeadStatus === ParLeadStatus.SHARED
                      ? "14vh"
                      : "auto",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontStyle: "italic" }}
                >
                  {currentCycle.parCycleConfigurations?.employeeParQuestion}
                </Typography>
              </Box>

              <CommentPaper comment={employeeRatings.parEmployeeComment} />
            </Paper>
          </Grid>

          {employeeRatings?.parLeadStatus === ParLeadStatus.SHARED && (
            <Grid size={{ xs: 12, sm: 6 }} >
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  height: "100%",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  },
                }}
              >
                <Box display="flex" alignItems="center" gap={2} mb={1}>
                  {employeeRatings.parLeadEmail ? (
                    <Avatar
                      src={
                        employeeMap[employeeRatings.parLeadEmail ?? ""]
                          ?.employeeThumbnail
                      }
                      alt={employeeRatings.parLeadEmail}
                      sx={{
                        width: 48,
                        height: 48,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        M
                      </Typography>
                    </Box>
                  )}

                  <Box>
                    <Typography variant="h5" fontWeight="700" sx={{ mb: 0.5 }}>
                      Lead's Feedback
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {employeeRatings.parLeadEmail}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Box
                    mb={1}
                    sx={{
                      borderRadius: 2,
                      border: "1px solid #bbf7d0",
                      maxHeight: "5%",
                      minHeight: "14vh",
                      overflow: "auto",
                    }}
                  >
                    <MuiTable
                      size="small"
                      sx={{ width: "100%", height: "100%" }}
                    >
                      <TableBody>
                        <TableRow>
                          {employeeRatings.parRating && (
                            <>
                              <TableCell sx={{ fontWeight: 600, width: "25%" }}>
                                PAR Rating
                              </TableCell>
                              <TableCell sx={{ width: "25%" }}>
                                <EmployeeChip
                                  isSpecial={false}
                                  isFromLead={true}
                                  text={employeeRatings.parRating!}
                                />
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                        <TableRow>
                          {employeeRatings.parSpecialRating && (
                            <>
                              <TableCell sx={{ fontWeight: 600 }}>
                                Top 5%/20% Rating
                              </TableCell>
                              <TableCell>
                                <EmployeeChip
                                  isSpecial={true}
                                  isFromLead={false}
                                  text={employeeRatings.parSpecialRating!}
                                />
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                        <TableRow>
                          {employeeRatings.parRatingSharedBy && (
                            <>
                              <TableCell sx={{ fontWeight: 600 }}>
                                PAR Shared By
                              </TableCell>
                              <TableCell sx={{ textAlign: "center" }}>
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                  sx={{ fontStyle: "italic" }}
                                >
                                  {employeeMap[
                                    employeeRatings.parRatingSharedBy
                                  ]?.employeeName ||
                                    employeeRatings.parRatingSharedBy ||
                                    "-"}
                                </Typography>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      </TableBody>
                    </MuiTable>
                  </Box>

                  <CommentPaper comment={employeeRatings.parLeadComment} />
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>

        {(!previousPageName || !closeParRatingView) &&
          employeeRatings?.parEmployeeStatus === ParEmployeeStatus.SHARED &&
          employeeRatings?.parLeadStatus !== ParLeadStatus.SHARED && (
            <Box display="flex" justifyContent="flex-end" pt={4}>
              <Button
                color="error"
                variant="outlined"
                onClick={openUnshareConfirmationDialog}
                disabled={isDeadlinePassed}
              >
                UNSHARE
              </Button>
            </Box>
          )}
      </Box>

      <ConfirmationDialog
        open={isUnshareConfirmationDialogOpen}
        onClose={closeUnshareConfirmationDialog}
        title={uiMessages.dialog.employeeParUnshare.title}
        message={uiMessages.dialog.employeeParUnshare.message}
        okText={uiMessages.dialog.employeeParUnshare.okText}
        onConfirm={handleParUnshare}
        ariaLabelledby="alert-par-unshare-dialog-title"
        ariaDescribedby="alert-par-unshare-dialog-description"
        showLoading={true}
        isLoading={isUnshareInProgress}
        isWarning={true}
      />
    </Box>
  );
};
