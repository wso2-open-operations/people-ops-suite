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

import { Box, Button, Chip, CircularProgress, Collapse, IconButton, Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import React, { useEffect, useState } from 'react';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import { fetchPromotionCycles } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchPromotions, updatePromotion } from "@slices/promotionSlice/promotion";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { LoadingEffect } from "@root/src/component/ui/Loading";
import StateWithImage from "@root/src/component/ui/StateWithImage";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from '@mui/icons-material/Edit';
import { ConfirmationType } from "@root/src/types/types";
import { useConfirmationModalContext } from '@root/src/context/DialogContext';
import Search from "@component/ui/search";

const statusColorMap: Record<string, string> = {
  TIMEBASE: '#f0f4c3',
  REQUESTED: '#e3f2fd',
  ACTIVE: '#c8e6c9',
  SUBMITTED: '#dcedc8',
  DRAFT: '#f0f4c3',
  DECLINED: '#ffcdd2',
  WITHDRAW: '#ffe0b2',
  REMOVED: '#e0e0e0',
  FL_APPROVED: '#b2dfdb',
  APPROVED: '#a5d6a7',
  FL_REJECTED: '#f8bbd0',
  REJECTED: '#ef9a9a',
  EXPIRED: '#d7ccc8',
  PROCESSING: '#fff9c4',
};

export default function IndividualContributor() {

  const dispatch = useAppDispatch();
  const promotions = useAppSelector((state: RootState) => state.promotion);
  const promotionCycle  = useAppSelector((state: RootState) => state.promotionCycle);
  const recommendation  = useAppSelector((state: RootState) => state.recommendation);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [editedComment, setEditedComment] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [openCommentPopup, setOpenCommentPopup] = useState(false);
  const dialogContext = useConfirmationModalContext();
  const [searchKey, setSearchKey] = useState<string>("");
  const [sheetValue, setSheetValue] = useState("");

  const fetchAllPromotions = async () => {
    try {
        const resultAction = await dispatch(fetchPromotionCycles({
          statusArray: ["OPEN"]
        }));

        if (fetchPromotionCycles.fulfilled.match(resultAction) &&
             resultAction.payload.PromotionCycles && 
             resultAction.payload.PromotionCycles.length > 0) {
            const promotionCycleId = resultAction.payload.PromotionCycles[0].id;

            dispatch(fetchPromotions({
                type: "INDIVIDUAL_CONTRIBUTOR",
                cycleId: promotionCycleId
            }));
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
  };
            
  useEffect(() => {
    fetchAllPromotions();
  }, []);

  const handleRefresh = () => {
      fetchAllPromotions();
  }

  const handlePopUpOpen = (req: any) => {
      const comment = req.reasonForRejection;
      setSelectedPromotion(req);
      setEditedComment(comment || "");
      setIsEditingComment(false);
      setOpenCommentPopup(true);
  };

  const handlePopUpClose = () => {
      setOpenCommentPopup(false);
      setSelectedPromotion(null);
      setEditedComment("");
      setIsEditingComment(false);
  };

  const onChangeSearchKey = (event: { target: { value: any } }) => {
      const { value } = event.target;
      setSearchKey(value);
  };

  const handleSheetInputChange = (event: any) => {
      setSheetValue(event.target.value);
  };

  const originalComment = selectedPromotion?.reasonForRejection || "";

  const isSaveDisabled = 
        editedComment.trim() === originalComment.trim() ||
        recommendation?.state === "loading" ||
        editedComment.trim().length === 0;

  const handleSaveComment = async (updatedComment: string) => {
    dialogContext.showConfirmation(
        "Confirm Acceptance",
        `Are you sure you want to Save the comment?`,
        ConfirmationType.accept,
        async () => {
            if (!selectedPromotion) {
                return;
            }
            if (!selectedPromotion.id) {
                return;
            }
            setIsEditingComment(true);
            try {
                await dispatch(
                    updatePromotion({
                        id: selectedPromotion.id,
                        reasonForRejection: updatedComment
                    })
                ).unwrap();
                setIsEditingComment(false);
                setOpenCommentPopup(false);
                setSelectedPromotion(null);
                setEditedComment("");
                handleRefresh();
            } catch (error) {
                setIsEditingComment(false);
            }
        }
        ,
        "Accept",
        "Cancel"
    );
  };

  return (
      <>
          <Box
            sx={{
              p: 5
            }}
          >
              {(promotionCycle.state != "loading" && 
               promotions.state != "loading") && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    height: "auto",
                    marginBottom: "2rem",
                  }}
                >
                  <IconButton
                    component="label"
                    sx={{ marginRight: "4px" }}
                    onClick={() => {
                      handleRefresh()
                    }}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>

                  <Typography variant="h5" sx={{ flex: 1 }}>
                    {" "}
                  </Typography>
              
                  {promotions.state === "success" &&
                   promotions.promotions &&
                   promotions.promotions.length > 0 && (
                    <Search value={searchKey} onChange={onChangeSearchKey} />
                  )}
              
                </Box>
              )}

              {(promotionCycle.state === "loading" || 
                promotions.state === "loading") && (
                <LoadingEffect message={"Loading Promotion History"} />
              )}

              {promotionCycle.state === "success" &&
                !promotionCycle.promotionCycles && (
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
                          message="There is no Active Promotion Cycle."
                      />
                  </Box>
              )}

              {promotionCycle.state === "success" &&
               promotions.state === "success" &&
               promotions.promotions &&
               promotions.promotions.length > 0 && (
                  <>
                      <TableContainer component={Paper}>
                          <Table>
                              <TableHead>
                                  <TableRow>
                                      <TableCell sx={{ px: 4 }} ><strong>Employee Email</strong></TableCell>
                                      <TableCell sx={{ px: 4 }} ><strong>Promotion Status</strong></TableCell>
                                      <TableCell sx={{ px: 4 }} ><strong>Declined Reason</strong></TableCell>
                                      <TableCell sx={{ px: 4 }} ><strong>Lead Email</strong></TableCell>
                                      <TableCell sx={{ px: 4 }} ><strong>Department</strong></TableCell>
                                      <TableCell sx={{ px: 4 }} ><strong>Team</strong></TableCell>
                                      <TableCell sx={{ px: 4 }} ><strong>Promote to</strong></TableCell>
                                  </TableRow>
                              </TableHead>

                              <TableBody>
                                  {(() => {
                                      const filteredPromotions =
                                          promotions.promotions?.filter((user) =>
                                              searchKey === ""
                                                  ? true
                                                  : user.employeeEmail
                                                      .toLowerCase()
                                                      .includes(searchKey.toLowerCase())
                                          ) || [];

                                      return filteredPromotions.length > 0 ? (
                                          filteredPromotions.map((req: any) => {
                                              const recommendation = req.recommendations?.[0];
                                              const status: string = req.status;

                                              return (
                                                  <TableRow key={req.id}>
                                                      <TableCell sx={{ px: 4 }}>
                                                          {req.employeeEmail}
                                                      </TableCell>

                                                      <TableCell sx={{ px: 4 }}>
                                                          <Chip
                                                              label={
                                                                  status ||
                                                                  "N/A"
                                                              }
                                                              size="small"
                                                              sx={{
                                                                  backgroundColor:
                                                                      statusColorMap[
                                                                          status ||
                                                                              ""
                                                                      ] || "#e0e0e0",
                                                                  fontWeight: 500,
                                                              }}
                                                          />
                                                      </TableCell>

                                                      <TableCell sx={{ px: 4 }}>
                                                          {status === "REJECTED" ? (
                                                              <IconButton
                                                                  onClick={() =>
                                                                      handlePopUpOpen(req)
                                                                  }
                                                                  aria-label="View comment"
                                                              >
                                                                  <VisibilityIcon />
                                                              </IconButton>
                                                          ) : (
                                                              <Typography
                                                                  key={req.id}
                                                                  variant="h5"
                                                              >
                                                                  N/A
                                                              </Typography>
                                                          )}
                                                      </TableCell>

                                                      <TableCell sx={{ px: 4 }}>
                                                          {recommendation?.leadEmail || "N/A"}
                                                      </TableCell>

                                                      <TableCell>
                                                          {req.department}
                                                      </TableCell>

                                                      <TableCell>
                                                          {req.team}
                                                      </TableCell>

                                                      <TableCell sx={{ px: 4 }}>
                                                          {req.currentJobBand} →{" "}
                                                          {req.nextJobBand}
                                                      </TableCell>
                                                  </TableRow>
                                              );
                                          })
                                      ) : (
                                          <TableRow>
                                              <TableCell
                                                  colSpan={13}
                                                  align="center"
                                                  sx={{ py: 3 }}
                                              >
                                                  No data available
                                              </TableCell>
                                          </TableRow>
                                      );
                                  })()}
                              </TableBody>
                          </Table>
                      </TableContainer>
                      <Modal
                        open={openCommentPopup}
                        onClose={handlePopUpClose}
                        aria-labelledby="recommendation-comment-title"
                        aria-describedby="recommendation-comment-description"
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 500,
                            bgcolor: "background.paper",
                            boxShadow: 24,
                            borderRadius: 2,
                            p: 3,
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography id="recommendation-comment-title" variant="h6">
                              Declined Reason
                            </Typography>

                            {!isEditingComment && (
                              <Tooltip title="Edit declined reason">
                                <IconButton
                                  aria-label="Edit declined reason"
                                  onClick={() => {
                                    setEditedComment(originalComment);
                                    setIsEditingComment(true);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>

                          {!isEditingComment ? (
                            <Box sx={{ mt: 2, mb: 3 }}>
                              {!(recommendation?.state === "loading") && (
                                <Typography sx={{ mb: 2 }}>
                                  {selectedPromotion?.reasonForRejection ||
                                    "No additional comment provided."}
                                </Typography>
                              )}

                              {recommendation?.state === "loading" && (
                                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                                  <CircularProgress size={24} />
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <TextField
                              fullWidth
                              multiline
                              minRows={4}
                              sx={{ mt: 2, mb: 3 }}
                              value={editedComment}
                              onChange={(e) => setEditedComment(e.target.value)}
                              aria-labelledby="recommendation-comment-title"
                            />
                          )}

                          <Box textAlign="right">
                            {isEditingComment ? (
                              <>
                                <Button
                                  onClick={() => {
                                    setEditedComment(selectedPromotion?.reasonForRejection || "");
                                    setIsEditingComment(false);
                                  }}
                                  sx={{ mr: 1 }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="contained"
                                  disabled={isSaveDisabled}
                                  onClick={() => {
                                    handleSaveComment(editedComment);
                                  }}
                                >
                                  Save
                                </Button>
                              </>
                            ) : (
                              <Button onClick={handlePopUpClose} variant="contained">
                                Close
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Modal>
                  </>
              )}

              {promotionCycle.state === "success" &&
               promotions.state === "success" && 
               promotions.promotions &&
               promotions.promotions.length == 0 && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "70vh",
                        "& img": {
                            width: 360,
                            height: "auto",
                        },
                    }}
                >
                    <StateWithImage
                        imageUrl={require("@assets/images/not-found.svg").default}
                        message="No Promotions Found!"
                    />
                </Box>
            )}

              {(promotionCycle.state === "failed" || 
                  promotions.state === "failed") && (
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
                          message="Unable to load promotion history."
                      />
                  </Box>
              )}
          </Box>
      </>
  );
}