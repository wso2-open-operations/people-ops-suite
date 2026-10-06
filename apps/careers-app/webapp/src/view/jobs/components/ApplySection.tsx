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

import { Box, Typography } from "@mui/material";

import { useState } from "react";

import { SnackMessage } from "@config/constant";
import { useAppAuthContext } from "@context/AuthContext";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useAppDispatch } from "@slices/store";
import { COUNTRY_OPTIONS } from "@utils/phone";
import { type VacancyDetail, submitApplicationForm } from "@utils/vacancyService";
import ApplicationSubmittedDialog from "@view/jobs/components/ApplicationSubmittedDialog";
import ApplyForm, { type ApplyFormValues } from "@view/jobs/components/ApplyForm";
import GuestSignInPrompt from "@view/jobs/components/GuestSignInPrompt";

interface ApplySectionProps {
  detail: VacancyDetail;
}

// The "Apply Now" card: the application form, its submit logic and the confirmation dialog.
const ApplySection = ({ detail }: ApplySectionProps) => {
  const dispatch = useAppDispatch();
  const { getToken: getAccessToken, isSignedIn, appSignIn } = useAppAuthContext();

  const [form, setForm] = useState<ApplyFormValues>({
    firstName: "",
    lastName: "",
    email: "",
    countryIso: "",
    phone: "",
    address: "",
  });
  const [authorized, setAuthorized] = useState<"yes" | "no" | "">("");
  const [consentData, setConsentData] = useState(false);
  const [consentChecks, setConsentChecks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOpen, setSubmittedOpen] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const applyFormValid =
    !!form.firstName.trim() &&
    !!form.lastName.trim() &&
    !!form.email.trim() &&
    !!form.countryIso &&
    !!form.phone.trim() &&
    !!form.address.trim() &&
    !!cvFile &&
    !!authorized &&
    consentData &&
    consentChecks;

  const handleSubmitApplication = async () => {
    if (!applyFormValid || !cvFile) return;
    setSubmitting(true);
    try {
      const dialCode = COUNTRY_OPTIONS.find((o) => o.iso === form.countryIso)?.dialCode ?? "";
      await submitApplicationForm(
        await getAccessToken(),
        detail.id,
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          // The vacancy service accepts only E.164 (+ then digits, no spaces); a leading trunk "0" is dropped.
          phone: `${dialCode}${form.phone.replace(/\D/g, "").replace(/^0+/, "")}`,
          address: form.address.trim(),
          authorizedToWork: authorized === "yes",
        },
        cvFile,
      );
      setSubmittedOpen(true);
    } catch (err) {
      // The backend explains rejections (a missing field, a bad CV) in `message`.
      const data = (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      const detailMessage = data?.detail ?? data?.message;
      dispatch(enqueueSnackbarMessage({ message: detailMessage ?? SnackMessage.error.submitApplication, type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Box
        id="Apply-Now"
        sx={{
          mt: 6,
          scrollMarginTop: "24px",
          p: { xs: 2.5, md: 4 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
          boxShadow: "0 18px 40px -16px rgb(7 20 46 / 18%)",
          "& .MuiInputBase-root, & .MuiInputLabel-root": { fontSize: "1rem" },
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="h4" fontWeight={800} sx={{ color: "text.primary" }} mb={0.5}>
          Apply Now
        </Typography>
        {!isSignedIn ? <GuestSignInPrompt onSignIn={appSignIn} /> : <Box sx={{ mb: 2 }} />}

        <ApplyForm
          form={form}
          onFormChange={setForm}
          cvFile={cvFile}
          onCvChosen={setCvFile}
          authorized={authorized}
          onAuthorizedChange={setAuthorized}
          consentData={consentData}
          onConsentDataChange={setConsentData}
          consentChecks={consentChecks}
          onConsentChecksChange={setConsentChecks}
          canSubmit={applyFormValid}
          submitting={submitting}
          onSubmit={handleSubmitApplication}
        />
      </Box>

      <ApplicationSubmittedDialog
        open={submittedOpen}
        jobTitle={detail.title}
        isSignedIn={isSignedIn}
        onClose={() => setSubmittedOpen(false)}
        onSignIn={appSignIn}
      />
    </>
  );
};

export default ApplySection;
