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

import { Box, Button, Card, CardContent, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import { Award, Info } from "lucide-react";

import type { Application } from "@/types/types";
import ApplicationStatusBadge from "@component/careers/ApplicationStatusBadge";
import Callout from "@component/common/Callout";
import { ApplicationStatus } from "@config/constant";
import {
  STAGES,
  daysLeftText,
  formatDate,
  isOffer,
  nextStepOf,
  offerDeadlineOf,
  trackerOf,
} from "@view/applications/applicationHelpers";
import InterviewsSection from "@view/applications/components/InterviewsSection";
import OfferActions from "@view/applications/components/OfferActions";
import ProgressHistory from "@view/applications/components/ProgressHistory";

interface ApplicationDetailsProps {
  application: Application;
  // Whether the vacancy is still listed.
  jobOpen: boolean;
  onOpenJob: (jobId: string) => void;
  canAcceptOffer: boolean;
  onAcceptOffer: () => void;
  onDeclineOffer: () => void;
}

const ApplicationDetails = ({
  application,
  jobOpen,
  onOpenJob,
  canAcceptOffer,
  onAcceptOffer,
  onDeclineOffer,
}: ApplicationDetailsProps) => {
  const actionNeeded = isOffer(application);
  const deadline = actionNeeded ? offerDeadlineOf(application) : null;
  const offerExpired = deadline !== null && deadline.daysLeft < 0;
  const { activeStep, errorStep } = trackerOf(application);

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, lineHeight: 1.3, fontWeight: 400, color: "text.primary" }}
            >
              {application.jobTitle}
            </Typography>
            <Typography fontSize="0.9rem" color="text.secondary" mt={0.5}>
              {application.department} · Applied on {formatDate(application.appliedDate)}
            </Typography>
          </Box>
          <ApplicationStatusBadge status={application.status} />
        </Stack>
        <Typography
          fontSize="0.95rem"
          fontWeight={actionNeeded ? 700 : 500}
          sx={{ mt: 1.5, color: actionNeeded ? "#ff6700" : "text.secondary" }}
        >
          {nextStepOf(application)}
        </Typography>
      </Box>

      <CardContent sx={{ pt: 3, px: 3, pb: 3, borderTop: "1px solid", borderColor: "divider" }}>
        <Stepper
          alternativeLabel
          activeStep={activeStep}
          sx={{
            mb: 3,
            "& .MuiStepIcon-root": { color: "divider" },
            "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: "primary.main" },
            "& .MuiStepIcon-root.Mui-error": { color: "#EF4444" },
            "& .MuiStepLabel-label": { fontSize: "0.85rem" },
            "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line":
              { borderColor: "primary.main" },
          }}
        >
          {STAGES.map((label, index) => (
            <Step key={label}>
              <StepLabel error={index === errorStep}>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {isOffer(application) && (
          <Callout tone="success" icon={<Award size={20} color="#059669" />} sx={{ mb: 3 }}>
            <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
              Congratulations - you have been selected for this position.
            </Typography>
            <Typography fontSize="0.9rem" color="text.primary">
              We have sent your offer to your email. Please check your inbox, and your spam folder if you can&apos;t
              find it.
            </Typography>
            {deadline && (
              <Typography fontSize="0.9rem" fontWeight={700} color={offerExpired ? "error" : "text.primary"} mt={1}>
                {offerExpired
                  ? `This offer expired on ${deadline.date}. Please contact the recruitment team if you still want to join.`
                  : `Please respond by ${deadline.date} (${daysLeftText(deadline.daysLeft)}).`}
              </Typography>
            )}
          </Callout>
        )}

        {isOffer(application) && !offerExpired && (
          <OfferActions canAccept={canAcceptOffer} onAccept={onAcceptOffer} onDecline={onDeclineOffer} />
        )}

        {application.status === ApplicationStatus.OfferAccepted && (
          <Callout tone="success" icon={<Award size={20} color="#059669" />} sx={{ mb: 3 }}>
            <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
              You accepted this offer.
            </Typography>
            <Typography fontSize="0.9rem" color="text.primary">
              The hiring team will contact you with the next steps.
            </Typography>
          </Callout>
        )}

        {application.status === ApplicationStatus.OfferDeclined && (
          <Callout tone="brand" icon={<Info size={20} color="#6B7280" />} sx={{ mb: 3 }}>
            <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
              You declined this offer.
            </Typography>
          </Callout>
        )}

        {application.status === ApplicationStatus.Rejected && (
          <Callout tone="danger" icon={<Info size={20} color="#DC2626" />} sx={{ mb: 3 }}>
            <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
              You were not selected this time.
            </Typography>
          </Callout>
        )}

        <InterviewsSection interviews={application.interviews ?? []} />

        <ProgressHistory timeline={application.timeline ?? []} />

        {jobOpen && (
          <Button size="small" onClick={() => onOpenJob(application.jobId)} sx={{ fontWeight: 600 }}>
            View job
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationDetails;
