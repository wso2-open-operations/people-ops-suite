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
  Divider,
  IconButton,
  Avatar,
  Stack,
} from "@mui/material";
import { useState, useEffect } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CodeIcon from "@mui/icons-material/Code";
import TranslateIcon from "@mui/icons-material/Translate";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

import { Formik, Form, FieldArray } from "formik";

import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  updateApplicant,
  ApplicantProfile,
} from "@slices/applicantSlice/applicant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useConfirmationModalContext } from "@context/DialogContext";
import { fileToByteArray } from "@utils/utils";
import {
  getImageDataUrl,
  viewPdfInNewTab,
  isValidByteArray,
} from "@utils/utils";
import { useTheme } from "@mui/material/styles";
import * as yup from "yup";
import { State, ConfirmationType } from "@/types/types";
import { SnackMessage } from "@root/src/config/constant";

import ExperienceModal, { Experience } from "@modals/ExperienceModal";
import EducationModal, { Education } from "@modals/EducationModal";
import CertificationModal, { Certification } from "@modals/CertificationModal";
import ProjectModal, { Project } from "@modals/ProjectModal";
import LanguageModal, { Language } from "@modals/LanguageModal";
import PreLoader from "@component/common/PreLoader";

interface EditApplicantFormValues {
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
}

interface ProfessionalLink {
  title: string;
  link: string;
}

interface ProjectPayload {
  name: string;
  description: string;
  technologies: string[];
  github: string;
}

interface UpdateApplicantPayload {
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  country: string;
  professional_links: ProfessionalLink[];
  educations: Education[];
  experiences: Experience[];
  certifications: Certification[];
  projects: ProjectPayload[];
  languages: Language[];
  skills: string[];
  interests: string[];
  user_thumbnail?: number[];
  profile_photo_file_name?: string;
  resume_link?: number[];
  cv_file_name?: string;
}

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

const editValidationSchema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
  country: yup.string().required("Country is required"),
  address: yup.string().required("Address is required"),
});

interface EditApplicantProps {
  applicant: ApplicantProfile;
  onCancel: () => void;
}

export default function EditApplicant({
  applicant,
  onCancel,
}: EditApplicantProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { showConfirmation } = useConfirmationModalContext();

  const { state } = useAppSelector((s) => s.applicant);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [openModal, setOpenModal] = useState<SectionKey | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<SectionItem | null>(null);

  // Show preloader when updating
  if (state === State.loading) {
    return <PreLoader message="Updating applicant profile..." isLoading />;
  }

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

  // Convert professional_links array to object
  const professionalLinksObj: Record<string, string> = {};
  const linkTypes = [
    "LinkedIn",
    "GitHub",
    "Portfolio",
    "GitLab",
    "Bitbucket",
    "HackerRank",
    "LeetCode",
    "Medium",
    "StackOverflow",
    "Devto",
  ];

  linkTypes.forEach((type) => {
    const found = applicant.professional_links?.find(
      (l) => l.title.toLowerCase() === type.toLowerCase()
    );
    professionalLinksObj[type] = found?.link || "";
  });

  const initialValues: EditApplicantFormValues = {
    firstName: applicant.first_name,
    lastName: applicant.last_name,
    phone: applicant.phone,
    email: applicant.email,
    country: applicant.country,
    address: applicant.address,
    professionalLinks: professionalLinksObj,
    experiences: (applicant.experiences || []) as Experience[],
    educations: (applicant.educations || []) as Education[],
    certifications: (applicant.certifications || []) as Certification[],
    projects: (applicant.projects || []).map((p) => ({
      ...p,
      technologies: p.technologies?.join(", ") || "",
    })) as Project[],
    languages: (applicant.languages || []) as Language[],
    skills: applicant.skills || [],
    interests: applicant.interests || [],
    skillsText: (applicant.skills || []).join(", "),
    interestsText: (applicant.interests || []).join(", "),
  };

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
    <Box sx={{ maxWidth: 1400, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Formik
        initialValues={initialValues}
        validationSchema={editValidationSchema}
        onSubmit={async (values, { setSubmitting }) => {
          const byteArrayProfile = profilePhoto
            ? await fileToByteArray(profilePhoto)
            : undefined;
          const byteArrayResume = resumeFile
            ? await fileToByteArray(resumeFile)
            : undefined;

          const payload: UpdateApplicantPayload = {
            first_name: values.firstName,
            last_name: values.lastName,
            phone: values.phone,
            address: values.address,
            country: values.country,
            professional_links: Object.entries(values.professionalLinks)
              .map(([title, link]) => ({ title: title.toLowerCase(), link }))
              .filter((l) => l.link),
            educations: values.educations,
            experiences: values.experiences,
            certifications: values.certifications,
            projects: values.projects.map((proj) => ({
              ...proj,
              technologies:
                typeof proj.technologies === "string"
                  ? proj.technologies
                      .split(",")
                      .map((t: string) => t.trim())
                      .filter((t: string) => t.length > 0)
                  : proj.technologies,
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
          };

          if (byteArrayProfile) {
            payload.user_thumbnail = byteArrayProfile;
            payload.profile_photo_file_name = profilePhoto?.name;
          }
          if (byteArrayResume) {
            payload.resume_link = byteArrayResume;
            payload.cv_file_name = resumeFile?.name;
          }

          try {
            await dispatch(
              updateApplicant({ email: applicant.email, payload })
            ).unwrap();
            onCancel(); // Switch back to view mode
          } catch (error) {
            // Error handling is done in the thunk
          } finally {
            setSubmitting(false);
          }
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
                "Confirm Update",
                "Are you sure you want to update your profile? Please verify your changes before saving.",
                ConfirmationType.update,
                () => handleSubmit(e),
                "Yes, Update",
                "Cancel"
              );
            }}
          >
            <Paper
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              {/* Form Title */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={4}
              >
                <Typography
                  variant="h2"
                  fontWeight="bold"
                  color={theme.palette.brand.orangeDark}
                >
                  Edit Your Profile
                </Typography>
                <Button
                  onClick={onCancel}
                  startIcon={<CancelIcon />}
                  variant="outlined"
                  color="inherit"
                >
                  Cancel
                </Button>
              </Box>

              {/* Profile Photo Upload Section */}
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mb={4}
              >
                <Box position="relative" display="inline-block">
                  <Avatar
                    src={
                      profilePhoto
                        ? URL.createObjectURL(profilePhoto)
                        : getImageDataUrl(applicant.user_thumbnail)
                    }
                    alt={`${values.firstName} ${values.lastName}`}
                    sx={{
                      width: 140,
                      height: 140,
                      bgcolor: theme.palette.brand.orange,
                      fontSize: 48,
                      fontWeight: 600,
                      border: `4px solid ${theme.palette.brand.orange}40`,
                      boxShadow: `0 8px 24px ${theme.palette.brand.orange}20`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: `0 12px 32px ${theme.palette.brand.orange}30`,
                      },
                    }}
                  >
                    {values.firstName?.[0]?.toUpperCase()}
                  </Avatar>

                  <IconButton
                    component="label"
                    sx={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      bgcolor: theme.palette.brand.orange,
                      color: "white",
                      "&:hover": {
                        bgcolor: theme.palette.brand.orangeDark,
                      },
                      boxShadow: 2,
                    }}
                  >
                    <PhotoCameraIcon />
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProfilePhoto(e.target.files[0]);
                        }
                      }}
                    />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  {profilePhoto
                    ? `New photo: ${profilePhoto.name}`
                    : "Click camera icon to change photo"}
                </Typography>
              </Box>

              {/* Basic Information Section */}
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Basic Information
              </Typography>
              <Grid container spacing={3} mb={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.firstName && Boolean(errors.firstName)}
                    helperText={touched.firstName && errors.firstName}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.lastName && Boolean(errors.lastName)}
                    helperText={touched.lastName && errors.lastName}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={values.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    name="phone"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={values.country}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.country && Boolean(errors.country)}
                    helperText={touched.country && errors.country}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={values.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.address && Boolean(errors.address)}
                    helperText={touched.address && errors.address}
                    required
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Professional Links Section */}
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Professional Links
              </Typography>
              <Grid container spacing={3} mb={4}>
                {Object.keys(values.professionalLinks).map((linkType) => (
                  <Grid item xs={12} md={6} key={linkType}>
                    <TextField
                      fullWidth
                      label={linkType}
                      name={`professionalLinks.${linkType}`}
                      value={values.professionalLinks[linkType]}
                      onChange={handleChange}
                      placeholder={`Enter your ${linkType} URL`}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Resume Upload Section */}
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Resume / CV
              </Typography>
              <Box mb={4}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ mb: 2 }}
                >
                  {resumeFile ? "Change Resume" : "Upload New Resume"}
                  <input
                    type="file"
                    hidden
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResumeFile(e.target.files[0]);
                      }
                    }}
                  />
                </Button>
                {resumeFile && (
                  <Typography variant="body2" color="success.main">
                    New resume selected: {resumeFile.name}
                  </Typography>
                )}
                {!resumeFile && isValidByteArray(applicant.resume_link) && (
                  <Typography variant="body2" color="text.secondary">
                    Current resume on file.{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        viewPdfInNewTab(applicant.resume_link);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      View
                    </a>
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Experience Section */}
              <FieldArray name="experiences">
                {({ push, remove }) => (
                  <>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Box display="flex" alignItems="center">
                        {sectionIcons.experience}
                        <Typography variant="h5" fontWeight="bold">
                          Work Experience
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setOpenModal("experience")}
                        sx={{
                          bgcolor: theme.palette.brand.orange,
                          "&:hover": {
                            bgcolor: theme.palette.brand.orangeDark,
                          },
                        }}
                      >
                        Add Experience
                      </Button>
                    </Box>
                    <Grid container spacing={2} mb={4}>
                      {values.experiences.map((exp, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="start"
                            >
                              <Box flex={1}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {exp.job_title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {exp.company} • {exp.location}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {exp.start_date} - {exp.end_date || "Present"}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleOpenForEdit("experience", exp, idx)
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(idx)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <ExperienceModal
                      open={openModal === "experience"}
                      onClose={handleCloseModal}
                      push={push}
                      replace={(index, value) =>
                        setFieldValue(`experiences.${index}`, value)
                      }
                      editItem={
                        editingSection === "experience" && editingItem
                          ? (editingItem as Experience)
                          : undefined
                      }
                      editIndex={
                        editingSection === "experience" ? editingIndex : null
                      }
                    />
                  </>
                )}
              </FieldArray>

              <Divider sx={{ my: 4 }} />

              {/* Education Section */}
              <FieldArray name="educations">
                {({ push, remove }) => (
                  <>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Box display="flex" alignItems="center">
                        {sectionIcons.education}
                        <Typography variant="h5" fontWeight="bold">
                          Education
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setOpenModal("education")}
                        sx={{
                          bgcolor: theme.palette.brand.orange,
                          "&:hover": {
                            bgcolor: theme.palette.brand.orangeDark,
                          },
                        }}
                      >
                        Add Education
                      </Button>
                    </Box>
                    <Grid container spacing={2} mb={4}>
                      {values.educations.map((edu, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="start"
                            >
                              <Box flex={1}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {edu.degree}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {edu.institution}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {edu.start_year} - {edu.end_year || "Present"}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleOpenForEdit("education", edu, idx)
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(idx)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <EducationModal
                      open={openModal === "education"}
                      onClose={handleCloseModal}
                      push={push}
                      replace={(index, value) =>
                        setFieldValue(`educations.${index}`, value)
                      }
                      editItem={
                        editingSection === "education" && editingItem
                          ? (editingItem as Education)
                          : undefined
                      }
                      editIndex={
                        editingSection === "education" ? editingIndex : null
                      }
                    />
                  </>
                )}
              </FieldArray>

              <Divider sx={{ my: 4 }} />

              {/* Certifications Section */}
              <FieldArray name="certifications">
                {({ push, remove }) => (
                  <>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Box display="flex" alignItems="center">
                        {sectionIcons.certification}
                        <Typography variant="h5" fontWeight="bold">
                          Certifications
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setOpenModal("certification")}
                        sx={{
                          bgcolor: theme.palette.brand.orange,
                          "&:hover": {
                            bgcolor: theme.palette.brand.orangeDark,
                          },
                        }}
                      >
                        Add Certification
                      </Button>
                    </Box>
                    <Grid container spacing={2} mb={4}>
                      {values.certifications.map((cert, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="start"
                            >
                              <Box flex={1}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {cert.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {cert.issued_by}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {cert.year}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleOpenForEdit(
                                      "certification",
                                      cert,
                                      idx
                                    )
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(idx)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <CertificationModal
                      open={openModal === "certification"}
                      onClose={handleCloseModal}
                      push={push}
                      replace={(index, value) =>
                        setFieldValue(`certifications.${index}`, value)
                      }
                      editItem={
                        editingSection === "certification" && editingItem
                          ? (editingItem as Certification)
                          : undefined
                      }
                      editIndex={
                        editingSection === "certification" ? editingIndex : null
                      }
                    />
                  </>
                )}
              </FieldArray>

              <Divider sx={{ my: 4 }} />

              {/* Projects Section */}
              <FieldArray name="projects">
                {({ push, remove }) => (
                  <>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Box display="flex" alignItems="center">
                        {sectionIcons.project}
                        <Typography variant="h5" fontWeight="bold">
                          Projects
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setOpenModal("project")}
                        sx={{
                          bgcolor: theme.palette.brand.orange,
                          "&:hover": {
                            bgcolor: theme.palette.brand.orangeDark,
                          },
                        }}
                      >
                        Add Project
                      </Button>
                    </Box>
                    <Grid container spacing={2} mb={4}>
                      {values.projects.map((proj, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="start"
                            >
                              <Box flex={1}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {proj.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
                                >
                                  {proj.description}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleOpenForEdit("project", proj, idx)
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(idx)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <ProjectModal
                      open={openModal === "project"}
                      onClose={handleCloseModal}
                      push={push}
                      replace={(index, value) =>
                        setFieldValue(`projects.${index}`, value)
                      }
                      editItem={
                        editingSection === "project" && editingItem
                          ? (editingItem as Project)
                          : undefined
                      }
                      editIndex={
                        editingSection === "project" ? editingIndex : null
                      }
                    />
                  </>
                )}
              </FieldArray>

              <Divider sx={{ my: 4 }} />

              {/* Languages Section */}
              <FieldArray name="languages">
                {({ push, remove }) => (
                  <>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={3}
                    >
                      <Box display="flex" alignItems="center">
                        {sectionIcons.language}
                        <Typography variant="h5" fontWeight="bold">
                          Languages
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => setOpenModal("language")}
                        sx={{
                          bgcolor: theme.palette.brand.orange,
                          "&:hover": {
                            bgcolor: theme.palette.brand.orangeDark,
                          },
                        }}
                      >
                        Add Language
                      </Button>
                    </Box>
                    <Grid container spacing={2} mb={4}>
                      {values.languages.map((lang, idx) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 2,
                            }}
                          >
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Box flex={1}>
                                <Typography
                                  variant="subtitle1"
                                  fontWeight="bold"
                                >
                                  {lang.language}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {lang.proficiency}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleOpenForEdit("language", lang, idx)
                                  }
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => remove(idx)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    <LanguageModal
                      open={openModal === "language"}
                      onClose={handleCloseModal}
                      push={push}
                      replace={(index, value) =>
                        setFieldValue(`languages.${index}`, value)
                      }
                      editItem={
                        editingSection === "language" && editingItem
                          ? (editingItem as Language)
                          : undefined
                      }
                      editIndex={
                        editingSection === "language" ? editingIndex : null
                      }
                    />
                  </>
                )}
              </FieldArray>

              <Divider sx={{ my: 4 }} />

              {/* Skills Section */}
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Skills
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Skills (comma-separated)"
                name="skillsText"
                value={values.skillsText}
                onChange={handleChange}
                placeholder="e.g., JavaScript, React, Node.js, Python"
                helperText="Enter your skills separated by commas"
                sx={{ mb: 4 }}
              />

              <Divider sx={{ my: 4 }} />

              {/* Interests Section */}
              <Typography variant="h5" fontWeight="bold" mb={3}>
                Interests & Hobbies
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Interests (comma-separated)"
                name="interestsText"
                value={values.interestsText}
                onChange={handleChange}
                placeholder="e.g., Reading, Hiking, Photography"
                helperText="Enter your interests separated by commas"
                sx={{ mb: 4 }}
              />

              <Divider sx={{ my: 4 }} />

              {/* Action Buttons */}
              <Box display="flex" justifyContent="flex-end" gap={2}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  startIcon={<SaveIcon />}
                  size="large"
                  sx={{
                    bgcolor: theme.palette.brand.orange,
                    "&:hover": { bgcolor: theme.palette.brand.orangeDark },
                    minWidth: 150,
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Paper>
          </Form>
        )}
      </Formik>
    </Box>
  );
}
