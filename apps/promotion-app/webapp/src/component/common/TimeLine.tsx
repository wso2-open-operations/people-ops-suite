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

import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import StarsIcon from '@mui/icons-material/Stars';
import { TimeLineData } from '@root/src/utils/types';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import { useEffect } from 'react';
import { fetchPromotions } from '@slices/promotionSlice/promotion';
import { fetchEmployeeHistory } from "@slices/employeeSlice/employee";
import ErrorHandler from './ErrorHandler';
import { LoadingEffect } from '../ui/Loading';

type CustomizedTimelineProps = {
  employeeEmail: string;
};

export default function CustomizedTimeline( {employeeEmail}: CustomizedTimelineProps ) {

    const employeeHistory = useAppSelector((state: RootState) => state.employee);
    const promotions  = useAppSelector((state: RootState) => state.promotion);
    const dispatch = useAppDispatch();
    const timelineData: TimeLineData[] = [];

    useEffect(() => {
        if (!employeeEmail) return;
        
        (async () => {
            try {
                dispatch(fetchEmployeeHistory({
                    employeeWorkEmail: employeeEmail
                }));

                dispatch(fetchPromotions({
                    employeeEmail: employeeEmail,
                    statusArray: ["APPROVED"]
                }));
            } catch (error) {
                console.error("Failed to fetch promotion requests:", error);
            }
        })();
    }, [employeeEmail]);

    if (employeeHistory.state === "success" && employeeHistory.employeeHistory) {
        timelineData.push({
            Title: "Joined the Company",
            Date: employeeHistory.employeeHistory.startDate
                ? new Date(employeeHistory.employeeHistory.startDate).toLocaleDateString()
                : "",
            BusinessUnit: employeeHistory.employeeHistory.joinedBusinessUnit || "",
            Team: employeeHistory.employeeHistory.joinedDepartment || "",
            SubTeam: employeeHistory.employeeHistory.joinedTeam || "",
            Lead: employeeHistory.employeeHistory.reportingLead || "",
        });
    }
    if (promotions.promotions && promotions.promotions?.length > 0) {
        promotions.promotions.forEach((request) => {
            const recommendation = request.recommendations?.[0];
            timelineData.push({
                Title: `Promoted to Band ${request.nextJobBand}`,
                Date: request.updatedOn
                ? new Date(request.updatedOn).toLocaleDateString()
                : "",
                BusinessUnit: request.businessUnit || "",
                Team: request.department || "",
                SubTeam: request.team || "",
                Lead: recommendation?.leadEmail || "",
            });
        });
    }
    return (
        <>
            {promotions.state === "loading" || 
            employeeHistory.state === "loading" &&(
                <LoadingEffect
                    message="Loading Employee History"
                />
            )}

            {promotions.state === "success" && 
            employeeHistory.state === "success" &&(
                <Box
                    sx={{
                        // Set height to 70% of the viewport height
                        height: '70vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 4,
                    }}
                >
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        {/* Timeline wrapper */}
                        <Box
                            sx={{
                                position: 'relative',
                                // Minimum width based on number of items
                                minWidth: timelineData.length * 250,
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            {/* Horizontal connecting line between dots */}
                            <Box
                                sx={{
                                    position: 'absolute',                             
                                    top: '50%',
                                    // Start line from center of first dot                                        
                                    left: 'calc(232px / 2)',
                                    // Width spans across all items minus 1                         
                                    width: `calc(${(timelineData.length - 1)} * 232px)`,
                                    // Thin horizontal line 
                                    height: "1px",                                 
                                    backgroundColor: '#616161',                      
                                    transform: 'translateY(-50%)',
                                    // Behind dots (lower layer)                    
                                    zIndex: 1,
                                }}
                            />

                            {timelineData.map((item, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        // Fixed width of 200px per item
                                        flex: '0 0 200px',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: 300,
                                        mx: 2,
                                        // Above the connecting line
                                        zIndex: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            // Alternate vertical position (below center) or above center
                                            top: index % 2 === 0 ? 'calc(50% + 30px)'
                                                : 'calc(50% - 40px)',             
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            {item.Date}
                                        </Typography>
                                    </Box>

                                    {index === 0 ? (
                                        // Special icon and styling for the first entry (Joined the Company)
                                        <>
                                            {/* Outer dot */}
                                            <Box sx={{
                                                width: 55,
                                                height: 55,
                                                // White background
                                                backgroundColor: '#ffffff',
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                zIndex: 3,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                {/* Inner circle  */}
                                                <Box sx={{
                                                    width: 40,
                                                    height: 40,
                                                    // Still white background
                                                    backgroundColor: '#ffffff',
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: 4,
                                                }}>
                                                    <BadgeIcon sx={{ fontSize: 20, color: 'black' }} />
                                                </Box>
                                            </Box>
                                        </>
                                    ) : (
                                        // Other entries (promotions) styling
                                        <>
                                            {/* Outer circle wrapper for the promotion dot */}
                                            <Box
                                                sx={{
                                                    width: 55,
                                                    height: 55,
                                                    // Sets background to white
                                                    backgroundColor: '#ffffff',
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',

                                                }}
                                            >
                                                {/* Inner circle representing the promotion with an icon */}
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        // Orange color to signify a promotion event
                                                        backgroundColor: '#FF7300',
                                                        borderRadius: '50%',
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        zIndex: 3,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: 4

                                                    }}
                                                >
                                                    {/* Promotion icon inside the inner circle */}
                                                    <StarsIcon sx={{ fontSize: 25, color: '#ffffff' }} />
                                                </Box>
                                            </Box>
                                        </>

                                    )}

                                    {/* Main content box below/above the dot */}
                                    <Box
                                        sx={{
                                            textAlign: 'center',
                                            // Push down/up content if index is odd/even
                                            mt: index % 2 === 0 ? 0 : '180px',
                                            mb: index % 2 === 0 ? '150px' : 0,
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {item.Title}
                                        </Typography>
                                        <Typography variant="caption">BU: {item.BusinessUnit}</Typography>
                                        <br />
                                        <Typography variant="caption">Team: {item.Team}</Typography>
                                        <br />
                                        <Typography variant="caption">ST: {item.SubTeam}</Typography>
                                        <br />
                                        <Typography variant="caption">Lead: {item.Lead}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            )}
            {(promotions.state === "failed" || 
            employeeHistory.state === "failed") && (
                <ErrorHandler
                    message="Unable to load promotion history."
                />
            )}
        </>
    );
}


