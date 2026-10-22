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
import { Box, Button, Card, Checkbox, Chip, FormControlLabel, Link, Stack, Typography } from "@mui/material";
import axios from "axios";
import { ArrowLeft, Check, FileUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  type DocumentRequirement,
  type DocumentRequirements,
  type DocumentsStatus,
  type PersonalDetails,
  State,
} from "@/types/types";
import Callout from "@component/common/Callout";
import CenteredSpinner from "@component/common/CenteredSpinner";
import PageContainer from "@component/common/PageContainer";
import { ApplicationStatus, SnackMessage } from "@config/constant";
import { useAppAuthContext } from "@context/AuthContext";
import { applicationsFailed, loadApplications, loadProfile, profileFailed } from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { fetchDocumentRequirements, fetchDocumentsStatus, submitDocuments } from "@utils/profileService";
import { cardSx, pillButtonSx } from "@utils/styles";
import PersonalDetailsForm, {
  type DetailErrors,
  detailErrorsOf,
  detailsFromProfile,
  emptyDetails,
  summarySectionsOf,
} from "@view/documents/PersonalDetailsForm";

const MEGABYTE = 1024 * 1024;

const STEPS = ["Personal details", "Documents", "Photos", "Review & submit"];
const DETAILS_STEP = 0;
const DOCUMENTS_STEP = 1;
const PHOTOS_STEP = 2;
const REVIEW_STEP = 3;

const formatSize = (bytes: number) => `${(bytes / MEGABYTE).toFixed(1)} MB`;

// A deadline, from its ISO 8601 text, as a date to read.
const deadlineText = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });

const extensionOf = (fileName: string) => fileName.split(".").pop()?.toLowerCase() ?? "";

// The file extensions a document accepts.
const extensionsOf = (types: string[]) => types.flatMap((type) => (type === "jpg" ? ["jpg", "jpeg"] : [type]));

// The formats a document accepts, for the line under its name.
const formatsText = (types: string[]) => (types.includes("pdf") ? "PDF" : "JPG or PNG");

// The kind of file a document needs, in a sentence.
const typesText = (types: string[]) => (types.includes("pdf") ? "a PDF file" : "a JPG or PNG image");

// The hint, with any web address in it shown as a link that opens in a new tab.
const hintContent = (hint: string) =>
  hint.split(/(https:\/\/\S+[^\s.,;])/).map((part, index) =>
    part.startsWith("https://") ? (
      <Link key={index} href={part} target="_blank" rel="noopener noreferrer">
        {part.replace("https://", "")}
      </Link>
    ) : (
      part
    ),
  );

// The message for a picture that is not square or not big enough, or an empty text when it is fine.
const squareProblem = async (file: File, side: number) => {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    bitmap.close();
    return width === height && width >= side ? "" : `The picture must be square, at least ${side} x ${side} pixels.`;
  } catch {
    return "This picture could not be read.";
  }
};

// The record without the given key.
function without<T>(record: Record<string, T>, key: string): Record<string, T> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key));
}

// The message for a file that cannot be sent, or an empty text when the file is fine.
const problemWith = (file: File, requirements: DocumentRequirements, document: DocumentRequirement) => {
  if (file.size === 0) return "This file is empty.";
  if (file.size > requirements.maxFileBytes) return `This file is larger than ${formatSize(requirements.maxFileBytes)}.`;
  if (extensionsOf(document.types).includes(extensionOf(file.name))) return "";
  return `Send ${typesText(document.types)}.`;
};

// How far a section has got: nothing chosen yet, a file that is ready, or a file that was refused.
const STATUS_COLORS = { Complete: "success", Pending: "default", "Action needed": "error" } as const;

const statusOf = (hasFile: boolean, problem: string | undefined): keyof typeof STATUS_COLORS =>
  problem ? "Action needed" : hasFile ? "Complete" : "Pending";

// The message for a submission that was refused, taken from the reply when the backend explains why.
const submitFailureMessage = (error: unknown) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  if (status === 400 || status === 403 || status === 409) {
    // The backend explains these in its own words, such as "The time to change your documents has ended."
    const reason = axios.isAxiosError(error) ? (error.response?.data as { message?: unknown })?.message : undefined;
    if (typeof reason === "string") return reason;
  }
  if (status === 400) return SnackMessage.error.submitDocuments;
  if (status === 403 || status === 404) return SnackMessage.error.documentsNotAllowed;
  if (status === 409) return SnackMessage.error.documentsAlreadySent;
  if (status === 413) return SnackMessage.error.documentsTooLarge;
  if (status === 429) return SnackMessage.error.documentsTooManyAttempts;
  return SnackMessage.error.submitDocuments;
};

// The page where a candidate who accepted an offer sends their details and the documents needed for onboarding.
const Documents = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getToken } = useAppAuthContext();
  const { id: applicationId } = useParams<{ id: string }>();
  const applications = useAppSelector((state: RootState) => state.careers.applications);
  const applicationsState = useAppSelector((state: RootState) => state.careers.applicationsState);
  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const profileState = useAppSelector((state: RootState) => state.careers.profileState);

  // What the candidate types and chooses is kept in this page only: it is not stored in the app state and it is
  // gone once the page closes or the candidate signs out.
  const [step, setStep] = useState(DETAILS_STEP);
  const [details, setDetails] = useState<PersonalDetails>(emptyDetails());
  // Raised when details are loaded into the form from elsewhere, so that its inputs start again from them.
  const [detailsVersion, setDetailsVersion] = useState(0);
  const [showDetailErrors, setShowDetailErrors] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [files, setFiles] = useState<Record<string, File>>({});
  const [problems, setProblems] = useState<Record<string, string>>({});
  const [requirements, setRequirements] = useState<DocumentRequirements | null>(null);
  const [requirementsState, setRequirementsState] = useState<State>(State.idle);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [declared, setDeclared] = useState(false);
  // What the backend says about an earlier submission; undefined until it answers, null when it could not.
  const [status, setStatus] = useState<DocumentsStatus | null | undefined>(undefined);

  useEffect(() => {
    if (applicationsState !== State.idle) return;
    getToken()
      .then((token) => dispatch(loadApplications(token)))
      .catch(() => dispatch(applicationsFailed()));
  }, [applicationsState, dispatch, getToken]);

  // The candidate's profile holds what the ATS keeps about them, so the form starts filled in with that.
  useEffect(() => {
    if (profileState !== State.idle) return;
    getToken()
      .then((token) => dispatch(loadProfile(token)))
      .catch(() => dispatch(profileFailed()));
  }, [profileState, dispatch, getToken]);

  useEffect(() => {
    if (prefilled || profileState !== State.success) return;
    setDetails((current) => detailsFromProfile(current, profile));
    setDetailsVersion((current) => current + 1);
    setPrefilled(true);
  }, [prefilled, profile, profileState]);

  const application = applications.find((a) => a.id === applicationId);
  const eligible = application?.status === ApplicationStatus.OfferAccepted;

  useEffect(() => {
    if (!eligible || requirementsState !== State.idle) return;
    setRequirementsState(State.loading);
    getToken()
      .then(fetchDocumentRequirements)
      .then((loaded) => {
        setRequirements(loaded);
        setRequirementsState(State.success);
      })
      .catch(() => {
        setRequirementsState(State.failed);
        dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.fetchDocumentRequirements, type: "error" }));
      });
  }, [eligible, requirementsState, dispatch, getToken]);

  // An earlier submission decides between a first submission, a change to it, or neither. Its saved details replace
  // what was filled in from the profile.
  useEffect(() => {
    if (!eligible || !applicationId) return;
    getToken()
      .then((token) => fetchDocumentsStatus(token, applicationId))
      .then((loaded) => {
        setStatus(loaded);
        if (loaded.details) {
          // Anything an older submission did not have is filled in as empty, so the form never meets a missing list.
          setDetails({ ...emptyDetails(), ...loaded.details });
          setDetailsVersion((current) => current + 1);
          setPrefilled(true);
        }
      })
      .catch(() => setStatus(null));
  }, [eligible, applicationId, getToken]);

  const sentKeys = status?.files ?? [];
  const editing = Boolean(status?.submitted && status.canEdit);
  const closed = Boolean(status?.submitted && !status.canEdit);

  // The list of documents and the earlier submission are only asked for once the application is known to be an
  // accepted offer, so they are only waited for then.
  const stillLoading =
    applicationsState === State.idle ||
    applicationsState === State.loading ||
    (eligible &&
      (requirementsState === State.idle || requirementsState === State.loading || status === undefined));

  const chooseFile = async (key: string, file: File | undefined) => {
    if (!file || !requirements) return;
    const requested = requirements.documents.find((document) => document.key === key);
    if (!requested) return;
    let problem = problemWith(file, requirements, requested);
    if (!problem && requested.minSquareSide) problem = await squareProblem(file, requested.minSquareSide);
    setProblems((current) => ({ ...current, [key]: problem }));
    if (problem) return;
    setFiles((current) => ({ ...current, [key]: file }));
  };

  const removeFile = (key: string) => {
    setFiles((current) => without(current, key));
    setProblems((current) => without(current, key));
  };

  const totalBytes = Object.values(files).reduce((sum, file) => sum + file.size, 0);
  const tooLarge = requirements ? totalBytes > requirements.maxTotalBytes : false;
  const documentsIn = (group: string) => requirements?.documents.filter((document) => document.group === group) ?? [];
  // A document counts as sent when a file was chosen now or one was sent earlier.
  const isSent = (key: string) => Boolean(files[key]) || sentKeys.includes(key);
  const missingIn = (group: string) => documentsIn(group).filter((document) => document.required && !isSent(document.key));
  const allDocumentsReady = missingIn("documents").length === 0 && missingIn("photos").length === 0;

  // Any step can be opened at any time: what is missing is shown on the last step, where submitting is checked.
  const goTo = (target: number) => {
    if (!submitting) setStep(target);
  };

  // The problems with the personal details, empty when they are all fine.
  const currentDetailErrors: DetailErrors = requirements ? detailErrorsOf(details, requirements) : {};
  const detailsReady = requirements !== null && Object.keys(currentDetailErrors).length === 0;

  // Opens the details step with its problems shown.
  const showDetailProblems = () => {
    setShowDetailErrors(true);
    setStep(DETAILS_STEP);
  };

  const handleSubmit = async () => {
    if (!application || !requirements || submitting) return;
    if (!detailsReady) {
      showDetailProblems();
      return;
    }
    if (!allDocumentsReady || tooLarge || !declared) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await submitDocuments(token, application.id, files, details, editing);
      setFiles({});
      setSubmitted(true);
      const message = editing ? SnackMessage.success.documentsUpdated : SnackMessage.success.documentsSent;
      dispatch(enqueueSnackbarMessage({ message, type: "success" }));
    } catch (error) {
      dispatch(enqueueSnackbarMessage({ message: submitFailureMessage(error), type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  const backToApplication = () => navigate(applicationId ? `/applications/${applicationId}` : "/applications");

  // The rows of the documents or photos step: one per document, each with its status.
  const renderFileRows = (group: string) => (
    <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />}>
      {documentsIn(group).map((document) => {
        const file = files[document.key];
        const sentEarlier = !file && sentKeys.includes(document.key);
        const documentStatus = statusOf(isSent(document.key), problems[document.key]);
        return (
          <Stack
            key={document.key}
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            gap={1.5}
            sx={{ px: 3, py: 2 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <Typography fontWeight={600} fontSize="0.95rem" color="text.primary">
                  {document.label}
                </Typography>
                <Chip size="small" variant="outlined" color={STATUS_COLORS[documentStatus]} label={documentStatus} />
                {!document.required && <Chip size="small" variant="outlined" label="Optional" />}
              </Stack>
              <Typography fontSize="0.8rem" color="text.secondary">
                {formatsText(document.types)}
                {document.hint && <> · {hintContent(document.hint)}</>}
              </Typography>
              {file && (
                <Typography fontSize="0.85rem" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                  {file.name} · {formatSize(file.size)}
                </Typography>
              )}
              {problems[document.key] && (
                <Typography fontSize="0.85rem" color="error">
                  {problems[document.key]}
                </Typography>
              )}
            </Box>

            {file ? (
              <Button
                startIcon={<Trash2 size={16} />}
                onClick={() => removeFile(document.key)}
                disabled={submitting}
                sx={{ fontWeight: 600 }}
              >
                Remove
              </Button>
            ) : (
              <Button
                component="label"
                variant="outlined"
                startIcon={<FileUp size={16} />}
                disabled={submitting}
                sx={pillButtonSx}
              >
                {sentEarlier ? "Replace" : "Upload"}
                <input
                  hidden
                  type="file"
                  accept={extensionsOf(document.types)
                    .map((extension) => `.${extension}`)
                    .join(",")}
                  onChange={(event) => {
                    void chooseFile(document.key, event.target.files?.[0]);
                    // Lets the same file be chosen again after it was removed.
                    event.target.value = "";
                  }}
                />
              </Button>
            )}
          </Stack>
        );
      })}
    </Stack>
  );

  // The last step: what will be sent, the declaration and the submit button.
  const renderReview = (r: DocumentRequirements) => {
    const missingDocuments = r.documents.filter((document) => document.required && !isSent(document.key));
    return (
      <>
        {(!detailsReady || missingDocuments.length > 0) && (
          <Box sx={{ px: 3, pt: 3 }}>
            <Callout tone="danger">
              <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
                Submit unlocks when everything is complete
              </Typography>
              {!detailsReady && (
                <Typography fontSize="0.9rem" color="text.primary">
                  Some personal details are missing.{" "}
                  <Link component="button" type="button" onClick={showDetailProblems} sx={{ verticalAlign: "baseline" }}>
                    Go to personal details
                  </Link>
                </Typography>
              )}
              {missingDocuments.length > 0 && (
                <Box>
                  <Typography fontSize="0.9rem" color="text.primary" mb={0.75}>
                    Still to add:
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {missingDocuments.map((document) => (
                      <Chip
                        key={document.key}
                        label={document.label}
                        variant="outlined"
                        clickable
                        onClick={() => goTo(document.group === "photos" ? PHOTOS_STEP : DOCUMENTS_STEP)}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Callout>
          </Box>
        )}
        {summarySectionsOf(details).map((section) => (
          <Box key={section.title} sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography fontWeight={700} fontSize="0.95rem" color="text.primary" mb={1.5}>
              {section.title}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "260px 1fr" }, rowGap: 1, columnGap: 2 }}>
              {section.rows.map(([label, value]) => (
                <Box key={label} sx={{ display: "contents" }}>
                  <Typography fontSize="0.9rem" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontSize="0.9rem" color="text.primary" sx={{ wordBreak: "break-word" }}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}

        <Box sx={{ px: 3, pb: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography fontWeight={700} fontSize="0.95rem" color="text.primary" mt={2} mb={1}>
            Your documents and photos
          </Typography>
          {r.documents.map((document) => (
            <Stack key={document.key} direction="row" justifyContent="space-between" gap={2} sx={{ py: 0.5 }}>
              <Typography fontSize="0.9rem" color="text.primary">
                {document.label}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color={STATUS_COLORS[statusOf(isSent(document.key), undefined)]}
                label={
                  files[document.key]
                    ? "Complete"
                    : sentKeys.includes(document.key)
                      ? "Already uploaded"
                      : document.required
                        ? "Pending"
                        : "Not sent"
                }
              />
            </Stack>
          ))}
          <Typography fontSize="0.85rem" color={tooLarge ? "error" : "text.secondary"} mt={1}>
            {formatSize(totalBytes)} of {formatSize(r.maxTotalBytes)}
          </Typography>
        </Box>

        <Box sx={{ px: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <FormControlLabel
            control={<Checkbox checked={declared} onChange={(event) => setDeclared(event.target.checked)} disabled={submitting} />}
            label="I declare that these documents are genuine and the details in them are correct."
            sx={{ alignItems: "flex-start", "& .MuiTypography-root": { fontSize: "0.9rem", pt: 0.75 } }}
          />
        </Box>
      </>
    );
  };

  return (
    <PageContainer>
      <Button startIcon={<ArrowLeft size={16} />} onClick={backToApplication} sx={{ mb: 2, ml: -1, fontWeight: 600 }}>
        Application
      </Button>

      {stillLoading && <CenteredSpinner />}

      {!stillLoading && !eligible && (
        <Typography color="text.secondary">
          Documents can be submitted once you have accepted the offer for this application.
        </Typography>
      )}

      {!stillLoading && eligible && closed && !submitted && (
        <Callout tone="brand">
          <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
            Your documents were submitted.
          </Typography>
          <Typography fontSize="0.9rem" color="text.primary">
            The time to change them has ended. Please contact the hiring team if something needs to change.
          </Typography>
        </Callout>
      )}

      {!stillLoading && eligible && requirementsState === State.failed && (
        <Stack alignItems="flex-start" gap={1.5}>
          <Typography color="text.secondary">We couldn&apos;t load the list of documents.</Typography>
          <Button variant="outlined" onClick={() => setRequirementsState(State.idle)} sx={pillButtonSx}>
            Try again
          </Button>
        </Stack>
      )}

      {!stillLoading && eligible && application && requirements && submitted && (
        <Callout tone="success" icon={<Check size={20} color="#059669" />}>
          <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
            {editing ? "Your changes were saved." : "We received your details and documents."}
          </Typography>
          <Typography fontSize="0.9rem" color="text.primary">
            The hiring team will contact you with the next steps.
          </Typography>
          <Button variant="contained" onClick={backToApplication} sx={{ ...pillButtonSx, px: 3, mt: 1.5 }}>
            Back to application
          </Button>
        </Callout>
      )}

      {!stillLoading && eligible && !closed && application && requirements && !submitted && (
        <Card elevation={0} sx={cardSx}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, lineHeight: 1.3, fontWeight: 400, color: "text.primary" }}
            >
              {editing ? "Change your submission" : `Join ${application.jobTitle}`}
            </Typography>
            <Typography fontSize="0.9rem" color="text.secondary" mt={0.5} mb={2.5}>
              {editing
                ? `You can change your details and replace files until ${deadlineText(status?.editableUntil ?? "")}.`
                : "Check everything on the last step before you submit."}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
              {STEPS.map((label, index) => (
                <Button
                  key={label}
                  onClick={() => goTo(index)}
                  disabled={submitting}
                  variant={index === step ? "contained" : "outlined"}
                  color="primary"
                  sx={{
                    ...pillButtonSx,
                    py: 1.25,
                    ...(index !== step && { color: "text.primary", borderColor: "primary.main" }),
                  }}
                >
                  {index + 1}. {label}
                </Button>
              ))}
            </Box>
          </Box>

          {step === DETAILS_STEP && (
            <PersonalDetailsForm
              key={detailsVersion}
              details={details}
              onChange={setDetails}
              errors={showDetailErrors ? currentDetailErrors : {}}
              options={requirements}
              disabled={submitting}
            />
          )}
          {step === DOCUMENTS_STEP && renderFileRows("documents")}
          {step === PHOTOS_STEP && renderFileRows("photos")}
          {step === REVIEW_STEP && renderReview(requirements)}

          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1.5}
            sx={{ p: 3, borderTop: "1px solid", borderColor: "divider" }}
          >
            <Button onClick={() => goTo(step - 1)} disabled={step === DETAILS_STEP || submitting} sx={{ fontWeight: 600 }}>
              Back
            </Button>
            {step < REVIEW_STEP ? (
              <Button variant="contained" onClick={() => goTo(step + 1)} sx={{ ...pillButtonSx, px: 3 }}>
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={submitting || !detailsReady || !allDocumentsReady || tooLarge || !declared}
                sx={{ ...pillButtonSx, px: 3 }}
              >
                {submitting ? (editing ? "Saving..." : "Submitting...") : editing ? "Save changes" : "Submit"}
              </Button>
            )}
          </Stack>
        </Card>
      )}
    </PageContainer>
  );
};

export default Documents;
