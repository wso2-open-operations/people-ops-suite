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

import { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Modal,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { 
  fetchRecommendation, 
  patchRecommendation, 
  approveRecommendation, 
  declineRecommendation 
} from "@slices/recommendationSlice/recommendation";
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import StateWithImage from '@root/src/component/ui/StateWithImage';
import { LoadingEffect } from "@component/ui/Loading";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { fetchActivePromotionCycle } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchEmployeeHistory } from "@slices/employeeSlice/employee";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useConfirmationModalContext } from "@context/DialogContext";
import { ConfirmationType } from "@src/types/types";

export default function Pending() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);
  const promotionCycle  = useAppSelector((state: RootState) => state.promotionCycle);
  const recommendation  = useAppSelector((state: RootState) => state.recommendation);
  const employee  = useAppSelector((state: RootState) => state.employee);
  const [selectedNoteHtml, setSelectedNoteHtml] = useState<string>('');
  const [open, setOpen] = useState(false);
  const dialogContext = useConfirmationModalContext();
  const [rejectReason, setRejectReason] = useState("");
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [openSubmissionPage, setOpenSubmissionPage] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [selectedRecommendationId, setRecommendationID] = useState<number|null>(null);
  const [recommendationText, setRecommendationText] = useState<string>("");
  const [lastSavedText, setLastSavedText] = useState("");
  const isLoading = recommendation.updateState === "loading";

  const loadData = async () => {
    setSelectedEmployee(null);
    
    const resultAction = await dispatch(fetchActivePromotionCycle());

    if (fetchActivePromotionCycle.fulfilled.match(resultAction)) {
      const promotionCycleId =
        resultAction.payload.activePromotionCycles?.id ?? 1;

      if (auth.userInfo?.email) {
        dispatch(fetchRecommendation({
          leadEmail: auth.userInfo.email,
          statusArray: ["REQUESTED"],
          promotionCycleId
        }));
      }
    }
  };

  useEffect(() => {
  try {
    loadData();
  }catch (error) {
      console.error("Failed to fetch promotion requests:", error);
    }
  }, [dispatch, auth.userInfo?.email]);

  const handleClose = () => {
    setOpen(false);
    setSelectedNoteHtml('');
  };

  const handleAcceptOpen = (employee: any, id: number, comment: string, statement: string) => {
    const decodedValue = safeBase64Decode(statement);
    setSelectedEmployee(employee);
    setLastSavedText(employee.recommendationStatement);
    setOpenSubmissionPage(true);
    setRecommendationID(id);
    setRecommendationText(decodedValue);
    dispatch(fetchEmployeeHistory({
      employeeWorkEmail: employee.employeeEmail
    }));
  };

  const handleAcceptClose = () => {
    setOpenSubmissionPage(false);
    setSelectedEmployee(null);
    setRecommendationText("");
    loadData();
  };

  const handleRejectOpen = (employee: any, id: number) => {
    setSelectedEmployee(employee);
    setRecommendationID(id);
    setConfirmRejectOpen(true);
  };

  const handleRejectClose = () => {
    setConfirmRejectOpen(false);
    setRecommendationID(null);
    setRejectReason('');
    setSelectedEmployee(null);
  };

  const safeBase64Encode = (str: string): string => {
    try {
      // First encode the string to UTF-8
      const utf8Bytes = new TextEncoder().encode(str);
      // Convert UTF-8 bytes to binary string
      const binaryString = Array.from(utf8Bytes)
      .map((byte) => String.fromCharCode(byte))
      .join("");
      // Use btoa on the binary string
      return btoa(binaryString);
    } catch (e) {
      console.error("Encoding error:", e);
      // Fallback: remove problematic characters
      const cleanStr = str.replace(/[^\x00-\x7F]/g, "");
      return btoa(cleanStr);
    }
  };

  // Base64 Decode function (reverse of your encode logic)
  const safeBase64Decode = (base64Str: string): string => {
    try {
      // Decode base64 to binary string
      const binaryString = atob(base64Str);
      // Convert binary string to Uint8Array
      const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
      // Decode UTF-8 bytes back to string
      return new TextDecoder().decode(bytes);
    } catch (error) {
      console.error('Decoding error:', error);
      return 'Invalid content';
    }
  };

  const isDraftChanged = recommendationText?.trim() !== safeBase64Decode(lastSavedText.trim());

  const handleSaveDraft = async () => {
    const encodedStatement = safeBase64Encode(recommendationText);
    const resultAction = await dispatch(patchRecommendation({
      id: selectedRecommendationId??1,
      statement: encodedStatement,
      comment: null,
    }))
    if (patchRecommendation.fulfilled.match(resultAction)) {
      setLastSavedText(recommendationText);
    }
  }

  const handleApprove = async () => {

    dialogContext.showConfirmation(
      "Confirm Acceptance",
      `Are you sure you want to Approve this Promotion?`,
      ConfirmationType.accept,
      async () => {
        const resultAction = await dispatch(approveRecommendation({
          id: selectedRecommendationId??1
        }));;

        if (approveRecommendation.fulfilled.match(resultAction)) {
          setOpenSubmissionPage(false);
          setSelectedEmployee(null);
          setRecommendationText("");
          loadData();
        }
      },
      "Accept",
      "Cancel"
    );
  }


  const handleRefresh = () => {

    if (selectedEmployee?.employeeEmail) {
      dispatch(
        fetchEmployeeHistory({
          employeeWorkEmail: selectedEmployee.employeeEmail,
        })
      );
    }else{
      loadData();
    }

  }

  const handleReject= () => {

    dialogContext.showConfirmation(
      "Confirm Acceptance",
      `Are you sure you want to Reject this Promotion?`,
      ConfirmationType.accept,
      async () => {
        const resultAction = await dispatch(declineRecommendation({
          id: selectedRecommendationId??1,
          comment: rejectReason
        }));;

        if (declineRecommendation.fulfilled.match(resultAction)) {
          handleRejectClose();
          loadData();
        }
      },
      "Accept",
      "Cancel"
    );
  }

  return (
    <>
      <Box
        sx={{
          p: 5
        }}
      >
        {recommendation.state != "loading" && (
          <Box 
            sx={{ 
                display: "flex", 
                justifyContent: "flex-start", 
                mb: 2 
            }}
          >
            <IconButton 
                onClick={handleRefresh}
            >
                <RefreshRoundedIcon />
            </IconButton>
        </Box>
        )}

        {recommendation.state === "loading" &&
         !openSubmissionPage && (
            <LoadingEffect message={"Loading Time Base Promotions"} />
        )}

        {recommendation.state === "success" &&
         promotionCycle.state === "success" &&
         !openSubmissionPage && (
          <Box>
            <Box sx={{ px: 7, py: 7 }}>

              {recommendation.recommendations &&
              recommendation.recommendations.length > 0 ? (
                <>
                  <Typography variant="h5" sx={{ mb: 3 }}>
                    Pending Promotions
                  </Typography>

                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Full Name</strong></TableCell>
                          <TableCell><strong>Email</strong></TableCell>
                          <TableCell><strong>Promotion Cycle</strong></TableCell>
                          <TableCell><strong>Promotion Job Band</strong></TableCell>
                          <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recommendation.recommendations.length > 0 ? (
                          recommendation.recommendations.map((emp) => (
                            <TableRow key={emp.recommendationID}>
                              <TableCell>{emp.employeeName}</TableCell>
                              <TableCell>{emp.employeeEmail}</TableCell>
                              <TableCell>{emp.promotionCycle}</TableCell>
                              <TableCell>{emp.currentJobBand} → {emp.promotingJobBand}</TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={2}>
                                  <Button
                                    variant="contained"
                                    sx={{ backgroundColor: '#14AB00', '&:hover': { backgroundColor: '#119000' } }}
                                    onClick={() =>
                                      handleAcceptOpen(
                                        emp,
                                        emp.recommendationID,
                                        emp.recommendationAdditionalComment ?? "",
                                        emp.recommendationStatement ?? ""
                                      )
                                    }
                                  >
                                    Start
                                  </Button>

                                  <Button
                                    variant="contained"
                                    sx={{ backgroundColor: '#FF0000', '&:hover': { backgroundColor: '#cc0000' } }}
                                    onClick={() => handleRejectOpen(emp, emp.recommendationID)}
                                  >
                                    Decline
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No record found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Modal open={open} onClose={handleClose}>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 500,
                        backgroundColor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxHeight: '80vh',
                        overflowY: 'auto',
                      }}
                    >
                      <Typography variant="h6">Recommendation</Typography>

                      <Box
                        sx={{
                          border: '1px solid #ccc',
                          borderRadius: 1,
                          padding: 2,
                          backgroundColor: '#fafafa',
                          fontSize: '0.95rem',
                        }}
                        dangerouslySetInnerHTML={{ __html: selectedNoteHtml }}
                      />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button variant="contained" onClick={handleClose}>
                          Close
                        </Button>
                      </Box>
                    </Box>
                  </Modal>

                  <Modal
                    open={confirmRejectOpen}
                    onClose={handleRejectClose}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 400,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <Typography variant="h6">
                        Reject Recommendation
                      </Typography>

                      <TextField
                        label="Reason for rejection"
                        multiline
                        rows={4}
                        fullWidth
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />

                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                        <Button onClick={handleRejectClose}>
                          Cancel
                        </Button>

                        <Button
                          variant="contained"
                          color="error"
                          onClick={handleReject}
                          disabled={!rejectReason.trim() || isLoading}
                        >
                          Submit
                        </Button>
                      </Box>
                    </Box>
                  </Modal>
                </>
              ) : (
                   <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "50vh",
                        "& img": {
                            width: 360,
                            height: "auto",
                        },
                    }}
                >
                    <StateWithImage
                        imageUrl={require("@assets/images/not-found.svg").default}
                        message="No records found"
                    />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {openSubmissionPage && 
         employee.state === "loading" && (
          <LoadingEffect message={"Loading Employee Info.."} />
        )}

        {openSubmissionPage && 
         employee.state === "success" && (
          <>
            <Box sx={{ p: 3, maxWidth: "95%", mx: "auto" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  gap: 1,
                }}
              >
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={handleAcceptClose} 
                >
                  Back
                </Button>
                <Typography>
                  Promotion Submission / 
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Application
                </Typography>
              </Box>
      
              <Card sx={{ mb: 3, display: "flex", alignItems: "center", p: 2 }}>
                <Avatar
                  src={employee.employeeHistory?.employeeThumbnail ?? ""}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />

                <CardContent sx={{ width: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Employee Email
                      </Typography>
                      <Typography variant="body2">
                        {selectedEmployee.employeeEmail}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Recommended Job Band
                      </Typography>
                      <Typography variant="body2">
                        {selectedEmployee.promotingJobBand}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Joined Date
                      </Typography>
                      <Typography variant="body2">
                        {employee.employeeHistory?.startDate}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Last Promoted Date
                      </Typography>
                      <Typography variant="body2">
                        {employee.employeeHistory?.lastPromotedDate
                          ? employee.employeeHistory.lastPromotedDate
                          : "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Additional Comment
                </Typography>

                <Alert severity="warning" sx={{ mb: 3 }}>
                  If you are experiencing any errors when copying the content from g-doc, please make
                  sure to add the content to a text editor/note and copy it from there before
                  submitting the statement.
                </Alert>
              </Box>

              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 2,
                  '& .quill': {
                    bgcolor: 'white',
                    width: "100%"
                  },
                  '& .ql-container': {
                    minHeight: '200px',
                    width: "100%",
                    fontSize: '14px',
                  },
                  '& .ql-editor': {
                    minHeight: '200px',
                    width: "100%"
                  },
                  width: "100%"
                }}
              >
                <ReactQuill
                  value={recommendationText}
                  onChange={setRecommendationText}
                  theme="snow"
                  modules={{
                    toolbar: [
                      [{ header: '1' }, { header: '2' }, { font: [] }],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['bold', 'italic', 'underline'],
                      ['link'],
                      [{ align: [] }],
                      [{ color: [] }, { background: [] }],
                      [{ script: 'sub' }, { script: 'super' }],
                      ['blockquote', 'code-block'],
                    ],
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleSaveDraft}
                  disabled={isLoading || !isDraftChanged}
                >
                  Save Draft
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleApprove}
                  disabled={isLoading}
                >
                  Approve
                </Button>
              </Box>
            </Box>
          </>
        )}

        {openSubmissionPage && 
         employee.state === "failed" &&  (
            <Box
                sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
                "& img": {
                    width: 360,
                    height: "auto",
                },
                }}
            >
                <StateWithImage
                    imageUrl={require("@root/src/assets/images/error.svg").default}
                    message="Unable to fetch Employee Info!"
                />
            </Box>
        )}

        {recommendation.state === "failed" && (
            <Box
                sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
                "& img": {
                    width: 360,
                    height: "auto",
                },
                }}
            >
                <StateWithImage
                    imageUrl={require("@root/src/assets/images/error.svg").default}
                    message="Unable to load Time Base Promotions."
                />
            </Box>
        )}

        {promotionCycle.state === "failed" && (
            <Box
                sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "50vh",
                "& img": {
                    width: 360,
                    height: "auto",
                },
                }}
            >
                <StateWithImage
                    imageUrl={require("@root/src/assets/images/error.svg").default}
                    message="Unable to fetch Promotion Cycles."
                />
            </Box>
        )}
      </Box>
    </>
  );
}

