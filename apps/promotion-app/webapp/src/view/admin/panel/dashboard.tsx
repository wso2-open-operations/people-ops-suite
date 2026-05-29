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

import React, { useEffect, useState } from "react";
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Collapse,
    TextField,
    Stack,
    IconButton,
    Grid,
    Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopCircleIcon from "@mui/icons-material/StopCircle";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { fetchPromotionCycles, createPromotionCycle, endPromotionCycle } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchPromotions } from "@slices/promotionSlice/promotion";
import StateWithImage from "@root/src/component/ui/StateWithImage";
import { useConfirmationModalContext } from '@root/src/context/DialogContext';
import { LoadingEffect } from "@root/src/component/ui/Loading";
import { ConfirmationType } from "@root/src/types/types";
import { getApplicationCountBasedOnState } from "@utils/utils";
import * as yup from "yup";
import { useFormik } from "formik";
import { ApplicationState } from "@src/types/types";


const validationSchema = yup.object({
  year: yup.string().required("Year is required"),

  half: yup.string().required("Half is required"),

  startDate: yup
    .date()
    .required("Start Date is required"),

  endDate: yup
    .date()
    .required("End Date is required")
    .min(yup.ref("startDate"), "End Date must be after Start Date"),

  leadDeadline: yup
    .date()
    .required("Lead Deadline is required")
    .min(yup.ref("startDate"), "Must be after Start Date")
    .max(yup.ref("endDate"), "Cannot be after End Date"),

  functionalLeadDeadline: yup
    .date()
    .required("Functional Lead Deadline is required")
    .min(yup.ref("startDate"), "Must be after Start Date")
    .max(yup.ref("endDate"), "Cannot be after End Date"),

  promotionBoardDeadline: yup
    .date()
    .required("Promotion Board Deadline is required")
    .min(yup.ref("startDate"), "Must be after Start Date")
    .max(yup.ref("endDate"), "Cannot be after End Date"),
});

export default function Dashboard() {

    const [expanded, setExpanded] = useState(true);
    const dispatch = useAppDispatch();
    const promotionCycle = useAppSelector((state: RootState) => state.promotionCycle);
    const promotions = useAppSelector((state: RootState) => state.promotion);
    const dialogContext = useConfirmationModalContext();

    const formik = useFormik({
        initialValues: {
            year: "",
            half: "",
            startDate: "",
            endDate: "",
            leadDeadline: "",
            functionalLeadDeadline: "",
            promotionBoardDeadline: "",
        },

        validationSchema,

        onSubmit: async (values, { resetForm }) => {
            dialogContext.showConfirmation(
            "Confirm Acceptance",
            "Are you sure you want to Start a Promotion Cycle?",
            ConfirmationType.accept,

            async () => {
                const resultAction = await dispatch(
                createPromotionCycle({
                    name: `${values.year}-${values.half}`,
                    startDate: values.startDate,
                    endDate: values.endDate,
                    leadDeadline: values.leadDeadline,
                    functionalLeadDeadline: values.functionalLeadDeadline,
                    promotionBoardDeadline: values.promotionBoardDeadline,
                })
                );

                if (createPromotionCycle.fulfilled.match(resultAction)) {
                resetForm();
                fetchPromotionCycle();
                }
            },

            "Accept",
            "Cancel"
            );
        },
    });

    const fetchPromotionCycle = async () => {
        try {
            const resultAction = await dispatch(fetchPromotionCycles({
                statusArray: ["OPEN"]
            }));

            if (fetchPromotionCycles.fulfilled.match(resultAction) && 
                 resultAction.payload.PromotionCycles &&
                 resultAction.payload.PromotionCycles.length > 0) {
                const promotionCycleId = resultAction.payload.PromotionCycles[0].id;

                dispatch(fetchPromotions({
                    cycleId: promotionCycleId
                }));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
            
    useEffect(() => {
        fetchPromotionCycle(); 
    }, []);

    const handleCreateClick = () => {
        setExpanded(true);
    };

    const handleEndCycle = () => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to end the promotion cycle?`,
            ConfirmationType.accept,
            async () => {
                if (promotionCycle.promotionCycles){
                    const resultAction = await dispatch(endPromotionCycle({
                        id: promotionCycle.promotionCycles[0].id
                    }));
                    if (endPromotionCycle.fulfilled.match(resultAction)){
                        fetchPromotionCycle();
                    }
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const handleRefresh = () => {
        fetchPromotionCycle();
    }

    return (
        <>
            {promotionCycle.state === "loading" && (
                <LoadingEffect message={"Loading Admin Dashboard"} />
            )}

            {promotionCycle.state != "loading" && (
                <Box 
                    sx={{ 
                        display: "flex", 
                        justifyContent: "flex-start", 
                        pt: 5,
                        pl: 5,
                        mb: 3
                    }}
                >
                    <IconButton 
                        onClick={handleRefresh}
                    >
                        <RefreshRoundedIcon />
                    </IconButton>
                </Box>
            )}
            
            {promotionCycle.state === "success" && 
             !promotionCycle.promotionCycles && (
                <Box
                    sx={{
                        display: "flex",
                        minHeight: "50vh",
                    }}
                >
                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            pl: 5,
                            pr: 4,
                        }}
                    >
                        <Card
                            sx={{
                                width: "100%",
                                maxWidth: 500,
                                minHeight: "65vh",
                                borderRadius: 2,
                                boxShadow: 2,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                            }}
                        >
                            <CardContent
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    height: "100%",
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <Typography
                                        variant="h4"
                                        fontWeight={700}
                                        gutterBottom
                                    >
                                        Create Promotion Cycle.
                                    </Typography>
                                </Box>

                                <Collapse in={expanded}>
                                    <Stack spacing={3} sx={{ mt: 3 }}>
                                        <Box
                                            sx={{
                                            display: "flex",
                                            gap: 2,
                                            }}
                                        >
                                            <TextField
                                        select
                                        name="year"
                                        value={formik.values.year}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.year && Boolean(formik.errors.year)}
                                        helperText={formik.touched.year && formik.errors.year}
                                        sx={{ flex: 1 }}
                                        SelectProps={{
                                            native: true,
                                        }}
                                        >
                                            <option value="2026">2026</option>
                                            <option value="2027">2027</option>
                                            <option value="2028">2028</option>
                                            <option value="2029">2029</option>
                                            <option value="2030">2030</option>
                                            <option value="2031">2031</option>
                                            <option value="2032">2032</option>
                                            <option value="2033">2033</option>
                                            </TextField>

                                            <TextField
                                            select
                                            name="half"
                                            onBlur={formik.handleBlur}
                                            value={formik.values.half}
                                            onChange={formik.handleChange}
                                            sx={{ width: 140 }}
                                            SelectProps={{
                                                native: true,
                                            }}
                                            error={formik.touched.half && Boolean(formik.errors.half)}
                                            helperText={formik.touched.half && formik.errors.half}
                                            >
                                            <option value="H1">H1</option>
                                            <option value="H2">H2</option>
                                            </TextField>
                                        </Box>

                                        <TextField
                                            fullWidth
                                            type="date"
                                            name="startDate"
                                            label="Start Date"
                                            onBlur={formik.handleBlur}
                                            InputLabelProps={{ shrink: true }}
                                            value={formik.values.startDate}
                                            onChange={formik.handleChange}
                                            error={formik.touched.startDate && Boolean(formik.errors.startDate)}
                                            helperText={formik.touched.startDate && formik.errors.startDate}
                                        />

                                        <TextField
                                            fullWidth
                                            type="date"
                                            name="endDate"
                                            label="End Date"
                                            onBlur={formik.handleBlur}
                                            InputLabelProps={{ shrink: true }}
                                            value={formik.values.endDate}
                                            onChange={formik.handleChange}
                                            error={formik.touched.endDate && Boolean(formik.errors.endDate)}
                                            helperText={formik.touched.endDate && formik.errors.endDate}
                                        />

                                        <TextField
                                            fullWidth
                                            type="date"
                                            name="leadDeadline"
                                            label="Lead Deadline"
                                            onBlur={formik.handleBlur}
                                            InputLabelProps={{ shrink: true }}
                                            value={formik.values.leadDeadline}
                                            onChange={formik.handleChange}
                                            error={formik.touched.leadDeadline && Boolean(formik.errors.leadDeadline)}
                                            helperText={formik.touched.leadDeadline && formik.errors.leadDeadline}
                                        />

                                        <TextField
                                            fullWidth
                                            type="date"
                                            name="functionalLeadDeadline"
                                            label="Functional Lead Deadline"
                                            onBlur={formik.handleBlur}
                                            InputLabelProps={{ shrink: true }}
                                            value={formik.values.functionalLeadDeadline}
                                            onChange={formik.handleChange}
                                            error={
                                            formik.touched.functionalLeadDeadline &&
                                            Boolean(formik.errors.functionalLeadDeadline)
                                            }
                                            helperText={
                                            formik.touched.functionalLeadDeadline &&
                                            formik.errors.functionalLeadDeadline
                                            }
                                        />

                                        <TextField
                                            fullWidth
                                            type="date"
                                            name="promotionBoardDeadline"
                                            label="Promotion Board Deadline"
                                            onBlur={formik.handleBlur}
                                            InputLabelProps={{ shrink: true }}
                                            value={formik.values.promotionBoardDeadline}
                                            onChange={formik.handleChange}
                                            error={
                                            formik.touched.promotionBoardDeadline &&
                                            Boolean(formik.errors.promotionBoardDeadline)
                                            }
                                            helperText={
                                            formik.touched.promotionBoardDeadline &&
                                            formik.errors.promotionBoardDeadline
                                            }
                                        />
                                    </Stack>
                                </Collapse>

                                <Box sx={{ flexGrow: 1 }} />

                                {!expanded ? (
                                    <Button
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={handleCreateClick}
                                        sx={{
                                            mt: 4,
                                            width: 170,
                                            alignSelf: "center",
                                            bgcolor: "#ff9800",
                                            "&:hover": {
                                                bgcolor: "#f57c00",
                                            },
                                            height: 50,
                                            fontWeight: 600,
                                            fontSize: 16,
                                        }}
                                    >
                                        Create
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        startIcon={<PlayArrowIcon />}
                                        onClick={(e) => {
                                        e.preventDefault();
                                        formik.handleSubmit();
                                        }}
                                        sx={{
                                            mt: 4,
                                            width: 170,
                                            alignSelf: "center",
                                            bgcolor: "#ff9800",
                                            "&:hover": {
                                            bgcolor: "#f57c00",
                                            },
                                            height: 50,
                                            fontWeight: 600,
                                            fontSize: 16,
                                        }}
                                        disabled={promotionCycle.createState === "loading"}
                                    >
                                        Start
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            pl: 2,
                            p: 4,
                            overflow: "hidden",
                        }}
                    >
                        <Box
                            sx={{
                                "& img": {
                                    width: 560,
                                    height: "auto",
                                },
                            }}
                        >
                            <StateWithImage
                                imageUrl={
                                    require("@root/src/assets/images/loading.svg")
                                        .default
                                }
                                message=""
                            />
                        </Box>
                    </Box>
                </Box>
            )}

            {promotionCycle.state === "success" &&
             promotionCycle.promotionCycles && (
                <Box
                    sx={{
                        display: "flex",
                        minHeight: "60vh",
                        px: 5,
                        gap: 4,
                    }}
                >
                    <Card
                        sx={{
                            width: "100%",
                            maxWidth: 460,
                            minHeight: "12vh",
                            borderRadius: 3,
                            boxShadow: 3,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                        }}
                    >
                        <CardContent
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    mt: 2,
                                    mb: 3,
                                    "& img": {
                                        width: 180,
                                        height: "auto",
                                    },
                                }}
                            >
                                <StateWithImage
                                    imageUrl={
                                        require("@root/src/assets/images/loading.svg")
                                            .default
                                    }
                                    message=""
                                />
                            </Box>

                            <Typography
                                variant="h5"
                                fontWeight={700}
                                textAlign="center"
                                gutterBottom
                            >
                                Active Promotion Cycle: {promotionCycle.promotionCycles[0].name || "-"}
                            </Typography>

                            <Divider sx={{ my: 3 }} />

                            <Stack spacing={2}>
                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Start Date
                                    </Typography>

                                    <Typography fontWeight={600}>
                                        {promotionCycle.promotionCycles[0].startDate || "-"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        End Date
                                    </Typography>

                                    <Typography fontWeight={600}>
                                        {promotionCycle.promotionCycles[0].endDate || "-"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Lead Deadline
                                    </Typography>

                                    <Typography fontWeight={600}>
                                        {promotionCycle.promotionCycles[0].leadDeadline || "-"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Functional Lead Deadline
                                    </Typography>

                                    <Typography fontWeight={600}>
                                        {promotionCycle.promotionCycles[0].functionalLeadDeadline || "-"}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Promotion Board Deadline
                                    </Typography>

                                    <Typography fontWeight={600}>
                                        {promotionCycle.promotionCycles[0].promotionBoardDeadline || "-"}
                                    </Typography>
                                </Box>
                            </Stack>

                            <Box sx={{ flexGrow: 1 }} />

                            <Button
                                variant="contained"
                                startIcon={<StopCircleIcon />}
                                onClick={handleEndCycle}
                                sx={{
                                    mt: 4,
                                    width: 190,
                                    alignSelf: "center",
                                    bgcolor: "#d32f2f",
                                    "&:hover": {
                                        bgcolor: "#b71c1c",
                                    },
                                    height: 50,
                                    fontWeight: 600,
                                    fontSize: 16,
                                }}
                            >
                                End Cycle
                            </Button>
                        </CardContent>
                    </Card>

                    <Box
                        sx={{
                            flex: 1,
                        }}
                    >
                        <Grid container spacing={3}>
                            {promotions.state === "loading" && (
                                <LoadingEffect message={"Loading Stats"} />
                            )}
                            {promotions.state === "success" && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <Card
                                            sx={{
                                                height: 250,
                                                borderRadius: 3,
                                                boxShadow: 2,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                color="text.secondary"
                                            >
                                                All Promotions
                                            </Typography>

                                            <Typography
                                                variant="h2"
                                                fontWeight={700}
                                            >
                                                {getApplicationCountBasedOnState(promotions.promotions, [
                                                    ApplicationState.APPROVED,
                                                    ApplicationState.REJECTED,
                                                    ApplicationState.FL_APPROVED,
                                                ])}
                                            </Typography>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Card
                                            sx={{
                                                height: 250,
                                                borderRadius: 3,
                                                boxShadow: 2,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                color="text.secondary"
                                            >
                                                Pending Promotions
                                            </Typography>

                                            <Typography
                                                variant="h2"
                                                fontWeight={700}
                                                color="#ff9800"
                                            >
                                                {getApplicationCountBasedOnState(promotions.promotions, [
                                                    ApplicationState.FL_APPROVED,
                                                ])}
                                            </Typography>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Card
                                            sx={{
                                                height: 250,
                                                borderRadius: 3,
                                                boxShadow: 2,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                color="text.secondary"
                                            >
                                                Approved Promotions
                                            </Typography>

                                            <Typography
                                                variant="h2"
                                                fontWeight={700}
                                                color="#2e7d32"
                                            >
                                                {getApplicationCountBasedOnState(promotions.promotions, [
                                                    ApplicationState.APPROVED,
                                                ])}
                                            </Typography>
                                        </Card>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Card
                                            sx={{
                                                height: 250,
                                                borderRadius: 3,
                                                boxShadow: 2,
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                flexDirection: "column",
                                            }}
                                        >
                                            <Typography
                                                variant="h6"
                                                color="text.secondary"
                                            >
                                                Rejected Promotions
                                            </Typography>

                                            <Typography
                                                variant="h2"
                                                fontWeight={700}
                                                color="#d32f2f"
                                            >
                                                {getApplicationCountBasedOnState(promotions.promotions, [
                                                    ApplicationState.REJECTED,
                                                ])}
                                            </Typography>
                                        </Card>
                                    </Grid>
                                </>
                            )}

                            {promotions.state === "failed" && (
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
                                        message="Unable to load promotion Cycles."
                                    />
                                </Box>
                            )}
                            
                        </Grid>
                    </Box>
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
                        message="Unable to load promotion Cycles."
                    />
                </Box>
            )}
        </>
    );
}