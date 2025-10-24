// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
  Typography,
  TextField,
  Paper,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import { useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CodeIcon from "@mui/icons-material/Code";
import TranslateIcon from "@mui/icons-material/Translate";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import { Formik, Form, FieldArray } from "formik";

import { useAppDispatch, useAppSelector } from "@slices/store";
import { createApplicant } from "@slices/applicantSlice/applicant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useConfirmationModalContext } from "@context/DialogContext";
import { fileToBase64 } from "@utils/utils";
import { useTheme } from "@mui/material/styles";
import * as yup from "yup";
import { State, ConfirmationType } from "@/types/types";
import { SnackMessage } from "@root/src/config/constant";

import ExperienceModal, { Experience } from "@modals/ExperienceModal";
import EducationModal, { Education } from "@modals/EducationModal";
import CertificationModal, { Certification } from "@modals/CertificationModal";
import ProjectModal, { Project } from "@modals/ProjectModal";
import LanguageModal, { Language } from "@modals/LanguageModal";
interface ApplicantFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  address: string;
  professionalLinks: Record<string, string>;
  experiences: Experience[];
  educations: Education[];
  certifications: Certification[];
  projects: Project[];
  languages: Language[];
  skills: string[];
  interests: string[];
  skillsText: string;
  interestsText: string;
  consentData: boolean;
  consentEmails: boolean;
}

const initialValues: ApplicantFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  country: "",
  address: "",
  professionalLinks: {
    LinkedIn: "",
    GitHub: "",
    Portfolio: "",
    GitLab: "",
    Bitbucket: "",
    HackerRank: "",
    LeetCode: "",
    Medium: "",
    StackOverflow: "",
    Devto: "",
  },
  experiences: [],
  educations: [],
  certifications: [],
  projects: [],
  languages: [],
  skills: [],
  interests: [],
  skillsText: "",
  interestsText: "",
  consentData: false,
  consentEmails: false,
};

type SectionKey =
  | "experience"
  | "education"
  | "certification"
  | "project"
  | "language";

type SectionItem = Experience | Education | Certification | Project | Language;

type SectionArray<T> = T extends "experience"
  ? Experience[]
  : T extends "education"
  ? Education[]
  : T extends "certification"
  ? Certification[]
  : T extends "project"
  ? Project[]
  : T extends "language"
  ? Language[]
  : never;

const mainValidationSchema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
  country: yup.string().required("Country is required"),
  address: yup.string().required("Address is required"),
  consentData: yup.boolean().oneOf([true], "You must accept data consent"),
  consentEmails: yup.boolean().oneOf([true], "You must accept email consent"),
});

export default function CreateApplicant() {
  const theme = useTheme();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [openModal, setOpenModal] = useState<
    "experience" | "education" | "certification" | "project" | "language" | null
  >(null);
  const [editingSection, setEditingSection] = useState<
    "experience" | "education" | "certification" | "project" | "language" | null
  >(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<SectionItem | null>(null);

  const handleOpenForEdit = <K extends SectionKey>(
    sectionKey: K,
    item: SectionArray<K>[number],
    idx: number
  ) => {
    setEditingSection(sectionKey);
    setEditingIndex(idx);
    setEditingItem(item);
    setOpenModal(sectionKey);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setEditingSection(null);
    setEditingIndex(null);
    setEditingItem(null);
  };

  const dispatch = useAppDispatch();
  const { state } = useAppSelector((s) => s.applicant);
  const { showConfirmation } = useConfirmationModalContext();

  const sectionIcons: Record<string, JSX.Element> = {
    experience: <WorkIcon sx={{ color: theme.palette.brand.orange, mr: 1 }} />,
    education: <SchoolIcon sx={{ color: theme.palette.brand.orange, mr: 1 }} />,
    certification: (
      <WorkspacePremiumIcon sx={{ color: theme.palette.brand.orange, mr: 1 }} />
    ),
    project: <CodeIcon sx={{ color: theme.palette.brand.orange, mr: 1 }} />,
    language: (
      <TranslateIcon sx={{ color: theme.palette.brand.orange, mr: 1 }} />
    ),
  };

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Typography
        variant="h3"
        fontWeight="bold"
        color={theme.palette.brand.orangeDark}
        gutterBottom
        align="center"
        fontStyle="italic"
      >
        Share your CV with us...
      </Typography>
      <Typography
        variant="h5"
        color="text.secondary"
        maxWidth="80%"
        align="center"
        sx={{ mx: "auto", mb: 6 }}
      >
        Help us get to know you better by sharing your resume.
      </Typography>

      {/* Main Formik Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={mainValidationSchema}
        onSubmit={async (values, { resetForm }) => {
          const base64Profile = profilePhoto
            ? await fileToBase64(profilePhoto)
            : undefined;
          const base64Resume = resumeFile
            ? await fileToBase64(resumeFile)
            : undefined;

          const payload = {
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone: values.phone,
            address: values.address,
            country: values.country,
            status: "active",
            professional_links: Object.entries(values.professionalLinks)
              .map(([title, link]) => ({ title: title.toLowerCase(), link }))
              .filter((l) => l.link),
            educations: values.educations,
            experiences: values.experiences,
            certifications: values.certifications,
            projects: values.projects.map((proj) => ({
              ...proj,
              technologies: proj.technologies
                .split(",")
                .map((t: string) => t.trim())
                .filter((t: string) => t.length > 0),
            })),
            languages: values.languages,
            skills: values.skillsText
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0),
            interests: values.interestsText
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0),

            base64_profile_photo: base64Profile,
            profile_photo_file_name: profilePhoto?.name,
            base64_cv: base64Resume,
            cv_file_name: resumeFile?.name,
          };

          await dispatch(createApplicant(payload)).unwrap();
          resetForm();
          setResumeFile(null);
          setProfilePhoto(null);
        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          touched,
          errors,
          setFieldValue,
          isSubmitting,
          isValid,
          handleSubmit,
        }) => (
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isValid) {
                dispatch(
                  enqueueSnackbarMessage({
                    message: SnackMessage.error.formValidation,
                    type: "error",
                  })
                );
                return;
              }
              showConfirmation(
                "Confirm Submission",
                "Are you sure you want to create your applicant profile? Please verify your details before saving.",
                ConfirmationType.send,
                () => handleSubmit(e),
                "Yes, Create",
                "Cancel"
              );
            }}
          >
            {/* Profile Photo Upload */}
            <Box display="flex" justifyContent="center" mb={5}>
              <Box position="relative" display="inline-block">
                <Avatar
                  src={
                    profilePhoto
                      ? URL.createObjectURL(profilePhoto)
                      : values.firstName
                      ? values.firstName[0].toUpperCase()
                      : ""
                  }
                  alt={
                    values.firstName
                      ? values.firstName.toUpperCase()
                      : "Profile Photo"
                  }
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: theme.palette.brand.orange + "20",
                    fontSize: 40,
                  }}
                />

                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    bgcolor: theme.palette.background.default,
                    boxShadow: 2,
                    "&:hover": { bgcolor: theme.palette.grey[200] },
                  }}
                >
                  <PhotoCameraIcon sx={{ color: theme.palette.brand.orange }} />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) =>
                      setProfilePhoto(e.target.files?.[0] || null)
                    }
                  />
                </IconButton>
              </Box>
            </Box>

            {/* CV Upload */}
            <Paper
              variant="outlined"
              sx={{
                border: `2px dashed ${theme.palette.brand.orange}`,
                p: 5,
                textAlign: "center",
                mb: 5,
              }}
            >
              <CloudUploadIcon
                sx={{ fontSize: 50, color: theme.palette.brand.orange, mb: 2 }}
              />
              <Typography color="text.secondary" mb={2}>
                Supported formats: PDF, Word
              </Typography>
              <Button
                variant="text"
                component="label"
                sx={{
                  color: theme.palette.brand.orangeDark,
                  fontWeight: "bold",
                }}
              >
                Drag & drop files or Browse
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
              </Button>
              {resumeFile && (
                <Typography mt={2} fontSize={14}>
                  {resumeFile.name}
                </Typography>
              )}
            </Paper>
            <Paper
              sx={{
                p: 4,
                borderRadius: 3,
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Personal Info
              </Typography>
              <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName && Boolean(errors.firstName)}
                    helperText={touched.firstName && errors.firstName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName && Boolean(errors.lastName)}
                    helperText={touched.lastName && errors.lastName}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={values.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.country && Boolean(errors.country)}
                    helperText={touched.country && errors.country}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.address && Boolean(errors.address)}
                    helperText={touched.address && errors.address}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Professional Links */}
              <Typography variant="h6" fontWeight="bold" mb={2}>
                Professional Links
              </Typography>
              <Grid container spacing={2} mb={3}>
                {Object.keys(values.professionalLinks).map((platform) => (
                  <Grid item xs={12} sm={4} key={platform}>
                    <TextField
                      fullWidth
                      label={platform}
                      name={`professionalLinks.${platform}`}
                      value={values.professionalLinks[platform]}
                      onChange={handleChange}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Sections with Add buttons */}
              {[
                { key: "experience", label: "Experience" },
                { key: "education", label: "Education" },
                { key: "certification", label: "Certifications" },
                { key: "project", label: "Projects" },
                { key: "language", label: "Languages" },
              ].map((sec) => {
                const sectionKey = sec.key as SectionKey;
                const items = values[
                  `${sectionKey}s` as keyof ApplicantFormValues
                ] as SectionArray<SectionKey>;

                return (
                  <Box key={sectionKey} sx={{ py: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography fontWeight="bold">{sec.label}</Typography>
                      <Button
                        variant="text"
                        sx={{
                          color: theme.palette.brand.orange,
                          fontWeight: "bold",
                          border: `1px solid ${theme.palette.brand.orange}`,
                          borderRadius: 1,
                        }}
                        onClick={() => setOpenModal(sectionKey)}
                      >
                        + Add
                      </Button>
                    </Box>

                    {/* Preview list */}
                    {items && items.length > 0 && (
                      <Box mt={2} display="grid" gap={2}>
                        {items.map((item, idx) => {
                          // Determine the title field for the preview header
                          const title =
                            "job_title" in item
                              ? item.job_title
                              : "degree" in item
                              ? item.degree
                              : "name" in item
                              ? item.name
                              : "name" in item
                              ? item.name
                              : "language" in item
                              ? item.language
                              : "Entry";

                          return (
                            <Paper key={idx} className="preview-card">
                              {/* Header with Icon */}
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={1}
                              >
                                <Box display="flex" alignItems="center">
                                  {sectionIcons[sectionKey]}
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                    color="primary"
                                  >
                                    {String(title)}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Details in Grid */}
                              <Grid container spacing={1}>
                                {Object.entries(item).map(([field, value]) =>
                                  value ? (
                                    <Grid item xs={12} sm={6} key={field}>
                                      <Typography
                                        variant="body2"
                                        sx={{ color: "text.secondary" }}
                                      >
                                        <strong
                                          style={{
                                            textTransform: "capitalize",
                                          }}
                                        >
                                          {field.replace(/_/g, " ")}:
                                        </strong>{" "}
                                        {String(value)}
                                      </Typography>
                                    </Grid>
                                  ) : null
                                )}
                              </Grid>

                              {/* Edit / Delete */}
                              <Box
                                display="flex"
                                justifyContent="flex-end"
                                alignItems="center"
                                mt={1}
                              >
                                <Box display="flex" gap={1}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      color="primary"
                                      size="small"
                                      onClick={() =>
                                        handleOpenForEdit(sectionKey, item, idx)
                                      }
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Remove">
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() =>
                                        setFieldValue(
                                          `${sectionKey}s`,
                                          (items as SectionItem[]).filter(
                                            (_, i) => i !== idx
                                          )
                                        )
                                      }
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}
                  </Box>
                );
              })}

              <Divider sx={{ my: 3 }} />

              {/* Skills */}
              <Box mt={3}>
                <Typography fontWeight="bold" mb={1}>
                  Skills
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  placeholder="Enter skills separated by commas."
                  name="skillsText"
                  value={values.skillsText}
                  onChange={handleChange}
                />
                {touched.skillsText && errors.skillsText && (
                  <Typography variant="caption" color="error">
                    {errors.skillsText as string}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Interests */}
              <Box mt={3}>
                <Typography fontWeight="bold" mb={1}>
                  Interests
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={1}
                  placeholder="Enter interests separated by commas."
                  name="interestsText"
                  value={values.interestsText}
                  onChange={handleChange}
                />
                {touched.interestsText && errors.interestsText && (
                  <Typography variant="caption" color="error">
                    {errors.interestsText as string}
                  </Typography>
                )}
              </Box>

              {/* Resume consent */}
              <Box mt={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="consentData"
                      checked={values.consentData}
                      onChange={handleChange}
                    />
                  }
                  label="Yes, I give WSO2 permission to use my personal data for recruitment purposes only."
                />
                {touched.consentData && errors.consentData && (
                  <Typography variant="caption" color="error">
                    {errors.consentData}
                  </Typography>
                )}
                <FormControlLabel
                  control={
                    <Checkbox
                      name="consentEmails"
                      checked={values.consentEmails}
                      onChange={handleChange}
                    />
                  }
                  label="I would like to receive emails from WSO2 about updates."
                />
                {touched.consentEmails && errors.consentEmails && (
                  <Typography variant="caption" color="error">
                    {errors.consentEmails}
                  </Typography>
                )}
              </Box>

              {/* Save Button */}
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={state === State.loading || isSubmitting}
                  sx={{
                    bgcolor: theme.palette.brand.orange,
                    "&:hover": { bgcolor: theme.palette.brand.orangeDark },
                  }}
                >
                  {state === State.loading ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Paper>

            {/* Modals */}
            <FieldArray name="experiences">
              {({ push, replace }) => (
                <ExperienceModal
                  open={openModal === "experience"}
                  onClose={handleCloseModal}
                  push={push}
                  replace={replace}
                  editItem={
                    editingSection === "experience"
                      ? (editingItem as Experience)
                      : undefined
                  }
                  editIndex={
                    editingSection === "experience" ? editingIndex : null
                  }
                />
              )}
            </FieldArray>
            <FieldArray name="educations">
              {({ push, replace }) => (
                <EducationModal
                  open={openModal === "education"}
                  onClose={handleCloseModal}
                  push={push}
                  replace={replace}
                  editItem={
                    editingSection === "education"
                      ? (editingItem as Education)
                      : undefined
                  }
                  editIndex={
                    editingSection === "education" ? editingIndex : null
                  }
                />
              )}
            </FieldArray>
            <FieldArray name="certifications">
              {({ push, replace }) => (
                <CertificationModal
                  open={openModal === "certification"}
                  onClose={handleCloseModal}
                  push={push}
                  replace={replace}
                  editItem={
                    editingSection === "certification"
                      ? (editingItem as Certification)
                      : undefined
                  }
                  editIndex={
                    editingSection === "certification" ? editingIndex : null
                  }
                />
              )}
            </FieldArray>
            <FieldArray name="projects">
              {({ push, replace }) => (
                <ProjectModal
                  open={openModal === "project"}
                  onClose={handleCloseModal}
                  push={push}
                  replace={replace}
                  editItem={
                    editingSection === "project"
                      ? (editingItem as Project)
                      : undefined
                  }
                  editIndex={
                    editingSection === "certification" ? editingIndex : null
                  }
                />
              )}
            </FieldArray>
            <FieldArray name="projects">
              {({ push, replace }) => (
                <ProjectModal
                  open={openModal === "project"}
                  onClose={handleCloseModal}
                  push={push}
                  replace={replace}
                  editItem={
                    editingSection === "project"
                      ? (editingItem as Project)
                      : undefined
                  }
                  editIndex={editingSection === "project" ? editingIndex : null}
                />
              )}
            </FieldArray>
            <FieldArray name="languages">
              {({ push, replace }) => (
                <LanguageModal
                  open={openModal === "language"}
                  onClose={handleCloseModal}
                  push={push}
                  replace={replace}
                  editItem={
                    editingSection === "language"
                      ? (editingItem as Language)
                      : undefined
                  }
                  editIndex={
                    editingSection === "language" ? editingIndex : null
                  }
                />
              )}
            </FieldArray>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
