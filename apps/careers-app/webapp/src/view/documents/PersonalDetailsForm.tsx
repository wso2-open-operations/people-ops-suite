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
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import type {
  CandidateProfile,
  Dependant,
  DocumentRequirements,
  EmergencyContact,
  PersonalDetails,
} from "@/types/types";
import { isValidEmail } from "@utils/email";
import { COUNTRY_OPTIONS, isValidE164, splitE164, toE164 } from "@utils/phone";
import { pillButtonSx } from "@utils/styles";

// The choices the form offers, which the backend supplies.
export type FormOptions = Pick<
  DocumentRequirements,
  "tshirtSizes" | "titles" | "genders" | "civilStatuses" | "dependantRelationships" | "maxDependants" | "maxEmergencyContacts"
>;

// The problems with the details, by field. A field inside a list is named after its place, such as
// "emergencyContacts.1.mobileNumber".
export type DetailErrors = Record<string, string>;

const emptyContact = (): EmergencyContact => ({ name: "", relationship: "", address: "", mobileNumber: "", landNumber: "" });

const emptyDependant = (): Dependant => ({ relationship: "", name: "", dateOfBirth: "", idNumber: "" });

// A form with nothing filled in, and the two emergency contacts that are asked for.
export const emptyDetails = (): PersonalDetails => ({
  title: "",
  firstName: "",
  surname: "",
  fullName: "",
  preferredName: "",
  initials: "",
  nameWithInitials: "",
  gender: "",
  dateOfBirth: "",
  idNumber: "",
  civilStatus: "",
  tshirtSize: "",
  homeAddress: "",
  temporaryAddress: "",
  mobileNumber: "",
  landNumber: "",
  personalEmail: "",
  businessInterest: "",
  dependants: [],
  emergencyContacts: [emptyContact(), emptyContact()],
  bank: { bank: "", branch: "", accountNumber: "" },
  highestQualification: "",
  university: "",
  githubUserId: "",
});

// Fills what is still empty with what the application already holds, which is what the ATS keeps about the candidate.
// The preferred name and the full name are left for the candidate to type.
export const detailsFromProfile = (current: PersonalDetails, profile: CandidateProfile): PersonalDetails => {
  return {
    ...current,
    firstName: current.firstName || profile.firstName,
    surname: current.surname || profile.lastName,
    gender: current.gender || profile.gender,
    personalEmail: current.personalEmail || profile.personalEmail,
    mobileNumber: current.mobileNumber || (isValidE164(profile.contactNo) ? profile.contactNo : ""),
    // An internship application is stored with "N/A" as its address, which is not a home address.
    homeAddress: current.homeAddress || (profile.address && profile.address !== "N/A" ? profile.address : ""),
    university: current.university || (profile.university ?? ""),
  };
};

const YES_NO = ["Yes", "No"];

const ID_NUMBER = /^[A-Za-z0-9][A-Za-z0-9 /-]{3,29}$/;
const ACCOUNT_NUMBER = /^[0-9]{5,20}$/;
const GITHUB_USER = /^[A-Za-z0-9-]{1,39}$/;

// A phone number without the spaces and hyphens people type in it.
const compactPhone = (phone: string) => phone.replace(/[\s-]/g, "");

// Whether the text is a real date, written yyyy-mm-dd, that is not in the future and not before the given year.
const isPastDate = (text: string, earliestYear: number) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date <= new Date() && date.getFullYear() >= earliestYear;
};

// The problems with the details, by field; empty when every detail is fine.
export const detailErrorsOf = (details: PersonalDetails, options: FormOptions): DetailErrors => {
  const errors: DetailErrors = {};
  const need = (key: string, value: string, message: string) => {
    if (!value.trim()) errors[key] = message;
  };
  const oneOf = (key: string, value: string, choices: string[], message: string) => {
    if (!choices.includes(value)) errors[key] = message;
  };
  const phone = (key: string, value: string, required: boolean) => {
    if (!value.trim()) {
      if (required) errors[key] = "Choose the country code and enter the number.";
    } else if (!isValidE164(compactPhone(value))) {
      errors[key] = "Choose the country code and enter a valid number.";
    }
  };

  oneOf("title", details.title, options.titles, "Choose your title.");
  need("firstName", details.firstName, "Enter your first name.");
  need("surname", details.surname, "Enter your last name.");
  need("fullName", details.fullName, "Enter your full name as on your identity document.");
  need("preferredName", details.preferredName, "Enter the name you like to be called.");
  need("initials", details.initials, "Enter your initials.");
  need("nameWithInitials", details.nameWithInitials, "Enter your name with initials.");
  oneOf("gender", details.gender, options.genders, "Choose your gender.");
  if (!isPastDate(details.dateOfBirth, 1940)) errors.dateOfBirth = "Enter a valid date of birth.";
  if (!ID_NUMBER.test(details.idNumber.trim())) errors.idNumber = "Enter a valid identity document number.";
  oneOf("civilStatus", details.civilStatus, options.civilStatuses, "Choose your civil status.");
  oneOf("businessInterest", details.businessInterest, YES_NO, "Choose Yes or No.");
  oneOf("tshirtSize", details.tshirtSize, options.tshirtSizes, "Choose your T-shirt size.");
  need("homeAddress", details.homeAddress, "Enter your residential address.");
  phone("mobileNumber", details.mobileNumber, true);
  phone("landNumber", details.landNumber, false);
  if (!isValidEmail(details.personalEmail)) errors.personalEmail = "Enter a valid email address.";

  details.dependants.forEach((dependant, index) => {
    const at = `dependants.${index}`;
    oneOf(`${at}.relationship`, dependant.relationship, options.dependantRelationships, "Choose the relationship.");
    need(`${at}.name`, dependant.name, "Enter the name.");
    if (!isPastDate(dependant.dateOfBirth, 1900)) errors[`${at}.dateOfBirth`] = "Enter a valid date of birth.";
    if (dependant.idNumber.trim() && !ID_NUMBER.test(dependant.idNumber.trim())) {
      errors[`${at}.idNumber`] = "Enter a valid identity document number, or leave it blank.";
    }
  });

  if (details.emergencyContacts.length < 2) errors.emergencyContacts = "Give at least two emergency contacts.";
  details.emergencyContacts.forEach((contact, index) => {
    const at = `emergencyContacts.${index}`;
    need(`${at}.name`, contact.name, "Enter the name.");
    need(`${at}.relationship`, contact.relationship, "Enter the relationship.");
    need(`${at}.address`, contact.address, "Enter the address.");
    phone(`${at}.mobileNumber`, contact.mobileNumber, true);
    phone(`${at}.landNumber`, contact.landNumber, false);
  });

  need("bank.bank", details.bank.bank, "Enter the bank.");
  need("bank.branch", details.bank.branch, "Enter the branch.");
  if (!ACCOUNT_NUMBER.test(details.bank.accountNumber.trim())) {
    errors["bank.accountNumber"] = "Enter the account number as digits only, including any zeros at the start.";
  }
  need("highestQualification", details.highestQualification, "Enter your highest qualification.");
  need("university", details.university, "Enter your university.");
  if (details.githubUserId.trim() && !GITHUB_USER.test(details.githubUserId.trim())) {
    errors.githubUserId = "Enter a valid GitHub user ID, or leave it blank.";
  }
  return errors;
};

// The details as titled lines for the last step. The account number is hidden but for its last digits.
export const summarySectionsOf = (d: PersonalDetails): { title: string; rows: [string, string][] }[] => [
  {
    title: "Your details",
    rows: [
      ["Title", d.title],
      ["First name", d.firstName],
      ["Last name", d.surname],
      ["Full name (as on identity document)", d.fullName],
      ["Preferred name", d.preferredName],
      ["Initials", d.initials],
      ["Name with initials", d.nameWithInitials],
      ["Gender", d.gender],
      ["Date of birth", d.dateOfBirth],
      ["Identity document number", d.idNumber],
      ["Civil status", d.civilStatus],
      ["T-shirt size", d.tshirtSize],
      ["Personal email", d.personalEmail],
      ["Mobile number", d.mobileNumber],
      ["Land number", d.landNumber || "None"],
      ["Residential address", d.homeAddress],
      ["Temporary address", d.temporaryAddress || "None"],
      ["University", d.university],
      ["Interest in any commercial or business pursuit", d.businessInterest],
    ],
  },
  {
    title: "Dependants",
    rows: d.dependants.length
      ? d.dependants.map((person, index): [string, string] => [
          `${index + 1}. ${person.relationship}`,
          [person.name, person.dateOfBirth, person.idNumber].filter(Boolean).join(" · "),
        ])
      : [["None", ""]],
  },
  {
    title: "Emergency contacts",
    rows: d.emergencyContacts.map((contact, index): [string, string] => [
      `${index + 1}. ${contact.name} (${contact.relationship})`,
      [contact.address, contact.mobileNumber, contact.landNumber].filter(Boolean).join(" · "),
    ]),
  },
  {
    title: "Bank and education",
    rows: [
      ["Bank", `${d.bank.bank}, ${d.bank.branch}`],
      ["Account number", d.bank.accountNumber ? `•••• ${d.bank.accountNumber.slice(-4)}` : ""],
      ["Highest qualification", d.highestQualification],
      ["GitHub user ID", d.githubUserId || "None"],
    ],
  },
];

interface LabeledFieldProps {
  label: string;
  // Shows a * after the label.
  required?: boolean;
  // How many of the 12 parts of a row it takes on a wide screen; half a row when not given.
  span?: number;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}

// A label above its input, with a hint and the problem with the input below it.
const LabeledField = ({ label, required, span = 6, error, helper, children }: LabeledFieldProps) => (
  <Box sx={{ minWidth: 0, gridColumn: { md: `span ${span}` } }}>
    <Typography component="label" fontWeight={600} fontSize="0.95rem" color="text.primary" sx={{ display: "block", mb: 0.75 }}>
      {label}
      {required && (
        <Box component="span" aria-hidden sx={{ color: "error.main", ml: 0.5 }}>
          *
        </Box>
      )}
    </Typography>
    {children}
    {error ? (
      <Typography color="error" fontSize="0.8rem" mt={0.5}>
        {error}
      </Typography>
    ) : (
      helper && (
        <Typography color="text.secondary" fontSize="0.8rem" mt={0.5}>
          {helper}
        </Typography>
      )
    )}
  </Box>
);

// The rounded, tinted look of the inputs.
const inputSx = { "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "action.hover" } } as const;

interface InputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  span?: number;
  error?: string;
  helper?: string;
  disabled: boolean;
}

const TextInput = ({
  label,
  value,
  onChange,
  required,
  span,
  error,
  helper,
  disabled,
  type,
  placeholder,
  multiline,
  digitsOnly,
}: InputProps & { type?: string; placeholder?: string; multiline?: boolean; digitsOnly?: boolean }) => (
  <LabeledField label={label} required={required} span={span} error={error} helper={helper}>
    <TextField
      fullWidth
      size="small"
      value={value}
      onChange={(event) => onChange(digitsOnly ? event.target.value.replace(/\D/g, "") : event.target.value)}
      error={Boolean(error)}
      disabled={disabled}
      type={type}
      placeholder={placeholder}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      sx={inputSx}
      slotProps={{
        htmlInput: {
          "aria-label": label,
          "aria-required": required,
          ...(type === "date" ? { max: new Date().toISOString().slice(0, 10) } : {}),
          ...(digitsOnly ? { inputMode: "numeric" } : {}),
        },
      }}
    />
  </LabeledField>
);

const SelectInput = ({
  label,
  value,
  onChange,
  required,
  span,
  error,
  helper,
  disabled,
  options,
}: InputProps & { options: string[] }) => (
  <LabeledField label={label} required={required} span={span} error={error} helper={helper}>
    <TextField
      select
      fullWidth
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error)}
      disabled={disabled}
      sx={inputSx}
      slotProps={{ htmlInput: { "aria-label": label, "aria-required": required } }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  </LabeledField>
);

// The number in the format the backend accepts, or an empty text until both parts are filled in.
const phoneOf = (countryIso: string, national: string) => {
  const dialCode = COUNTRY_OPTIONS.find((option) => option.iso === countryIso)?.dialCode ?? "";
  return dialCode && national ? toE164(dialCode, national) : "";
};

// A country code to choose and the digits of the number, as in the application form. It starts from the number it is
// given, so it is made again (by its key) when a different number is loaded into it.
const PhoneInput = ({
  label,
  value,
  onChange,
  required,
  span,
  error,
  helper,
  disabled,
  defaultCountry,
}: InputProps & { defaultCountry: string }) => {
  const initial = splitE164(value);
  const [countryIso, setCountryIso] = useState(initial?.countryIso ?? defaultCountry);
  const [national, setNational] = useState(initial?.national ?? "");
  const change = (nextIso: string, nextNational: string) => {
    setCountryIso(nextIso);
    setNational(nextNational);
    onChange(phoneOf(nextIso, nextNational));
  };
  return (
    <LabeledField label={label} required={required} span={span} error={error} helper={helper}>
      <Box sx={{ display: "grid", gridTemplateColumns: "minmax(110px, 150px) 1fr", gap: 1 }}>
        <TextField
          select
          size="small"
          value={countryIso}
          onChange={(event) => change(event.target.value, national)}
          error={Boolean(error)}
          disabled={disabled}
          sx={inputSx}
          slotProps={{
            htmlInput: { "aria-label": `${label} country code` },
            select: {
              displayEmpty: true,
              MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
              renderValue: (iso) => COUNTRY_OPTIONS.find((option) => option.iso === iso)?.dialCode ?? "Code",
            },
          }}
        >
          {COUNTRY_OPTIONS.map((option) => (
            <MenuItem key={option.iso} value={option.iso}>
              {option.name} ({option.dialCode})
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          value={national}
          onChange={(event) => change(countryIso, event.target.value.replace(/\D/g, "").slice(0, 15))}
          error={Boolean(error)}
          disabled={disabled}
          sx={inputSx}
          slotProps={{ htmlInput: { inputMode: "numeric", "aria-label": label, "aria-required": required } }}
        />
      </Box>
    </LabeledField>
  );
};

interface SectionProps {
  // Left out for the first group, which continues from the top of the form.
  title?: string;
  note?: string;
  children: React.ReactNode;
}

// A group of inputs, two to a row on a wide screen, with a title when it has one.
const Section = ({ title, note, children }: SectionProps) => (
  <Box sx={{ p: 3, borderTop: "1px solid", borderColor: "divider", "&:first-of-type": { borderTop: 0 } }}>
    {title && (
      <Typography fontWeight={700} fontSize="1rem" color="text.primary">
        {title}
      </Typography>
    )}
    {note && (
      <Typography fontSize="0.85rem" color="text.secondary" mt={0.25}>
        {note}
      </Typography>
    )}
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" }, gap: 2.5, mt: title || note ? 2 : 0 }}>
      {children}
    </Box>
  </Box>
);

const fullWidth = { gridColumn: { md: "1 / -1" } } as const;

// The details that come from the application, and are listed rather than shown as inputs.
const APPLICATION_FIELDS = ["firstName", "surname", "gender", "mobileNumber", "university", "homeAddress"] as const;

// A person in a list, with a title and a button to remove them.
const ListItem = ({
  title,
  onRemove,
  canRemove,
  disabled,
  children,
}: {
  title: string;
  onRemove: () => void;
  canRemove: boolean;
  disabled: boolean;
  children: React.ReactNode;
}) => (
  <Box sx={{ ...fullWidth, p: 2, border: "1px solid", borderColor: "divider", borderRadius: "10px" }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
      <Typography fontWeight={600} fontSize="0.9rem" color="text.primary">
        {title}
      </Typography>
      {canRemove && (
        <Button size="small" startIcon={<Trash2 size={14} />} onClick={onRemove} disabled={disabled} sx={{ fontWeight: 600 }}>
          Remove
        </Button>
      )}
    </Stack>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" }, gap: 2.5 }}>{children}</Box>
  </Box>
);

interface PersonalDetailsFormProps {
  details: PersonalDetails;
  onChange: (next: PersonalDetails) => void;
  errors: DetailErrors;
  options: FormOptions;
  disabled: boolean;
}

// The details step: what the application already holds, listed first, then the rest of what HR keeps for every new
// employee. A * marks what is required.
const PersonalDetailsForm = ({ details, onChange, errors, options, disabled }: PersonalDetailsFormProps) => {
  // Raised when someone is removed from a list, so that the inputs of the people after them are made again.
  const [listVersion, setListVersion] = useState(0);
  // What the application holds is listed, and opened for editing only when something is missing, a problem is shown
  // with it, or the candidate asks to edit it.
  const [editingApplication, setEditingApplication] = useState(() => APPLICATION_FIELDS.some((key) => !details[key].trim()));
  useEffect(() => {
    if (APPLICATION_FIELDS.some((key) => errors[key])) setEditingApplication(true);
  }, [errors]);

  const update = (patch: Partial<PersonalDetails>) => onChange({ ...details, ...patch });
  const defaultCountry = splitE164(details.mobileNumber)?.countryIso ?? "";

  const setDependant = (index: number, patch: Partial<Dependant>) =>
    update({ dependants: details.dependants.map((item, at) => (at === index ? { ...item, ...patch } : item)) });
  const setContact = (index: number, patch: Partial<EmergencyContact>) =>
    update({ emergencyContacts: details.emergencyContacts.map((item, at) => (at === index ? { ...item, ...patch } : item)) });

  return (
    <Box>
      <Section>
        <SelectInput label="Title" required span={3} value={details.title} options={options.titles} onChange={(v) => update({ title: v })} error={errors.title} disabled={disabled} />
        <TextInput label="Full name (as on identity document)" required span={9} value={details.fullName} onChange={(v) => update({ fullName: v })} error={errors.fullName} disabled={disabled} />
        <TextInput label="Preferred name" required span={4} value={details.preferredName} onChange={(v) => update({ preferredName: v })} error={errors.preferredName} disabled={disabled} />
        <TextInput label="Initials" required span={3} value={details.initials} onChange={(v) => update({ initials: v })} error={errors.initials} disabled={disabled} />
        <TextInput label="Name with initials" required span={5} value={details.nameWithInitials} onChange={(v) => update({ nameWithInitials: v })} error={errors.nameWithInitials} disabled={disabled} />
        {editingApplication ? (
          <>
            <TextInput label="First name" required value={details.firstName} onChange={(v) => update({ firstName: v })} error={errors.firstName} disabled={disabled} />
            <TextInput label="Last name" required value={details.surname} onChange={(v) => update({ surname: v })} error={errors.surname} disabled={disabled} />
            <SelectInput label="Gender" required span={4} value={details.gender} options={options.genders} onChange={(v) => update({ gender: v })} error={errors.gender} disabled={disabled} />
            <PhoneInput
              label="Mobile number"
              required
              span={8}
              value={details.mobileNumber}
              onChange={(v) => update({ mobileNumber: v })}
              error={errors.mobileNumber}
              disabled={disabled}
              defaultCountry={defaultCountry}
            />
            <TextInput label="University" required value={details.university} onChange={(v) => update({ university: v })} error={errors.university} disabled={disabled} />
            <LabeledField label="Personal email" required>
              <Typography fontSize="0.95rem" color="text.primary" sx={{ wordBreak: "break-word", py: 0.75 }}>
                {details.personalEmail}
              </Typography>
            </LabeledField>
            <Box sx={fullWidth}>
              <TextInput label="Residential address" required value={details.homeAddress} onChange={(v) => update({ homeAddress: v })} error={errors.homeAddress} disabled={disabled} />
            </Box>
          </>
        ) : (
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} sx={fullWidth}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "200px 1fr" }, rowGap: 1, columnGap: 2, minWidth: 0 }}>
              {(
                [
                  ["First name", details.firstName],
                  ["Last name", details.surname],
                  ["Gender", details.gender],
                  ["Personal email", details.personalEmail],
                  ["Mobile number", details.mobileNumber],
                  ["University", details.university],
                  ["Residential address", details.homeAddress],
                ] as [string, string][]
              ).map(([label, value]) => (
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
            <Button size="small" startIcon={<Pencil size={14} />} onClick={() => setEditingApplication(true)} disabled={disabled} sx={{ fontWeight: 600 }}>
              Edit
            </Button>
          </Stack>
        )}

        <TextInput label="Date of birth" required span={3} type="date" value={details.dateOfBirth} onChange={(v) => update({ dateOfBirth: v })} error={errors.dateOfBirth} disabled={disabled} />
        <TextInput label="Identity document number" required span={4} value={details.idNumber} onChange={(v) => update({ idNumber: v })} error={errors.idNumber} disabled={disabled} />
        <SelectInput label="Civil status" required span={3} value={details.civilStatus} options={options.civilStatuses} onChange={(v) => update({ civilStatus: v })} error={errors.civilStatus} disabled={disabled} />
        <SelectInput label="T-shirt size" required span={2} value={details.tshirtSize} options={options.tshirtSizes} onChange={(v) => update({ tshirtSize: v })} error={errors.tshirtSize} disabled={disabled} />
        <PhoneInput
          label="Land number"
          value={details.landNumber}
          onChange={(v) => update({ landNumber: v })}
          error={errors.landNumber}
          disabled={disabled}
          defaultCountry={defaultCountry}
        />
        <SelectInput
          label="Interest in any commercial or business pursuit"
          required
          span={3}
          value={details.businessInterest}
          options={YES_NO}
          onChange={(v) => update({ businessInterest: v })}
          error={errors.businessInterest}
          disabled={disabled}
        />
        <TextInput label="Temporary address" span={12} value={details.temporaryAddress} onChange={(v) => update({ temporaryAddress: v })} disabled={disabled} />
      </Section>

      <Section title="Dependants" note="For the insurance policy, for permanent employees. If you are single, add your parents.">
        {details.dependants.map((person, index) => (
          <ListItem
            key={`${listVersion}-dependant-${index}`}
            title={`Dependant ${index + 1}`}
            canRemove
            disabled={disabled}
            onRemove={() => {
              update({ dependants: details.dependants.filter((_, at) => at !== index) });
              setListVersion((current) => current + 1);
            }}
          >
            <SelectInput label="Relationship" required span={4} value={person.relationship} options={options.dependantRelationships} onChange={(v) => setDependant(index, { relationship: v })} error={errors[`dependants.${index}.relationship`]} disabled={disabled} />
            <TextInput label="Name" required span={8} value={person.name} onChange={(v) => setDependant(index, { name: v })} error={errors[`dependants.${index}.name`]} disabled={disabled} />
            <TextInput label="Date of birth" required span={4} type="date" value={person.dateOfBirth} onChange={(v) => setDependant(index, { dateOfBirth: v })} error={errors[`dependants.${index}.dateOfBirth`]} disabled={disabled} />
            <TextInput label="NIC or passport number" span={8} value={person.idNumber} onChange={(v) => setDependant(index, { idNumber: v })} error={errors[`dependants.${index}.idNumber`]} disabled={disabled} />
          </ListItem>
        ))}
        {details.dependants.length < options.maxDependants && (
          <Box sx={fullWidth}>
            <Button
              startIcon={<Plus size={16} />}
              variant="outlined"
              disabled={disabled}
              onClick={() => update({ dependants: [...details.dependants, emptyDependant()] })}
              sx={pillButtonSx}
            >
              Add a dependant
            </Button>
          </Box>
        )}
      </Section>

      <Section title="Emergency contacts" note="Give at least two people we can call in an emergency.">
        {errors.emergencyContacts && (
          <Typography color="error" fontSize="0.85rem" sx={fullWidth}>
            {errors.emergencyContacts}
          </Typography>
        )}
        {details.emergencyContacts.map((contact, index) => (
          <ListItem
            key={`${listVersion}-contact-${index}`}
            title={`Emergency contact ${index + 1}`}
            canRemove={details.emergencyContacts.length > 2}
            disabled={disabled}
            onRemove={() => {
              update({ emergencyContacts: details.emergencyContacts.filter((_, at) => at !== index) });
              setListVersion((current) => current + 1);
            }}
          >
            <TextInput label="Name" required value={contact.name} onChange={(v) => setContact(index, { name: v })} error={errors[`emergencyContacts.${index}.name`]} disabled={disabled} />
            <TextInput label="Relationship" required value={contact.relationship} onChange={(v) => setContact(index, { relationship: v })} error={errors[`emergencyContacts.${index}.relationship`]} disabled={disabled} />
            <Box sx={fullWidth}>
              <TextInput label="Address" required value={contact.address} onChange={(v) => setContact(index, { address: v })} error={errors[`emergencyContacts.${index}.address`]} disabled={disabled} />
            </Box>
            <PhoneInput label="Mobile number" required value={contact.mobileNumber} onChange={(v) => setContact(index, { mobileNumber: v })} error={errors[`emergencyContacts.${index}.mobileNumber`]} disabled={disabled} defaultCountry={defaultCountry} />
            <PhoneInput label="Land number" value={contact.landNumber} onChange={(v) => setContact(index, { landNumber: v })} error={errors[`emergencyContacts.${index}.landNumber`]} disabled={disabled} defaultCountry={defaultCountry} />
          </ListItem>
        ))}
        {details.emergencyContacts.length < options.maxEmergencyContacts && (
          <Box sx={fullWidth}>
            <Button
              startIcon={<Plus size={16} />}
              variant="outlined"
              disabled={disabled}
              onClick={() => update({ emergencyContacts: [...details.emergencyContacts, emptyContact()] })}
              sx={pillButtonSx}
            >
              Add an emergency contact
            </Button>
          </Box>
        )}
      </Section>

      <Section title="Bank details" note="The account your salary should be paid into.">
        <TextInput label="Bank" required span={4} value={details.bank.bank} onChange={(v) => update({ bank: { ...details.bank, bank: v } })} error={errors["bank.bank"]} disabled={disabled} />
        <TextInput label="Branch" required span={4} value={details.bank.branch} onChange={(v) => update({ bank: { ...details.bank, branch: v } })} error={errors["bank.branch"]} disabled={disabled} />
        <TextInput
          label="Account number"
          required
          span={4}
          value={details.bank.accountNumber}
          onChange={(v) => update({ bank: { ...details.bank, accountNumber: v } })}
          error={errors["bank.accountNumber"]}
          digitsOnly
          disabled={disabled}
        />
      </Section>

      <Section title="Education and work">
        <TextInput
          label="Highest qualification"
          required
          span={8}
          value={details.highestQualification}
          onChange={(v) => update({ highestQualification: v })}
          error={errors.highestQualification}
          disabled={disabled}
        />
        <TextInput
          label="GitHub user ID"
          span={4}
          value={details.githubUserId}
          onChange={(v) => update({ githubUserId: v })}
          error={errors.githubUserId}
          disabled={disabled}
        />
      </Section>
    </Box>
  );
};

export default PersonalDetailsForm;
