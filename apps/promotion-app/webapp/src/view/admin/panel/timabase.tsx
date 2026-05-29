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

import { Box, Button, Card, CardContent, Chip, CircularProgress, Collapse, IconButton, Modal, Paper, Radio, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import React, { useEffect, useState } from 'react';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import { fetchPromotionCycles } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchPromotions, createTimebasePormotions } from "@slices/promotionSlice/promotion";
import { patchRecommendation } from "@slices/recommendationSlice/recommendation";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { LoadingEffect } from "@root/src/component/ui/Loading";
import StateWithImage from "@root/src/component/ui/StateWithImage";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from '@mui/icons-material/Edit';
import { ConfirmationType, RecommendationState } from "@root/src/types/types";
import { useConfirmationModalContext } from '@root/src/context/DialogContext';
import { Download } from "@mui/icons-material";
import Search from "@component/ui/search";
import * as yup from "yup";
import exportFromJSON from "export-from-json";

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

const validationSchema = yup.object().shape({
  sheetLink: yup
    .string()
    .required("Google Sheet link is required")
    .matches(
      /^https:\/\/docs\.google\.com\/spreadsheets\/d\/.+$/,
      "Enter a valid Google Sheet link"
    ),
});

export default function Timebase() {
    const dispatch = useAppDispatch();
    const promotions = useAppSelector((state: RootState) => state.promotion);
    const promotionCycle  = useAppSelector((state: RootState) => state.promotionCycle);
    const recommendation  = useAppSelector((state: RootState) => state.recommendation);
    const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
    const [editedComment, setEditedComment] = useState("");
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [openCommentPopup, setOpenCommentPopup] = useState(false);
    const dialogContext = useConfirmationModalContext();
    const [searchKey, setSearchKey] = useState<string>("");
    const [isChecked, setIsChecked] = useState(false);
    const [sheetValue, setSheetValue] = useState("");
  const [selected, setSelected] = useState("par-app");
  const [openModal, setOpenModal] = useState(false);

  const [sheetLink, setSheetLink] = useState("");
  const [error, setError] = useState("");

  const handleImport = () => {
    if (selected === "google-sheet") {
      setOpenModal(true);
    }
  };

  const validateField = async (value: any) => {
    try {
      await validationSchema.validate({
        sheetLink: value,
      });

      setError("");
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const handleChange = async (e: any) => {
    const value = e.target.value;

    setSheetLink(value);

    if (value.trim() === "") {
      setError("Google Sheet link is required");
      return;
    }

    await validateField(value);
  };

  const handleSubmitSheet = async () => {
    const isValid = await validateField(sheetLink);

    if (!isValid) return;
    dispatch(createTimebasePormotions({
        type: "SHEET",
        sheet: sheetLink
    }));

    setOpenModal(false);
    setSheetLink("");
  };

  const isButtonDisabled =
    !sheetLink || error !== "";



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
                    type: "TIME_BASED",
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

    const handlePopUpOpen = (recommendations: any) => {
        const comment = recommendations.originalComment;
        setSelectedRecommendation(recommendations);
        setEditedComment(comment || "");
        setIsEditingComment(false);
        setOpenCommentPopup(true);
    };
    const handlePopUpClose = () => {
        setOpenCommentPopup(false);
        setSelectedRecommendation(null);
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

    const originalComment = selectedRecommendation?.recommendationAdditionalComment || "";

    const isSaveDisabled =
        editedComment.trim() === originalComment.trim() ||
        recommendation?.state === "loading" ||
        editedComment.trim().length === 0;

    const exportData = () => {
        if (!promotions.promotions || promotions.promotions.length === 0) return;

        const mapStatus = (status: RecommendationState) => {
            switch (status) {
                case "REQUESTED":
                return "Pending";
                case "SUBMITTED":
                return "Approved";
                default:
                return status;
            }
        };

        const processExportData = promotions.promotions.map((req) => ({
            EmployeeEmail: req.employeeEmail,
            Team: req.team,
            Department: req.department,
            CurrentJobBand: req.currentJobBand,
            NextJobBand: req.nextJobBand,
            Recommendations: req.recommendations
                .map((r) => r.leadEmail)
                .join(", "),
            Status: req.recommendations
                .map((r) => mapStatus(r.recommendationStatus))
                .join(", "),
            DeclineReason: req.recommendations
                .map((r) =>
                r.recommendationStatus === "DECLINED"
                    ? r.recommendationAdditionalComment || "N/A"
                    : "N/A"
                )
                .join(", "),
        }));

        exportFromJSON({
            data: processExportData,
            fileName: "time_based_promotions",
            exportType: exportFromJSON.types.csv,
        });
    };

    const syncTimeBasedPromotions = (url: string) => {
        // TODO: sync teh time base promotion sheet
        // dispatch(
        // timeBasedPromotion({
        //     type: "SHEET",
        //     sheet: url,
        // })
        // );
    };

    const handleSaveComment = async (updatedComment: string) => {

        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to save the comment?`,
            ConfirmationType.accept,
            async () => {
                if (!selectedRecommendation) {
                    return;
                }
                if (!selectedRecommendation.id) {
                    return;
                }
                setIsEditingComment(true);
                try {
                    await dispatch(
                        patchRecommendation({
                            id: selectedRecommendation.recommendationID,
                            statement: null,
                            comment: updatedComment,
                        })
                    ).unwrap();
                    setIsEditingComment(false);
                    setOpenCommentPopup(false);
                    setSelectedRecommendation(null);
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
                {promotionCycle.state === "success" &&
                 promotions.state === "success" && 
                 promotionCycle.promotionCycles &&
                 promotions.promotions &&
                 promotions.promotions.length > 0 && (
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
                            setIsChecked(!isChecked);
                            }}
                        >
                            <RefreshRoundedIcon />
                        </IconButton>
                    
                        <Collapse orientation="horizontal" in={isChecked}>
                            <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                            }}
                            >
                            <TextField
                                autoFocus
                                id="name"
                                name="url"
                                placeholder="Sheet Link"
                                type="url"
                                fullWidth
                                variant="standard"
                                sx={{ marginRight: "5px" }}
                                value={sheetValue}
                                onChange={handleSheetInputChange}
                            />
                            <Button
                                onClick={() => {
                                syncTimeBasedPromotions(sheetValue);
                                }}
                                sx={{ padding: "0px" }}
                                variant="outlined"
                            >
                                Sync
                            </Button>
                            </Box>
                        </Collapse>

                        <Typography variant="h5" sx={{ flex: 1 }}>
                            {" "}
                        </Typography>

                        <Button
                            color="success"
                            variant="outlined"
                            sx={{ marginRight: 2 }}
                            onClick={exportData}
                            startIcon={<Download />}
                        >
                            Export
                        </Button>
                        
                        <Search value={searchKey} onChange={onChangeSearchKey} />
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
                 promotions.promotions.length > 0 &&(
                    <>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ px: 4 }} ><strong>Employee Email</strong></TableCell>
                                        <TableCell sx={{ px: 4 }} ><strong>Lead Status</strong></TableCell>
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
                                                const status: string =
                                                    recommendation?.recommendationStatus;

                                                return (
                                                    <TableRow key={req.id}>
                                                        <TableCell sx={{ px: 4 }}>
                                                            {req.employeeEmail}
                                                        </TableCell>

                                                        <TableCell sx={{ px: 4 }}>
                                                            <Chip
                                                                label={
                                                                    recommendation?.recommendationStatus ||
                                                                    "N/A"
                                                                }
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor:
                                                                        statusColorMap[
                                                                            recommendation?.recommendationStatus ||
                                                                                ""
                                                                        ] || "#e0e0e0",
                                                                    fontWeight: 500,
                                                                }}
                                                            />
                                                        </TableCell>

                                                        <TableCell sx={{ px: 4 }}>
                                                            {status === "DECLINED" ? (
                                                                <IconButton
                                                                    onClick={() =>
                                                                        handlePopUpOpen(recommendation)
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
                                            {selectedRecommendation?.recommendationAdditionalComment ||
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
                                                setEditedComment(selectedRecommendation?.recommendationAdditionalComment || "");
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
                 promotionCycle.promotionCycles &&
                 promotions.promotions &&
                 promotions.promotions.length == 0 && (
                    <>
                        <Box
                            sx={{
                            width: "100%",
                            minHeight: "75vh",
                            backgroundColor: "#ffffff",
                            pt: 8,
                            }}
                        >
                            <Box
                            sx={{
                                width: "82%",
                                margin: "0 auto",
                            }}
                            >
                            <Typography
                                sx={{
                                fontSize: "18px",
                                color: "#555",
                                mb: 4,
                                }}
                            >
                                Set time-based promotions from:
                            </Typography>

                            <Box
                                sx={{
                                display: "flex",
                                gap: 4,
                                }}
                            >
                                <Card
                                onClick={() => setSelected("par-app")}
                                sx={{
                                    flex: 1,
                                    height: 175,
                                    border:
                                    selected === "par-app"
                                        ? "2px solid #ff6d00"
                                        : "1px solid #dddddd",
                                    borderRadius: "4px",
                                    boxShadow: "none",
                                    cursor: "pointer",
                                }}
                                >
                                <CardContent
                                    sx={{
                                    height: "100%",
                                    px: 4,
                                    }}
                                >
                                    <Box
                                    sx={{
                                        display: "flex",
                                        height: "100%",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                    >
                                    <Box>
                                        <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            mb: 2,
                                        }}
                                        >
                                        <Radio
                                            checked={selected === "par-app"}
                                            sx={{
                                            color: "#999",
                                            p: 0,
                                            mr: 2,
                                            "&.Mui-checked": {
                                                color: "#ff6d00",
                                            },
                                            }}
                                        />

                                        <Typography
                                            sx={{
                                            fontSize: "20px",
                                            fontWeight: 400,
                                            color: "#222",
                                            }}
                                        >
                                            PAR App
                                        </Typography>
                                        </Box>

                                        <Typography
                                        sx={{
                                            ml: 5,
                                            maxWidth: 260,
                                            fontSize: "16px",
                                            lineHeight: 1.8,
                                            color: "#666",
                                        }}
                                        >
                                        Import employees whom have 3
                                        consecutive successful ratings or
                                        above.
                                        </Typography>
                                    </Box>

                                    <Box
                                        component="img"
                                        src={require("@root/src/assets/images/save-as-draft.svg").default}
                                        alt="PAR App"
                                        sx={{
                                        width: 150,
                                        height: 150,
                                        objectFit: "contain",
                                        }}
                                    />
                                    </Box>
                                </CardContent>
                                </Card>

                                <Card
                                onClick={() => setSelected("google-sheet")}
                                sx={{
                                    flex: 1,
                                    height: 175,
                                    border:
                                    selected === "google-sheet"
                                        ? "2px solid #ff6d00"
                                        : "1px solid #dddddd",
                                    borderRadius: "4px",
                                    boxShadow: "none",
                                    cursor: "pointer",
                                }}
                                >
                                <CardContent
                                    sx={{
                                    height: "100%",
                                    px: 4,
                                    }}
                                >
                                    <Box
                                    sx={{
                                        display: "flex",
                                        height: "100%",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                    >
                                    <Box>
                                        <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            mb: 2,
                                        }}
                                        >
                                        <Radio
                                            checked={selected === "google-sheet"}
                                            sx={{
                                            color: "#999",
                                            p: 0,
                                            mr: 2,
                                            "&.Mui-checked": {
                                                color: "#ff6d00",
                                            },
                                            }}
                                        />

                                        <Typography
                                            sx={{
                                            fontSize: "20px",
                                            fontWeight: 400,
                                            color: "#222",
                                            }}
                                        >
                                            Google Sheet
                                        </Typography>
                                        </Box>

                                        <Typography
                                        sx={{
                                            ml: 5,
                                            maxWidth: 260,
                                            fontSize: "16px",
                                            lineHeight: 1.8,
                                            color: "#666",
                                        }}
                                        >
                                        Import list of employees from
                                        google sheet.
                                        </Typography>
                                    </Box>

                                    <Box
                                        component="img"
                                        src={require("@root/src/assets/images/loading.svg").default}
                                        alt="Google Sheet"
                                        sx={{
                                        width: 150,
                                        height: 150,
                                        objectFit: "contain",
                                        }}
                                    />
                                    </Box>
                                </CardContent>
                                </Card>
                            </Box>

                            <Box
                                sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                mt: 5,
                                }}
                            >
                                <Button
                                variant="contained"
                                onClick={handleImport}
                                sx={{
                                    width: 175,
                                    height: 50,
                                    backgroundColor: "#ff6d00",
                                    fontSize: "18px",
                                    fontWeight: 500,
                                    borderRadius: "4px",
                                    textTransform: "uppercase",
                                    boxShadow: "none",
                                    "&:hover": {
                                    backgroundColor: "#e65c00",
                                    boxShadow: "none",
                                    },
                                }}
                                >
                                IMPORT
                                </Button>
                            </Box>
                            </Box>
                        </Box>

                        <Modal
                            open={openModal}
                            onClose={() => setOpenModal(false)}
                        >
                            <Box
                            sx={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                width: 500,
                                backgroundColor: "#fff",
                                borderRadius: "8px",
                                p: 4,
                                boxShadow: 24,
                            }}
                            >
                            <Typography
                                sx={{
                                fontSize: "24px",
                                fontWeight: 500,
                                mb: 3,
                                color: "#222",
                                }}
                            >
                                Import Google Sheet
                            </Typography>

                            <Typography
                                sx={{
                                mb: 1,
                                fontSize: "15px",
                                color: "#555",
                                }}
                            >
                                Google Sheet Link
                            </Typography>

                            <TextField
                                fullWidth
                                placeholder="Paste your Google Sheet link here"
                                value={sheetLink}
                                onChange={handleChange}
                                error={!!error}
                                helperText={error}
                            />

                            <Box
                                sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 2,
                                mt: 4,
                                }}
                            >
                                <Button
                                onClick={() => setOpenModal(false)}
                                sx={{
                                    color: "#666",
                                }}
                                >
                                Cancel
                                </Button>

                                <Button
                                variant="contained"
                                disabled={isButtonDisabled}
                                onClick={handleSubmitSheet}
                                sx={{
                                    backgroundColor: "#ff6d00",
                                    px: 4,
                                    boxShadow: "none",
                                    "&:hover": {
                                    backgroundColor: "#e65c00",
                                    boxShadow: "none",
                                    },
                                    "&.Mui-disabled": {
                                    backgroundColor: "#ccc",
                                    color: "#777",
                                    },
                                }}
                                >
                                Import
                                </Button>
                            </Box>
                            </Box>
                        </Modal>
                    </>
                )}

                {(promotionCycle.state === "failed" || 
                    promotions.state === "failed")&& (
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