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

import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Checkbox,
    Modal,
    Card,
    Avatar,
    CardContent,
    Divider,
    Select,
    MenuItem,
    Collapse,
    TextField,
    Grid,
} from '@mui/material';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import { FilterAlt as FilterAltIcon } from "@mui/icons-material";
import StateWithImage from '@root/src/component/ui/StateWithImage';
import { useConfirmationModalContext } from '@root/src/context/DialogContext';
import { ConfirmationType } from "@/types/types";
import { PromotionRequest, TimeLineData } from '@root/src/utils/types';
import { LoadingEffect } from "@component/ui/Loading";
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { fetchActivePromotionCycle } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchPromotions, updatePromotion, approvePromotions, rejectPromotions } from "@slices/promotionSlice/promotion";
import { EmployeeJoinedDetails, fetchEmployeeHistory } from "@slices/employeeSlice/employee";
import NumberFilter from "@src/component/common/stringFilter";
import { Header, Filter } from "@src/component/common/stringFilter";
import CustomizedTimeline from '@root/src/component/common/TimeLine';
 
const statusColorMap: Record<string, string> = {
  TIMEBASE: '#0c0c0cff',
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

export default function Requests() {

    const dispatch = useAppDispatch();
    const promotionCycle  = useAppSelector((state: RootState) => state.promotionCycle);
    const promotion  = useAppSelector((state: RootState) => state.promotion);
    const dialogContext = useConfirmationModalContext();
    const promotions = promotion.promotions ?? [];

    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [open, setOpen] = useState(false);
    const [openMore, setOpenMore] = useState(false);
    const [currentJobBand, setCurrentJobBand] = useState<number|null>(null);
    const [promotionJobBand, setPromotionJobBand] = useState<number|null>(null);
    const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const [selectedHistory, setSelectedHistory] = useState<any>(null)
    const [rejectReason, setRejectReason] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const auth = useAppSelector((state: RootState) => state.auth);
    const [data, setData] = useState<TimeLineData[]>([]);
    const [employeeHistories, setEmployeeHistories] = useState<EmployeeJoinedDetails[]>([]);
    const [filters, setFilters] = useState<Filter[]>([]);


const filterHeaders: Header[] = [
  {
    id: "employeeEmail",
    label: "Email",
    type: "string",
    width: 250,
    align: "left",
  },
  {
    id: "promotionType",
    label: "Promotion Type",
    type: "string",
    width: 180,
    align: "left",
  },
  {
    id: "location",
    label: "Location",
    type: "string",
    width: 180,
    align: "left",
  },
  {
    id: "currentJobRole",
    label: "Current Designation",
    type: "string",
    width: 220,
    align: "left",
  },
  {
    id: "businessUnit",
    label: "Business Unit",
    type: "string",
    width: 180,
    align: "left",
  },
  {
    id: "department",
    label: "Department",
    type: "string",
    width: 180,
    align: "left",
  },
  {
    id: "team",
    label: "Team",
    type: "string",
    width: 160,
    align: "left",
  },
];

const applyFilters = (data: PromotionRequest[]) => {
  if (!filters || filters.length === 0) return data;

  return data.filter((item) => {
    return filters.every((filter) => {
      const fieldValue = item[filter.key as keyof PromotionRequest];

      if (filter.operation === "EMTY") {
        return fieldValue === null || fieldValue === undefined || fieldValue === "";
      }

      if (filter.operation === "DEMTY") {
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
      }

      if (filter.value === "" || filter.value === undefined) {
        return true;
      }

      const value = String(fieldValue ?? "").toLowerCase();
      const filterVal = String(filter.value).toLowerCase();

      switch (filter.operation) {
        case "CON":
          return value.includes(filterVal);
        case "DNCON":
          return !value.includes(filterVal);
        case "EQ":
          return value === filterVal;
        case "DNEQ":
          return value !== filterVal;
        case "SW":
          return value.startsWith(filterVal);
        case "EW":
          return value.endsWith(filterVal);
        default:
          return true;
      }
    });
  });
};

    const isAllSelected =
    promotions.length > 0 &&
    selectedIds.length === promotions.length;

    const isIndeterminate =
    selectedIds.length > 0 &&
    selectedIds.length < promotions.length;

    const jobBandOptions = Array.from({ length: 14 }, (_, i) => i + 1);

    const employeeHistoryMap = React.useMemo(() => {
        const map: Record<string, any> = {};

        employeeHistories.forEach((emp) => {
            map[emp.workEmail] = emp;
        });

        return map;
    }, [employeeHistories]);

    useEffect(() => {
        fetchAllPromotions();
    }, []);

    const handleRowSelect = (id: number) => {
        setSelectedIds((prev) =>
        prev.includes(id)
            ? prev.filter((item) => item !== id)
            : [...prev, id]
        );
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const allIds = promotions.map((emp) => emp.id);
            setSelectedIds(allIds);
        } else {
            setSelectedIds([]);
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

    const handleOpenMore = (emp : any, history : any) => {
        setOpenMore(true);
        console.log("hello", emp);
        setSelectedEmployee(emp);
        setSelectedHistory(history);
        console.log(data);
    }

    const handleCloseMore = () => {
        setData([]);
        setSelectedEmployee(null);
        setOpenMore(false);
    }

    const handleOpenEdit = (emp: any) => {
        setOpen(true);
        console.log(emp);
        setSelectedEmployee(emp);
        setPromotionJobBand(emp.nextJobBand);
        setCurrentJobBand(emp.nextJobBand);
    }

    const handleClose = () => {
        setOpen(false);
    };

    const handleRejectClose = () => {
        setConfirmRejectOpen(false);
        setSelectedEmployee(null);
    };

    const handleToggleFilters = () => setShowFilters((prev) => !prev);

    const handleReject = (emp: any) => {
        console.log("Rejected IDs:", selectedIds);
        setSelectedEmployee(emp)
        setConfirmRejectOpen(true);
    }

    const handleRefresh = () => {
        fetchAllPromotions();
    }

    const handleBulkApprove = async () => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to Approve this Promotion?`,
            ConfirmationType.accept,
            async () => {
                try {
                    await Promise.all(
                    selectedIds.map((id) =>
                        dispatch(
                        approvePromotions({
                            id: id,
                            from: "functional_lead",
                        })
                        )
                    )
                    );
                    setSelectedIds([]);
                    fetchAllPromotions();
                } catch (error) {
                    console.error("Bulk approve failed", error);
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const handleBulkReject = async () => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to Approve this Promotion?`,
            ConfirmationType.accept,
            async () => {
                try {
                    await Promise.all(
                    selectedIds.map((id) =>
                        dispatch(
                        rejectPromotions({
                            id: id,
                            from: "functional_lead",
                            reason: "",
                        })
                        )
                    )
                    );

                    setSelectedIds([]);
                    fetchAllPromotions();
                } catch (error) {
                    console.error("Bulk reject failed", error);
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const fetchAllPromotions = async () => {
        try {

            const resultAction = await dispatch(fetchActivePromotionCycle());

            if (fetchActivePromotionCycle.fulfilled.match(resultAction)) {
                const promotionCycleId =
                    resultAction.payload.activePromotionCycles?.id ?? 1;

                const promotionsAction = await dispatch(fetchPromotions({
                    employeeEmail: auth.userInfo?.email,
                    statusArray: ["FL_APPROVED"],
                    enableBuFilter: true,
                    cycleId: promotionCycleId
                }));
                if (fetchPromotions.fulfilled.match(promotionsAction)) {
                        const promotions: PromotionRequest[] =
                    promotionsAction.payload.promotions || [];
                        const emails = promotions.map((p) => p.employeeEmail);
                        const employeeHistoryPromises = emails.map((email) =>
                            dispatch(fetchEmployeeHistory({ employeeWorkEmail: email })).unwrap()
                        );
                        const employeeHistories = await Promise.all(employeeHistoryPromises);
                        setEmployeeHistories(employeeHistories);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleAcceptOpen = (employee: any) => {
        setSelectedEmployee(employee);
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to Approve this Promotion?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(approvePromotions({
                    id: employee.id,
                    from: "promotion_board"
                }));
                if (approvePromotions.fulfilled.match(resultAction)) {
                    fetchAllPromotions();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const handleRejectOpen = () => {
        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to Reject this Promotion?`,
            ConfirmationType.accept,
            async () => {
                const resultAction = await dispatch(rejectPromotions({
                    id: selectedEmployee.id,
                    from: "promotion_board",
                    reason: "",
                }));
                if (rejectPromotions.fulfilled.match(resultAction)) {
                    handleRejectClose()
                    fetchAllPromotions();
                }
            }
            ,
            "Accept",
            "Cancel"
        );
    };

    const handleUpdateJobBand = async () => {

        dialogContext.showConfirmation(
            "Confirm Acceptance",
            `Are you sure you want to Update to this Job Band?`,
            ConfirmationType.accept,
            async () => {
            if (promotionJobBand) {
                const resultAction = await dispatch(updatePromotion({
                    id: selectedEmployee.id,
                    promotingJobBand: promotionJobBand
                }))
                if (updatePromotion.fulfilled.match(resultAction)) {
                fetchAllPromotions();
                handleClose();
                }
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
        {promotionCycle.state != "loading" && (
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

        {promotionCycle.state === "loading" ||
         promotion.state === "loading" && (
            <LoadingEffect message={"Loading Promotions"} />
        )}

        {promotionCycle.state === "success" &&
         promotion.state === "success" && (
            <>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Promotion Request
                </Typography>

                <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                    <Button
                        variant="text"
                        disabled={selectedIds.length === 0}
                        onClick={handleBulkApprove}
                        startIcon={
                            <CheckIcon
                                sx={{
                                    color: selectedIds.length === 0 ? 'rgba(20,171,0,0.4)' : '#14AB00',
                                }}
                            />
                        }
                        sx={{
                            color: selectedIds.length === 0 ? 'rgba(20,171,0,0.4)' : '#14AB00',
                            textTransform: 'none',
                            fontWeight: 200,
                        }}
                    >
                        Approve
                    </Button>

                    <Button
                        variant="text"
                        disabled={selectedIds.length === 0}
                        onClick={handleBulkReject}
                        startIcon={
                            <ClearIcon
                                sx={{
                                    color: selectedIds.length === 0 ? 'rgba(255,0,0,0.4)' : '#FF0000',
                                }}
                            />
                        }
                        sx={{
                            color: selectedIds.length === 0 ? 'rgba(255,0,0,0.4)' : '#FF0000',
                            textTransform: 'none',
                            fontWeight: 200,
                        }}
                    >
                        Reject
                    </Button>
                    <IconButton onClick={handleToggleFilters} color="primary">
                        <FilterAltIcon />
                    </IconButton>
                </Stack>

                <Collapse in={showFilters}>
                    <Paper
                        elevation={3}
                        sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#fafafa",
                        }}
                    >
                        <Grid container spacing={2}>
                        {filterHeaders.map((header) => (
                            <Grid item xs={12} sm={6} md={3} lg={2} key={header.id}>
                            <NumberFilter
                                header={header}
                                filters={filters}
                                setFilters={setFilters}
                            />
                            </Grid>
                        ))}
                        </Grid>
                    </Paper>
                    </Collapse>

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={isAllSelected}
                                        indeterminate={isIndeterminate}
                                        onChange={handleSelectAll}
                                    />
                                </TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Promotion Type</strong></TableCell>
                                <TableCell><strong>Location</strong></TableCell>
                                <TableCell><strong>Promotion Cycle</strong></TableCell>
                                <TableCell><strong>Current Designation</strong></TableCell>
                                <TableCell><strong>Joined Date</strong></TableCell>
                                <TableCell><strong>Last Promoted Date</strong></TableCell>
                                <TableCell><strong>Promotion Job Band</strong></TableCell>
                                <TableCell><strong>Business Unit</strong></TableCell>
                                <TableCell><strong>Department</strong></TableCell>
                                <TableCell><strong>Team</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                                <TableCell><strong>More</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {
                            applyFilters(promotion.promotions || []).length > 0 ? (
                            applyFilters(promotion.promotions || []).map((emp) => 
                                {
                                const history = employeeHistoryMap[emp.employeeEmail];

                                return (
                                    <TableRow key={emp.id} hover>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.includes(emp.id)}
                                                onChange={() => handleRowSelect(emp.id)}
                                            />
                                        </TableCell>

                                        <TableCell>{emp.employeeEmail}</TableCell>

                                        <TableCell>
                                            <Box
                                                sx={{
                                                backgroundColor: statusColorMap[emp.status] || '#eeeeee',
                                                color: '#000',
                                                px: 2,
                                                py: 0.5,
                                                borderRadius: '12px',
                                                display: 'inline-block',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                                textTransform: 'capitalize',
                                                }}
                                            >
                                                {emp.promotionType}
                                            </Box>
                                        </TableCell>

                                        <TableCell>{history?.location || 'N/A'}</TableCell>
                                        <TableCell>{emp.promotionCycle}</TableCell>
                                        <TableCell>{emp.currentJobRole}</TableCell>
                                        <TableCell>{history?.joinDate || 'N/A'}</TableCell>
                                        <TableCell>{history?.lastPromotedDate || 'N/A'}</TableCell>

                                        <TableCell>
                                            {emp.currentJobBand} → {emp.nextJobBand}
                                            <IconButton sx={{ ml: 1, mb: 1 }} onClick={() => handleOpenEdit(emp)} color="primary">
                                                <EditIcon />
                                            </IconButton>
                                        </TableCell>

                                        <TableCell>{emp.businessUnit}</TableCell>
                                        <TableCell>{emp.department}</TableCell>
                                        <TableCell>{emp.team}</TableCell>

                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton onClick={() => handleAcceptOpen(emp)}>
                                                <CheckIcon sx={{ color: '#14AB00' }} />
                                                </IconButton>
                                                <IconButton onClick={() => handleReject(emp)}>
                                                <ClearIcon sx={{ color: '#FF0000' }} />
                                                </IconButton>
                                            </Stack>
                                        </TableCell>

                                        <TableCell>
                                            <IconButton onClick={() => handleOpenMore(emp, history)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })) : (
                                <TableRow>
                                    <TableCell colSpan={14} align="center">
                                        No promotion pending
                                    </TableCell>
                                </TableRow>
                            )
                            }
                        </TableBody>
                    </Table>
                </TableContainer>

                <Modal open={openMore} onClose={handleCloseMore}>
                    <Box
                        sx={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "80%",
                            bgcolor: "background.paper",
                            boxShadow: 24,
                            p: 4,
                            borderRadius: 2,
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            position: "relative",
                        }}
                    >
                        <Box
                            sx={{
                            overflowY: "auto",
                            flex: 1,
                            mt: 1,
                            scrollbarWidth: "none",
                            "&::-webkit-scrollbar": {
                            display: "none", 
                            },
                            msOverflowStyle: "none", 
                        }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 4,
                                    alignItems: "flex-start",
                                    flexWrap: "wrap",
                                }}
                            >
                                <Card
                                    sx={{
                                    flex: "0 0 300px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    p: 2,
                                    ml: 10,
                                    borderRadius: 2,
                                    boxShadow: 3,
                                    }}
                                >
                                    <Avatar
                                        src={selectedHistory?.employeeThumbnail || ""}
                                        alt="User Thumbnail"
                                        sx={{ width: 120, height: 120, mb: 2 }}
                                    />
                                    <CardContent sx={{ width: "100%" }}>
                                        {selectedEmployee && (
                                            <>
                                                {[
                                            { label: "Lead Email", value: selectedEmployee?.employeeEmail || 'N/A' },
                                            { label: "Promotion Status", value: selectedEmployee?.status || 'N/A' },
                                            { label: "Location", value: selectedHistory?.joinedLocation || 'N/A' },
                                            { label: "Promotion Type", value: selectedEmployee?.promotionType || 'N/A' },
                                            { label: "Promotion Cycle", value: selectedEmployee?.promotionCycle || 'N/A' },
                                            { label: "Promotion Job Band", value: selectedEmployee?.nextJobBand || 'N/A' },
                                        ].map((item, index) => (
                                            <Box
                                                key={index}
                                                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                                            >
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {item.label}:
                                                </Typography>
                                                <Typography variant="subtitle1" color="text.secondary">
                                                    {item.value}
                                                </Typography>
                                            </Box>
                                        ))}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Box sx={{ flex: 1 }}>
                                    <CustomizedTimeline employeeEmail={selectedEmployee?.employeeEmail} />
                                </Box>

                                <IconButton
                                    onClick={handleCloseMore}
                                    sx={{
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 10,
                                    bgcolor: "rgba(255, 0, 0, 0.1)",
                                    color: "red",
                                    "&:hover": {
                                        bgcolor: "rgba(255, 0, 0, 0.2)",
                                    },
                                    }}
                                >
                                    <ClearIcon />
                                </IconButton>

                            </Box>

                            <Divider sx={{ mt: 3 }} />

                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                    Lead Recommendation
                                </Typography>

                                <Box sx={{ mb: 2, mt: 3 }}>
                                    <Typography
                                    variant="body1"
                                    dangerouslySetInnerHTML={{
                                        __html: safeBase64Decode(selectedEmployee?.recommendations[0]?.recommendationStatement || "Recommendation Statement not available"),
                                    }}
                                    />
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Modal>

                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="edit-job-band-modal"
                    aria-describedby="edit-promotion-job-band"
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
                            p: 4,
                        }}
                    >
                        <Typography id="edit-job-band-modal" variant="h6" gutterBottom>
                            Edit Promotion Job Band
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 2 }}>
                            <strong>Current Job Band: </strong> {currentJobBand}
                        </Typography>

                        <Typography variant="body2" sx={{ mb: 1 }}>
                            Select Promotion Job Band:
                        </Typography>

                        <Select
                            fullWidth
                            value={promotionJobBand}
                            onChange={(e) => setPromotionJobBand(Number(e.target.value))}
                            displayEmpty
                        >
                            <MenuItem value="" disabled>
                            Select new job band
                            </MenuItem>
                            {jobBandOptions
                                .filter((num) => num >= (currentJobBand??0))
                                .map((num) => (
                                    <MenuItem key={num} value={num}>
                                        {num}
                                    </MenuItem>
                                ))}
                        </Select>

                        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                            <Button onClick={handleClose} sx={{ mr: 1 }}>
                            Cancel
                            </Button>
                            <Button
                            variant="contained"
                            onClick={handleUpdateJobBand}
                            disabled={currentJobBand==promotionJobBand}
                            >
                            Save
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
                            onClick={handleRejectOpen}
                            disabled={!rejectReason.trim()}
                            >
                            Submit
                            </Button>
                        </Box>
                    </Box>
                </Modal>

            </>
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
                    message="Unable to load promotion history."
                />
            </Box>
        )}
      </Box>
    </>
  );
}
