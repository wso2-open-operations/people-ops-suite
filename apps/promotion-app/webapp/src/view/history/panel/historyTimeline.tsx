import CustomizedTimeline from '@component/common/TimeLine'
import { AppConfig } from '@root/src/config/config';
import { APIService } from '@root/src/utils/apiService';
import { EmployeeInfo, PromotionRequest, TimeLineData } from '@root/src/utils/types';
import { useAppSelector, RootState } from "@slices/store";
import React, { useMemo } from 'react';
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

    // Extracting employee email from authentication state
    const employeeEmail = auth.userInfo?.email;

    // Fetch promotion request history on component mount or when employeeEmail changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (!employeeEmail) return;

        setState("loading");
      
        (async () => {
          try {
            const promotionHistory = await APIService.getInstance().get<{ promotionRequests: PromotionRequest[] }>(
              `${AppConfig.serviceUrls.retrieveAllPromotionRequests}/${employeeEmail}`
            );
            
            setRequests(promotionHistory.data.promotionRequests);
            setState("success");
          } catch (error) {
            console.error("Failed to fetch promotion requests:", error);
            setState("failed");
          }
        })();
      }, [employeeEmail]);
    // Memoize timeline data to avoid recalculating on every render
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const timelineData: TimeLineData[] = useMemo(() => {
        if (state !== "success") return [];

        // Temporary variable to store data for timeline rendering
        const data: TimeLineData[] = [];

        // Add user joined entry
        if (user.userInfo?.joinedDetails) {
            const joined = user.userInfo.joinedDetails;
            // First timeline entry for when the user joined the company
            data.push({
                Title: "Joined the Company",
                Date: new Date(joined.startDate || "").toLocaleDateString() || "",
                BusinessUnit: joined.startedBusinessUnit || "",
                Team: joined.startedTeam || "",
                SubTeam: joined.startedSubTeam || "",
                Lead: joined.startedreportingLead || "",
            });
        }

        // Add promotion entries
        requests.forEach((request) => {
            const recommendation = request.recommendations?.[0];
            data.push({
                Title: `Promoted to Band ${request.nextJobBand}`,
                Date: new Date(request.updatedOn).toLocaleDateString(),
                BusinessUnit: request.businessUnit || "",
                Team: request.department || "",
                SubTeam: request.team || "",
                Lead: recommendation?.leadEmail || "",
            });
        });

        return data;
    }, [state, user.userInfo, requests]);

    return (
        <>
            {/* Loading state - show loading image */}
            {state === "loading" && (
                <StateWithImage message="Loading Employee History" imageUrl="/loading.svg" />
            )}

            {/* Success state - build and show the timeline */}
            {state === "success" && timelineData.length > 0 && (
                <CustomizedTimeline timelineData={timelineData} />
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

