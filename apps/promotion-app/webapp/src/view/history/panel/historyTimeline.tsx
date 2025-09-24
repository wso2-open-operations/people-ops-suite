import CustomizedTimeline from '@component/common/TimeLine'
import { AppConfig } from '@root/src/config/config';
import { APIService } from '@root/src/utils/apiService';
import { EmployeeInfo, PromotionRequest, TimeLineData } from '@root/src/utils/types';
import { useAppSelector, RootState } from "@slices/store";
import React from 'react';
import { useEffect } from 'react';
import StateWithImage from '@component/ui/StateWithImage';

export default function history() {
    // Accessing authentication state to get the user's email
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAppSelector((state: RootState) => state.auth);

    // Accessing user state to get joined details
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const user = useAppSelector((state: RootState) => state.user);

    // Component state for tracking loading status
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [state, setState] = React.useState<"idle" | "loading" | "success" | "failed">("loading");

    // Component state for storing promotion request history
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [requests, setRequests] = React.useState<PromotionRequest[]>([]);

    // Temporary variable to store data for timeline rendering
    let timelineData: TimeLineData[] = [];

    // Extracting employee email from authentication state
    const employeeEmail = auth.userInfo?.email;

    // Fetch promotion request history on component mount or when employeeEmail changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        setState("loading");

        Promise.all([
            APIService.getInstance().get<{ promotionRequests: PromotionRequest[] }>(
                AppConfig.serviceUrls.retrieveAllPromotionRequests +
                "?statusArray=APPROVED&employeeEmail=" +
                employeeEmail
            ),
        ])
            .then(([promotionHistory]) => {
                const requests = promotionHistory.data.promotionRequests;
                // Update state with fetched data
                setRequests(requests);
                // Indicate successful load
                setState("success");
            })
            .catch((error: Error) => {
                // Indicate failure to load
                setState("failed");
            })
    }, [employeeEmail]); // Dependency array ensures it runs when employeeEmail changes

    // Builds the timeline data from user info and promotion history
    const handleSuccess = () => {

        // First timeline entry for when the user joined the company
        timelineData.push({
            Title: "Joined the Company",
            Date: new Date(user.userInfo?.joinedDetails.startDate || '').toLocaleDateString() || "",
            BusinessUnit: user.userInfo?.joinedDetails.startedBusinessUnit || "",
            Team: user.userInfo?.joinedDetails.startedTeam || "",
            SubTeam: user.userInfo?.joinedDetails.startedSubTeam || "",
            Lead: user.userInfo?.joinedDetails.startedreportingLead || "",
        });

        // Convert promotion requests into timeline entries
        const promotionEntries: TimeLineData[] = requests.map((request) => {
            const recommendation = request.recommendations?.[0];

            return {
                Title: `Promoted to Band ${request.nextJobBand}`,
                Date: new Date(request.updatedOn).toLocaleDateString(),
                BusinessUnit: request.businessUnit || "",
                Team: request.department || "",
                SubTeam: request.team || "",
                Lead: recommendation?.leadEmail || "",
            };
        });

        // Append promotion entries to timeline
        timelineData.push(...promotionEntries);

        return true;
    }

    return (
        <>
            {/* Loading state - show loading image */}
            {state === "loading" && (
                <StateWithImage message={"Loading Employee History"} imageUrl={"/loading.svg"} />
            )}

            {/* Success state - build and show the timeline */}
            {state === "success" && handleSuccess() && (
                <>
                    <CustomizedTimeline props={timelineData} />
                </>
            )}

            {/* Failure state - show error message */}
            {state === "failed" && (
                <StateWithImage
                    imageUrl="/error.svg"
                    message="Unable to load promotion history."
                />
            )}
        </>
    );
}

