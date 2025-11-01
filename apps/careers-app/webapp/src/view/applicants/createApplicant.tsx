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

import { Formik, Form, FieldArray } from "formik";

import { useAppDispatch, useAppSelector } from "@slices/store";
import {
  createApplicant,
  fetchApplicantByEmail,
} from "@slices/applicantSlice/applicant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { useConfirmationModalContext } from "@context/DialogContext";
import { fileToBase64 } from "@utils/utils";
import { useTheme } from "@mui/material/styles";
import * as yup from "yup";
import { State, ConfirmationType } from "@/types/types";
import { SnackMessage } from "@root/src/config/constant";
import PreLoader from "@component/common/PreLoader";
import ApplicantProfile from "./applicantProfile";

import ExperienceModal, { Experience } from "@modals/ExperienceModal";
import EducationModal, { Education } from "@modals/EducationModal";
import CertificationModal, { Certification } from "@modals/CertificationModal";
import ProjectModal, { Project } from "@modals/ProjectModal";
import LanguageModal, { Language } from "@modals/LanguageModal";
import ProfileBannerImage from "@assets/images/profile-banner-1.svg";
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
  const dispatch = useAppDispatch();
  const { showConfirmation } = useConfirmationModalContext();

  const { state, applicantProfile } = useAppSelector((s) => s.applicant);
  const userEmail = useAppSelector((s) => s.user?.userInfo?.workEmail);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [openModal, setOpenModal] = useState<SectionKey | null>(null);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
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

  useEffect(() => {
    if (userEmail) {
      dispatch(fetchApplicantByEmail(userEmail));
    }
  }, [dispatch, userEmail]);

  // Display loader while checking applicant email
  if (state === State.loading) {
    return (
      <PreLoader
        message={
          applicantProfile
            ? "Loading your applicant details..."
            : "Creating your applicant profile..."
        }
        isLoading
      />
    );
  }

  // If existing applicant found → show profile page
  if (applicantProfile) {
    return <ApplicantProfile />;
  }

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
    <Box sx={{ mt: "-24px", overflow: "hidden", mx: "-24px" }}>
      {/* Hero Banner Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.background.banner,
          boxShadow: "0 2px 7px rgba(0,0,0,0.05)",
          py: { xs: 4, md: 6 },
          width: "100%",
          position: "relative",
        }}
      >
        {/* Inner Content Wrapper */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
            px: { xs: 3, md: 8, lg: 12 },
            maxWidth: "1500px",
            width: "100%",
          }}
        >
        {/* Left Content */}
        <Box sx={{ flex: 1, maxWidth: { md: "50%" } }}>
          <Typography
            variant="h1"
            fontWeight="bold"
            gutterBottom
          >
            Showcase Your Talent with a WSO2 Profile
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            fontStyle="italic"
            sx={{ maxWidth: 900 }}
          >
            Upload your CV, highlight your expertise, and manage your
            professional profile—all in one place. Let WSO2 discover the real
            you and match you with opportunities that fit your passion and
            potential.
          </Typography>
        </Box>

        {/* Right Image */}
        <Box
          component="img"
          src={ProfileBannerImage}
          alt="WSO2 Profile Banner"
          sx={{
            width: { xs: "100%", md: "40%" },
            height: "auto",
          }}
        />
        </Box>
      </Box>

      {/* Form Content Container */}
      <Box sx={{ p: { xs: 2, md: 3 }, px: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto", mt: 6 }}>

      {/* Main Formik Form */}
      <Formik
        initialValues={{
          ...initialValues,
          email: userEmail || "", // Set email from userEmail if available
        }}
        enableReinitialize={true}
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
          if (values.email) {
            await dispatch(fetchApplicantByEmail(values.email));
          }
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
              <Typography
                variant="h2"
                fontWeight="bold"
                color={theme.palette.brand.orangeDark}
                gutterBottom
                align="center"
                sx={{ mb: 2 }}
              >
                Create Your Profile
              </Typography>
              <Typography
                variant="h5"
                color="text.secondary"
                align="center"
                sx={{ mb: 5 }}
              >
                Share your information and let us know more about you
              </Typography>

              {/* Profile Photo Upload Section */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
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
                      width: 140,
                      height: 140,
                      bgcolor: `linear-gradient(135deg, ${theme.palette.brand.orange}30 0%, ${theme.palette.brand.orange}10 100%)`,
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
                  />

                  <IconButton
                    component="label"
                    sx={{
                      position: "absolute",
                      bottom: 5,
                      right: 5,
                      bgcolor: theme.palette.brand.orange,
                      color: "white",
                      width: 40,
                      height: 40,
                      boxShadow: `0 4px 12px ${theme.palette.brand.orange}50`,
                      "&:hover": { 
                        bgcolor: theme.palette.brand.orangeDark,
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <PhotoCameraIcon sx={{ fontSize: 20 }} />
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

              <Divider sx={{ my: 4 }} />

              {/* CV Upload Section */}
              <Box sx={{ mb: 4 }}>
                <Box
                  sx={{
                    border: `2px dashed ${theme.palette.brand.orange}`,
                    borderRadius: 2,
                    p: 4,
                    textAlign: "center",
                    maxWidth: 500,
                    mx: "auto",
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" mb={2} color={theme.palette.brand.orangeDark}>
                    Upload Your CV
                  </Typography>
                  
                  <CloudUploadIcon
                    sx={{ fontSize: 50, color: theme.palette.brand.orange, mb: 2 }}
                  />
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    mb={3}
                    sx={{ fontSize: 14 }}
                  >
                    Supported format: PDF only
                  </Typography>

                  <Button
                    variant="contained"
                    component="label"
                    sx={{
                      bgcolor: theme.palette.brand.orange,
                      color: "white",
                      fontWeight: "600",
                      fontSize: 16,
                      px: 4,
                      py: 1,
                      borderRadius: 2,
                      textTransform: "none",
                      "&:hover": { 
                        bgcolor: theme.palette.brand.orangeDark,
                      },
                    }}
                  >
                    Choose File
                    <input
                      type="file"
                      hidden
                      accept=".pdf"
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    />
                  </Button>

                  {resumeFile && (
                    <Typography 
                      mt={2.5}
                      fontSize={15} 
                      fontWeight={500}
                      color={theme.palette.brand.orangeDark}
                    >
                      {resumeFile.name}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h4" fontWeight="bold" mb={3}>
                Personal Info
              </Typography>
              <Grid container spacing={3} mb={3}>
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
                    InputProps={{
                      style: { fontSize: 17 }
                    }}
                    InputLabelProps={{
                      style: { fontSize: 17 }
                    }}
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
                    InputProps={{
                      style: { fontSize: 17 }
                    }}
                    InputLabelProps={{
                      style: { fontSize: 17 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    placeholder="+1234567890"
                    value={values.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                    InputProps={{
                      style: { fontSize: 17 }
                    }}
                    InputLabelProps={{
                      style: { fontSize: 17 }
                    }}
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
                    InputProps={{
                      readOnly: true,
                      style: { fontSize: 17 }
                    }}
                    InputLabelProps={{
                      style: { fontSize: 17 }
                    }}
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
                    InputProps={{
                      style: { fontSize: 17 }
                    }}
                    InputLabelProps={{
                      style: { fontSize: 17 }
                    }}
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
                    InputProps={{
                      style: { fontSize: 17 }
                    }}
                    InputLabelProps={{
                      style: { fontSize: 17 }
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* Professional Links */}
              <Typography variant="h4" fontWeight="bold" mb={3}>
                Professional Links
              </Typography>
              <Grid container spacing={3} mb={3}>
                {Object.keys(values.professionalLinks).map((platform) => (
                  <Grid item xs={12} sm={4} key={platform}>
                    <TextField
                      fullWidth
                      label={platform}
                      name={`professionalLinks.${platform}`}
                      value={values.professionalLinks[platform]}
                      onChange={handleChange}
                      InputProps={{
                        style: { fontSize: 17 }
                      }}
                      InputLabelProps={{
                        style: { fontSize: 17 }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

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
                      <Typography variant="h4" fontWeight="bold">{sec.label}</Typography>
                      <Button
                        variant="text"
                        sx={{
                          color: theme.palette.brand.orange,
                          fontWeight: "bold",
                          border: `1px solid ${theme.palette.brand.orange}`,
                          borderRadius: 1,
                          fontSize: 17,
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
                            <Paper 
                              key={idx} 
                              className="preview-card"
                              sx={{
                                border: `2px solid ${theme.palette.brand.orange}30`,
                                borderRadius: 2,
                              }}
                            >
                              {/* Header with Icon */}
                              <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                mb={2}
                              >
                                <Box display="flex" alignItems="center">
                                  {sectionIcons[sectionKey]}
                                  <Typography
                                    variant="h5"
                                    fontWeight="bold"
                                    color={theme.palette.brand.orangeDark}
                                    sx={{ fontSize: 18 }}
                                  >
                                    {String(title)}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Details in Grid */}
                              <Grid container spacing={2}>
                                {Object.entries(item).map(([field, value]) =>
                                  value ? (
                                    <Grid item xs={12} sm={6} key={field}>
                                      <Typography
                                        variant="body1"
                                        sx={{ color: "text.secondary", fontSize: 15 }}
                                      >
                                        <strong
                                          style={{
                                            textTransform: "capitalize",
                                            color: theme.palette.text.primary,
                                            fontWeight: 600,
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
                                mt={2}
                              >
                                <Box display="flex" gap={1}>
                                  <Tooltip title="Edit">
                                    <IconButton
                                      size="medium"
                                      onClick={() =>
                                        handleOpenForEdit(sectionKey, item, idx)
                                      }
                                      sx={{
                                        color: theme.palette.brand.orange,
                                        "&:hover": {
                                          bgcolor: `${theme.palette.brand.orange}10`,
                                        },
                                      }}
                                    >
                                      <EditIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Remove">
                                    <IconButton
                                      size="medium"
                                      onClick={() =>
                                        setFieldValue(
                                          `${sectionKey}s`,
                                          (items as SectionItem[]).filter(
                                            (_, i) => i !== idx
                                          )
                                        )
                                      }
                                      sx={{
                                        color: theme.palette.error.main,
                                        "&:hover": {
                                          bgcolor: `${theme.palette.error.main}10`,
                                        },
                                      }}
                                    >
                                      <DeleteIcon sx={{ fontSize: 20 }} />
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

              <Divider sx={{ my: 4 }} />

              {/* Skills */}
              <Box mt={3}>
                <Typography variant="h4" fontWeight="bold" mb={2}>
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
                  InputProps={{
                    style: { fontSize: 17 }
                  }}
                />
                {touched.skillsText && errors.skillsText && (
                  <Typography variant="caption" color="error">
                    {errors.skillsText as string}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Interests */}
              <Box mt={3}>
                <Typography variant="h4" fontWeight="bold" mb={2}>
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
                  InputProps={{
                    style: { fontSize: 17 }
                  }}
                />
                {touched.interestsText && errors.interestsText && (
                  <Typography variant="caption" color="error">
                    {errors.interestsText as string}
                  </Typography>
                )}
              </Box>

              {/* Resume consent */}
              <Box mt={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="consentData"
                      checked={values.consentData}
                      onChange={handleChange}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: 18 }}>
                      Yes, I give WSO2 permission to use my personal data for recruitment purposes only.
                    </Typography>
                  }
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
                  label={
                    <Typography sx={{ fontSize: 18 }}>
                      I would like to receive emails from WSO2 about updates.
                    </Typography>
                  }
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
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: theme.palette.brand.orange,
                    "&:hover": { bgcolor: theme.palette.brand.orangeDark },
                    fontSize: 18,
                    px: 5,
                    py: 1.5,
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Save"}
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
    </Box>
  );
}
