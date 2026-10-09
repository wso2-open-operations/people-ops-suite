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
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useRef, useState } from "react";

import { COUNTRY_OPTIONS } from "@utils/phone";
import { pillButtonSx } from "@utils/styles";

export interface ApplyFormValues {
  firstName: string;
  lastName: string;
  email: string;
  countryIso: string;
  phone: string;
  address: string;
}

interface ApplyFormProps {
  form: ApplyFormValues;
  onFormChange: (form: ApplyFormValues) => void;
  cvFile: File | null;
  onCvChosen: (file: File) => void;
  authorized: "yes" | "no" | "";
  onAuthorizedChange: (value: "yes" | "no") => void;
  consentData: boolean;
  onConsentDataChange: (checked: boolean) => void;
  consentChecks: boolean;
  onConsentChecksChange: (checked: boolean) => void;
  canSubmit: boolean;
  submitting: boolean;
  onSubmit: () => void;
}

const MAX_CV_BYTES = 5 * 1024 * 1024;

const ApplyForm = ({
  form,
  onFormChange,
  cvFile,
  onCvChosen,
  authorized,
  onAuthorizedChange,
  consentData,
  onConsentDataChange,
  consentChecks,
  onConsentChecksChange,
  canSubmit,
  submitting,
  onSubmit,
}: ApplyFormProps) => {
  const [cvError, setCvError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  return (
    <Stack gap={2.5}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="First Name"
            required
            fullWidth
            size="small"
            value={form.firstName}
            onChange={(e) => onFormChange({ ...form, firstName: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Last Name"
            required
            fullWidth
            size="small"
            value={form.lastName}
            onChange={(e) => onFormChange({ ...form, lastName: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Email"
            required
            fullWidth
            size="small"
            value={form.email}
            onChange={(e) => onFormChange({ ...form, email: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            select
            label="Country Code"
            required
            fullWidth
            size="small"
            value={form.countryIso}
            onChange={(e) => onFormChange({ ...form, countryIso: e.target.value })}
            slotProps={{
              select: {
                MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
                renderValue: (iso) => COUNTRY_OPTIONS.find((o) => o.iso === iso)?.dialCode ?? "",
              },
            }}
          >
            {COUNTRY_OPTIONS.map((o) => (
              <MenuItem key={o.iso} value={o.iso}>
                {o.name} ({o.dialCode})
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            label="Phone"
            required
            fullWidth
            size="small"
            value={form.phone}
            onChange={(e) => onFormChange({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 15) })}
            slotProps={{ htmlInput: { inputMode: "numeric" } }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            label="Address"
            required
            fullWidth
            size="small"
            value={form.address}
            onChange={(e) => onFormChange({ ...form, address: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography fontSize="0.9rem" fontWeight={600} mb={0.75}>
            Upload CV (PDF only / 5MB) *
          </Typography>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <input
              ref={cvInputRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                if (file.type !== "application/pdf") {
                  setCvError("Only PDF files are accepted.");
                  return;
                }
                if (file.size > MAX_CV_BYTES) {
                  setCvError("File must be 5MB or smaller.");
                  return;
                }
                setCvError(null);
                onCvChosen(file);
              }}
            />
            <Button variant="outlined" size="small" onClick={() => cvInputRef.current?.click()} sx={{ borderRadius: "8px" }}>
              Choose file
            </Button>
            <Typography fontSize="0.9rem" color="text.secondary" noWrap>
              {cvFile ? cvFile.name : "No file chosen"}
            </Typography>
          </Stack>
          {cvError && (
            <Typography fontSize="12px" color="error.main" mt={0.75}>
              {cvError}
            </Typography>
          )}
        </Grid>
      </Grid>

      <Box>
        <Typography fontSize="0.9rem" fontWeight={600} mb={0.5}>
          Do you have authorization to work in selected job location? *
        </Typography>

        <RadioGroup row value={authorized} onChange={(e) => onAuthorizedChange(e.target.value as "yes" | "no")}>
          <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
          <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
        </RadioGroup>
      </Box>

      <Stack gap={1}>
        <FormControlLabel
          control={<Checkbox size="small" checked={consentData} onChange={(e) => onConsentDataChange(e.target.checked)} />}
          label={
            <Typography fontSize="0.9rem">
              Yes, I give WSO2 permission to use my personal data for recruitment purposes only. *
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Checkbox size="small" checked={consentChecks} onChange={(e) => onConsentChecksChange(e.target.checked)} />
          }
          label={
            <Typography fontSize="0.9rem">
              I give WSO2 permission to assess my suitability for employment and to conduct independent reference
              checks and verify the information I provided, beyond what is on my résumé. *
            </Typography>
          }
        />
      </Stack>

      <Button
        variant="contained"
        size="large"
        disabled={!canSubmit || submitting}
        onClick={onSubmit}
        sx={{ ...pillButtonSx, alignSelf: "flex-start", px: 5 }}
      >
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </Stack>
  );
};

export default ApplyForm;
