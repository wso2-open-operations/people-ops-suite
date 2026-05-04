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
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import { 
    Avatar, 
    Box, 
    Button, 
    Card, 
    CardContent, 
    Divider, 
    IconButton, 
    MenuItem, 
    Modal, 
    Paper, 
    Select, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Typography 
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/Clear';
import CustomizedTimeline from "../../../component/common/TimeLine";
import StateWithImage from '../../../component/ui/StateWithImage';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { fetchActivePromotionCycle } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchPromotions } from "@slices/promotionSlice/promotion";
import { PromotionRequest } from '@root/src/utils/types';
import { EmployeeJoinedDetails, fetchEmployeeHistory } from "@slices/employeeSlice/employee";
import { LoadingEffect } from "@component/ui/Loading";

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

export default function History() {

    const dispatch = useAppDispatch();
    const [selectedNoteHtml, setSelectedNoteHtml] = useState<string>('');
    const [open, setOpen] = useState(false);
    const [openMore, setOpenMore] = useState(false);
    const [promotionJobBand, setPromotionJobBand] = useState('');
    const [filter, setFilter] = useState("All");
    const [selectedHistory, setSelectedHistory] = useState<any>(null)
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
    const auth = useAppSelector((state: RootState) => state.auth);
    const promotions = useAppSelector((state: RootState) => state.promotion);
    const promotionCycle  = useAppSelector((state: RootState) => state.promotionCycle);
    const [employeeHistories, setEmployeeHistories] = useState<EmployeeJoinedDetails[]>([]);


    const fetchAllPromotions = async () => {

        try {

            const resultAction = await dispatch(fetchActivePromotionCycle());

            if (fetchActivePromotionCycle.fulfilled.match(resultAction)) {
                const promotionCycleId = resultAction.payload.activePromotionCycles?.id ?? 1;

                const promotionsAction = await dispatch(fetchPromotions({
                    employeeEmail: auth.userInfo?.email,
                    statusArray: ["APPROVED","REJECTED"],
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
                    console.log(employeeHistories);
                    setEmployeeHistories(employeeHistories);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
        
    useEffect(() => {
        fetchAllPromotions();
        
    }, []);

    const allPromotions = promotions?.promotions || [];

    // const totalCount = allPromotions.length;

    // const approvedCount = allPromotions.filter(
    // (p) => p?.status === "APPROVED"
    // ).length;

    // const rejectedCount = allPromotions.filter(
    // (p) => p?.status === "REJECTED"
    // ).length;


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
    }

    const handleCloseMore = () => {
        setSelectedEmployee(null);
        setOpenMore(false);
    }

    const handleClose = () => {
        setOpen(false);
        setSelectedNoteHtml('');
    };

    const filteredRequests = promotions.promotions?.filter(req => {
        if (filter === "All") return true;
        return req.status === filter;
    });

    const employeeHistoryMap = React.useMemo(() => {
        const map: Record<string, any> = {};

        employeeHistories.forEach((emp) => {
            map[emp.workEmail] = emp;
        });

        return map;
    }, [employeeHistories]);

    const handleRefresh = () => {
        fetchAllPromotions();
    }

    return (
        <>
            <Box
                sx={{
                    p: 5
                }}
            >
                {promotionCycle.state != "loading" && 
                    promotions.state != "loading" && (
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
                    promotions.state === "loading" && (
                    <LoadingEffect message={"Loading Promotion History"} />
                )}

                {promotionCycle.state === "success" && 
                    promotions.state === "success"&& (
                    <>
                        <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 3,
                        }}
                        >
                        <Typography variant="h5">Promotion History</Typography>

                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 3,
                            }}
                        >

                        <Select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            size="small"
                            sx={{ width: 160 }}
                        >
                            <MenuItem value="All">All</MenuItem>
                            <MenuItem value="APPROVED">Approved</MenuItem>
                            <MenuItem value="REJECTED">Rejected</MenuItem>
                        </Select>
                        </Box>
                        </Box>

                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Email</strong></TableCell>
                                        <TableCell><strong>Promotion Type</strong></TableCell>
                                        <TableCell><strong>Location</strong></TableCell>
                                        <TableCell><strong>Promotion Cycle</strong></TableCell>
                                        <TableCell><strong>Current Job Role</strong></TableCell>
                                        <TableCell><strong>Joined Date</strong></TableCell>
                                        <TableCell><strong>Last Promoted Date</strong></TableCell>
                                        <TableCell><strong>Promotion Job Band</strong></TableCell>
                                        <TableCell><strong>Business Unit</strong></TableCell>
                                        <TableCell><strong>Department</strong></TableCell>
                                        <TableCell><strong>Team</strong></TableCell>
                                        <TableCell><strong>Promotion Status</strong></TableCell>
                                        <TableCell><strong>More</strong></TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {filteredRequests &&
                                    filteredRequests.length > 0 ? (
                                    filteredRequests.map((req: any) => 
                                        {const history = employeeHistoryMap[req.employeeEmail];
                                            return(
                                                <TableRow key={req.id}>
                                            
                                            <TableCell>{req.employeeEmail}</TableCell>

                                            <TableCell>
                                            <Box
                                                sx={{
                                                backgroundColor: '#eeeeee',
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
                                                {req.promotionType}
                                            </Box>
                                            </TableCell>

                                            <TableCell>{history?.location || 'N/A'}</TableCell>
                                            <TableCell>{req.promotionCycle}</TableCell>
                                            <TableCell>{req.currentJobRole}</TableCell>
                                            <TableCell>{history?.joinDate || 'N/A'}</TableCell>
                                            <TableCell>{history?.lastPromotedDate || 'N/A'}</TableCell>
                                            <TableCell>
                                            {req.currentJobBand} → {req.nextJobBand}
                                            </TableCell>
                                            <TableCell>{req.businessUnit}</TableCell>
                                            <TableCell>{req.department}</TableCell>
                                            <TableCell>{req.team}</TableCell>
                                            <TableCell>
                                            <Box
                                                sx={{
                                                backgroundColor: statusColorMap[req.status] || '#eeeeee',
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
                                                {req.status}
                                            </Box>
                                            </TableCell>

                                            <TableCell>
                                            <IconButton onClick={() => handleOpenMore(req, history)}>
                                                <VisibilityIcon />
                                            </IconButton>
                                            </TableCell>
                                        </TableRow>
                                            );
                                        }
                                        )
                                    ):(
                                        <TableRow>
                                            <TableCell colSpan={13} align="center" sx={{ py: 3 }}>
                                                No data available
                                            </TableCell>
                                        </TableRow>
                                    )}
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

                                        <Box sx={{ flex: 1, height: '30vh', }}>
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
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: 400,
                                bgcolor: 'background.paper',
                                borderRadius: 2,
                                boxShadow: 24,
                                p: 4,
                                }}
                            >
                                <Typography id="edit-job-band-modal" variant="h6" gutterBottom>
                                    Edit Promotion Job Band
                                </Typography>

                                <Typography variant="body1" sx={{ mb: 2 }}>
                                    <strong>Current Job Band:</strong> 5
                                </Typography>

                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Select Promotion Job Band:
                                </Typography>

                                <Select
                                    fullWidth
                                    value={promotionJobBand}
                                    onChange={(e) => setPromotionJobBand(e.target.value)}
                                    displayEmpty
                                >
                                    <MenuItem value="" disabled>
                                        Select new job band
                                    </MenuItem>
                                </Select>

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button onClick={handleClose} sx={{ mr: 1 }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        disabled={!promotionJobBand}
                                    >
                                        Save
                                    </Button>
                                </Box>
                            </Box>
                        </Modal>
                    </>
                )}

                {promotionCycle.state === "failed" || 
                    promotions.state === "failed"&& (
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