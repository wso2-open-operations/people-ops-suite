import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import StarsIcon from '@mui/icons-material/Stars';
import { TimeLineData } from '@root/src/utils/types';
import { RootState, useAppDispatch, useAppSelector } from '@root/src/slices/store';
import { useEffect } from 'react';
import { fetchPromotions } from '@slices/promotionSlice/promotion';
import { fetchEmployeeHistory } from "@slices/employeeSlice/employee";
import StateWithImage from '../ui/StateWithImage';

type CustomizedTimelineProps = {
  employeeEmail: string;
};

export default function CustomizedTimeline( {employeeEmail}: CustomizedTimelineProps ) {

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const user = useAppSelector((state: RootState) => state.user);
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
                <StateWithImage 
                    message="Loading Employee History" 
                    imageUrl="/loading.svg" 
                />
            )}

            {promotions.state === "success" && 
            employeeHistory.state === "success" &&(
                <Box
                    sx={{
                        // Set height to 70% of the viewport height
                        height: '70vh',
                        // Use flexbox layout
                        display: 'flex',
                        // Vertically center content
                        alignItems: 'center',
                        // Horizontally center content
                        justifyContent: 'center',
                        // Horizontal padding (left and right)
                        px: 4,
                    }}
                >
                    {/* Inner container with horizontal scroll if needed */}
                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                        {/* Timeline wrapper */}
                        <Box
                            sx={{
                                // Position relative to allow absolute positioning of line
                                position: 'relative',
                                // Minimum width based on number of items
                                minWidth: timelineData.length * 250,
                                // Flex layout
                                display: 'flex',
                                // Flex layout
                                flexDirection: 'row',
                                // Vertically center timeline items
                                alignItems: 'center',
                            }}
                        >
                            {/* Horizontal connecting line between dots */}
                            <Box
                                sx={{
                                    // Positioned absolutely inside container
                                    position: 'absolute',
                                    // Vertically centered                             
                                    top: '50%',
                                    // Start line from center of first dot                                        
                                    left: 'calc(232px / 2)',
                                    // Width spans across all items minus 1                         
                                    width: `calc(${(timelineData.length - 1)} * 232px)`,
                                    // Thin horizontal line 
                                    height: "1px",
                                    // Line color (grey)                                    
                                    backgroundColor: '#616161',
                                    // Perfect vertical centering                        
                                    transform: 'translateY(-50%)',
                                    // Behind dots (lower layer)                    
                                    zIndex: 1,
                                }}
                            />

                            {/* Loop through timeline items */}
                            {timelineData.map((item, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        // Fixed width of 200px per item
                                        flex: '0 0 200px',
                                        // Allows absolute positioning inside
                                        position: 'relative',
                                        // Flexbox for vertical stacking
                                        display: 'flex',
                                        // Stack children vertically
                                        flexDirection: 'column',
                                        // Center horizontally
                                        alignItems: 'center',
                                        // Center vertically
                                        justifyContent: 'center',
                                        // Ensure each item has enough vertical space
                                        minHeight: 300,
                                        // Horizontal margin (spacing between items)
                                        mx: 2,
                                        // Above the connecting line
                                        zIndex: 2,
                                    }}
                                >
                                    {/* Date text */}
                                    <Box
                                        sx={{
                                            // Absolutely position the date
                                            position: 'absolute',
                                            // Alternate vertical position (below center) or above center
                                            top: index % 2 === 0 ? 'calc(50% + 30px)'
                                                : 'calc(50% - 40px)',
                                            // Horizontally center                   
                                            left: '50%',
                                            // Adjust to align center of text
                                            transform: 'translateX(-50%)',
                                            // Center text inside box
                                            textAlign: 'center',
                                        }}
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            {item.Date}
                                        </Typography>
                                    </Box>

                                    {/* Dot representing each timeline event */}
                                    {index === 0 ? (
                                        // Special icon and styling for the first entry (Joined the Company)
                                        <>
                                            <Box sx={{
                                                // Outer dot width
                                                width: 55,
                                                // Outer dot height
                                                height: 55,
                                                // White background
                                                backgroundColor: '#ffffff',
                                                // Make it a perfect circle
                                                borderRadius: '50%',
                                                // Position over timeline line
                                                position: 'absolute',
                                                // Center vertically
                                                top: '50%',
                                                // Center horizontally
                                                left: '50%',
                                                // Adjust for exact center
                                                transform: 'translate(-50%, -50%)',
                                                // Above the line and content
                                                zIndex: 3,
                                                // Center icon inside
                                                display: 'flex',

                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                <Box sx={{
                                                    // Inner circle width
                                                    width: 40,
                                                    // Inner circle height
                                                    height: 40,
                                                    // Still white background
                                                    backgroundColor: '#ffffff',
                                                    // Circle
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 3,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    // Elevation shadow effect
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
                                                    // Sets the width of the outer circle
                                                    width: 55,
                                                    // Sets the height of the outer circle (same as width to form a perfect circle)
                                                    height: 55,
                                                    // Sets background to white
                                                    backgroundColor: '#ffffff',
                                                    // Makes the box a perfect circle

                                                    borderRadius: '50%',
                                                    // Allows positioning relative to the parent container
                                                    position: 'absolute',
                                                    // Vertically centers the circle within the parent
                                                    top: '50%',
                                                    // Horizontally centers the circle within the parent
                                                    left: '50%',
                                                    // Offsets by 50% of its own size to center it exactly
                                                    transform: 'translate(-50%, -50%)',
                                                    // Puts this element above lower z-index layers like the timeline line
                                                    zIndex: 3,
                                                    // Uses flexbox to center the child (inner circle)
                                                    display: 'flex',
                                                    // Vertically centers child content (icon box)
                                                    alignItems: 'center',
                                                    // Horizontally centers child content (icon box)
                                                    justifyContent: 'center',

                                                }}
                                            >
                                                {/* Inner circle representing the promotion with an icon */}
                                                <Box
                                                    sx={{
                                                        // Inner circle width (slightly smaller than outer)
                                                        width: 40,
                                                        // Inner circle width (slightly smaller than outer)
                                                        height: 40,
                                                        // Orange color to signify a promotion event
                                                        backgroundColor: '#FF7300',
                                                        // Makes this a perfect circle
                                                        borderRadius: '50%',
                                                        // Positioned inside the outer circle
                                                        position: 'absolute',
                                                        // Vertically centers within the outer circle
                                                        top: '50%',
                                                        // Horizontally centers within the outer circle
                                                        left: '50%',
                                                        // Offsets by 50% to perfectly center
                                                        transform: 'translate(-50%, -50%)',
                                                        // Ensures this is on top of the timeline line
                                                        zIndex: 3,
                                                        // Enables centering of the icon
                                                        display: 'flex',
                                                        // Vertically centers the icon
                                                        alignItems: 'center',
                                                        // Horizontally centers the icon
                                                        justifyContent: 'center',
                                                        // Adds a subtle shadow (elevation) to create depth
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
                                            // Center all text
                                            textAlign: 'center',
                                            // Push down content if index is odd
                                            mt: index % 2 === 0 ? 0 : '180px',
                                            // Push up content if index is even
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
                <StateWithImage
                    imageUrl="/error.svg"
                    message="Unable to load promotion history."
                />
            )}
        </>
    );
}


