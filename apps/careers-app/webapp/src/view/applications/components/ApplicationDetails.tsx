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
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@wso2/oxygen-ui";
import { Award, Info } from "@wso2/oxygen-ui-icons-react";

import type { Application, ApplicationInterview, DocumentsStatus } from "@/types/types";
import { BRAND_ORANGE, BRAND_TINT } from "@config/brand";
import { ApplicationStatus, DOCUMENTS_SUBMISSION_ENABLED } from "@config/constant";
import { cardSx, pillButtonSx } from "@utils/styles";
import {
  STAGES,
  historyOf,
  isOffer,
  offerDeadlineOf,
  trackerOf,
} from "@view/applications/applicationHelpers";
import InterviewsSection from "@view/applications/components/InterviewsSection";
import OfferActions, { OfferLetterButton } from "@view/applications/components/OfferActions";
import ProgressHistory from "@view/applications/components/ProgressHistory";

const PANEL_TONES = {
  success: {
    color: "#10B981",
    badge: "rgba(16,185,129,0.16)",
    background: "linear-gradient(135deg, rgba(16,185,129,0.16) 0%, rgba(20,184,166,0.04) 100%)",
    border: "rgba(16,185,129,0.35)",
  },
  brand: {
    color: BRAND_ORANGE,
    badge: BRAND_TINT.soft,
    background: "linear-gradient(135deg, rgba(255,103,0,0.12) 0%, rgba(255,103,0,0.03) 100%)",
    border: BRAND_TINT.border,
  },
  danger: {
    color: "#EF4444",
    badge: "rgba(239,68,68,0.14)",
    background: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)",
    border: "rgba(239,68,68,0.35)",
  },
};

interface OutcomePanelProps {
  tone: keyof typeof PANEL_TONES;
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}

// A roomy panel for the outcome of an application: a round icon badge, a large headline and the message below it. The
// selected, accepted and declined states all use it, so they read as one family.
const OutcomePanel = ({ tone, icon, title, children }: OutcomePanelProps) => (
  <Box
    sx={{
      mb: 3,
      p: { xs: 2.5, sm: 3.5 },
      borderRadius: "16px",
      background: PANEL_TONES[tone].background,
      border: `1px solid ${PANEL_TONES[tone].border}`,
    }}
  >
    <Stack direction={{ xs: "column", sm: "row" }} gap={2.5} alignItems="flex-start">
      <Box
        sx={{
          flexShrink: 0,
          width: 56,
          height: 56,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: PANEL_TONES[tone].badge,
          color: PANEL_TONES[tone].color,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          fontWeight={800}
          fontSize={{ xs: "1.05rem", sm: "1.2rem" }}
          lineHeight={1.3}
          color="text.primary"
          mb={1}
        >
          {title}
        </Typography>
        {children}
      </Box>
    </Stack>
  </Box>
);

interface ApplicationDetailsProps {
  application: Application;
  onAcceptOffer: () => void;
  onDeclineOffer: () => void;
  onSubmitDocuments: () => void;
  // The interviews of the application, past and upcoming.
  interviews: ApplicationInterview[];
  // Documents submission status; undefined while loading, null when it failed.
  documentsStatus: DocumentsStatus | null | undefined;
  onRetryDocumentsStatus: () => void;
}

const ApplicationDetails = ({
  application,
  onAcceptOffer,
  onDeclineOffer,
  onSubmitDocuments,
  interviews,
  documentsStatus,
  onRetryDocumentsStatus,
}: ApplicationDetailsProps) => {
  const actionNeeded = isOffer(application);
  const deadline = offerDeadlineOf(application);
  const { activeStep, errorStep } = trackerOf(application);

  return (
    <Card elevation={0} sx={cardSx}>
      <Box sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: "1.5rem", md: "1.9rem" },
                lineHeight: 1.3,
                fontWeight: 400,
                color: "text.primary",
              }}
            >
              {application.jobTitle}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <CardContent sx={{ pt: 3, px: 3, pb: 3, borderTop: "1px solid", borderColor: "divider" }}>
        <Stepper
          alternativeLabel
          activeStep={activeStep}
          sx={{
            mb: 3,
            "& .MuiStepIcon-root": { color: "divider" },
            "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": {
              color: "primary.main",
            },
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

        {application.status === ApplicationStatus.Applied && (
          <OutcomePanel tone="brand" icon={<Info size={28} />} title="Thank you for applying!">
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              We&apos;ve received your application, and our hiring team will carefully review your
              profile. We&apos;ll keep you updated on the next steps.
            </Typography>
          </OutcomePanel>
        )}

        {application.status === ApplicationStatus.Screening && (
          <OutcomePanel
            tone="brand"
            icon={<Info size={28} />}
            title="Your application is currently under review by our hiring team."
          />
        )}

        {application.status === ApplicationStatus.Interview && (
          <OutcomePanel tone="brand" icon={<Info size={28} />} title="You're making progress!">
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              Your application has moved to the interview stage.
            </Typography>
          </OutcomePanel>
        )}

        {application.status === ApplicationStatus.Selected && (
          <OutcomePanel tone="success" icon={<Award size={28} />} title="Great news!">
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              You&apos;ve successfully made it through our interview process. We&apos;re now working
              on the next steps and will be sharing your offer details with you shortly. We&apos;re
              excited about the possibility of having you on board!
            </Typography>
          </OutcomePanel>
        )}

        {actionNeeded && (
          <OutcomePanel tone="success" icon={<Award size={28} />} title="Congratulations!">
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              Your offer letter is ready! Please check your email and review your offer. Remember to
              accept or decline it{deadline ? ` before ${deadline.date} (anywhere on Earth)` : ""}.
            </Typography>
            <Box sx={{ mt: 2, mb: -3 }}>
              <OfferActions
                applicationId={application.id}
                jobTitle={application.jobTitle}
                onAccept={onAcceptOffer}
                onDecline={onDeclineOffer}
              />
            </Box>
          </OutcomePanel>
        )}

        {application.status === ApplicationStatus.OfferExpired && (
          <OutcomePanel
            tone="danger"
            icon={<Info size={28} />}
            title={deadline ? `Your offer expired on ${deadline.date}.` : "Your offer has expired."}
          >
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              If you&apos;re still interested in joining our team, please get in touch with our
              People Operations team to discuss the next steps.
            </Typography>
          </OutcomePanel>
        )}

        {application.status === ApplicationStatus.OfferAccepted && (
          <OutcomePanel tone="success" icon={<Award size={28} />} title="Congratulations!">
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              You&apos;ve officially accepted our offer. We&apos;re excited to have you join the
              team! Our Onboarding Team will be in touch with you soon to guide you through the next
              steps.
            </Typography>
            <Box sx={{ my: 1.5 }}>
              <OfferLetterButton applicationId={application.id} jobTitle={application.jobTitle} />
            </Box>
            {!DOCUMENTS_SUBMISSION_ENABLED ? null : documentsStatus === undefined ? (
              <Skeleton
                variant="rounded"
                width={170}
                height={40}
                sx={{ borderRadius: "999px", mt: 1.5 }}
              />
            ) : documentsStatus === null ? (
              <>
                <Typography fontSize="0.9rem" color="text.primary" mt={0.5}>
                  We could not check whether your documents were submitted.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={onRetryDocumentsStatus}
                  sx={{ ...pillButtonSx, px: 3, mt: 1.5 }}
                >
                  Try again
                </Button>
              </>
            ) : documentsStatus.submitted ? (
              <>
                <Typography fontSize="0.9rem" color="text.primary">
                  We received your details and documents. The hiring team will contact you with the
                  next steps.
                </Typography>
                {documentsStatus.canEdit ? (
                  <>
                    {documentsStatus.editableUntil && (
                      <Typography fontSize="0.9rem" color="text.primary" mt={0.5}>
                        You can make changes until{" "}
                        {new Date(documentsStatus.editableUntil).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        .
                      </Typography>
                    )}
                    <Button
                      variant="outlined"
                      onClick={onSubmitDocuments}
                      sx={{ ...pillButtonSx, px: 3, mt: 1.5 }}
                    >
                      Edit submission
                    </Button>
                  </>
                ) : (
                  <Typography fontSize="0.9rem" color="text.primary" mt={0.5}>
                    {documentsStatus.editableUntil
                      ? "The time to make changes has ended."
                      : "Please contact the hiring team if something needs to change."}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Typography fontSize="0.9rem" color="text.primary">
                  Please submit the documents we need for your onboarding. The hiring team will
                  contact you with the next steps.
                </Typography>
                <Button
                  variant="contained"
                  onClick={onSubmitDocuments}
                  sx={{ ...pillButtonSx, px: 3, mt: 1.5 }}
                >
                  Submit documents
                </Button>
              </>
            )}
          </OutcomePanel>
        )}

        {application.status === ApplicationStatus.OfferDeclined && (
          <OutcomePanel tone="brand" icon={<Info size={28} />} title="You've declined this offer.">
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              Thank you for considering a career with us. We wish you all the best in your future
              endeavours!
            </Typography>
          </OutcomePanel>
        )}

        {application.status === ApplicationStatus.Rejected && (
          <OutcomePanel
            tone="danger"
            icon={<Info size={28} />}
            title="Thank you for your interest in joining us."
          >
            <Typography fontSize="0.9rem" lineHeight={1.7} color="text.primary">
              Although you weren&apos;t selected this time, we truly appreciate the time and effort
              you&apos;ve invested in your application.
            </Typography>
          </OutcomePanel>
        )}

        <InterviewsSection interviews={interviews} />

        <ProgressHistory entries={historyOf(application, interviews)} />
      </CardContent>
    </Card>
  );
};

export default ApplicationDetails;
