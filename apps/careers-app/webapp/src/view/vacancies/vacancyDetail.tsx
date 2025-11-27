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

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  FormHelperText,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@slices/store";
import { Formik, Form } from "formik";
import * as yup from "yup";
import {
  fetchVacancyDetail,
  clearVacancyDetail,
  applyToVacancy,
  resetApplyVacancyState,
} from "@slices/vacanciesSlice/vacancies";
import { fetchApplicantByEmail } from "@slices/applicantSlice/applicant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { State } from "@/types/types";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BusinessIcon from "@mui/icons-material/Business";

// Countries list
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "India",
  "Australia",
  "Sri Lanka",
  "United Arab Emirates",
  "Brazil",
  "Germany",
  "Canada",
  "Singapore",
  "Other",
];

interface ApplicationFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  hasWorkAuth: string;
  dataConsent: boolean;
  emailConsent: boolean;
  resume?: string; // Optional field for displaying error messages
}

const initialFormValues: ApplicationFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  hasWorkAuth: "",
  dataConsent: false,
  emailConsent: false,
};

const applicationValidationSchema = yup.object({
  firstName: yup.string().required("First name is required"),
  lastName: yup.string().required("Last name is required"),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  phone: yup.string().required("Phone number is required"),
  address: yup.string().required("Address is required"),
  country: yup.string().required("Country is required"),
  hasWorkAuth: yup.string().required("This field is required"),
  dataConsent: yup
    .boolean()
    .oneOf([true], "You must consent to data usage for recruitment"),
});

export default function VacancyDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const { 
    selectedVacancy: vacancy, 
    vacancyDetailState, 
    vacancyDetailError,
    applyVacancyState,
    applyVacancyError
  } = useSelector((state: RootState) => state.vacancies);
  const { applicantProfile } = useSelector((state: RootState) => state.applicant);
  const userEmail = useSelector((state: RootState) => state.user?.userInfo?.workEmail);

  // Modal state
  const [openApplyModal, setOpenApplyModal] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [formikInitialValues, setFormikInitialValues] = useState<ApplicationFormValues>(initialFormValues);

  useEffect(() => {
    if (id) {
      dispatch(fetchVacancyDetail(Number(id)));
    }
    return () => {
      dispatch(clearVacancyDetail());
    };
  }, [id, dispatch]);

  // Fetch applicant profile when user email is available
  useEffect(() => {
    if (userEmail) {
      dispatch(fetchApplicantByEmail(userEmail));
    }
  }, [userEmail, dispatch]);

  // Pre-fill form when applicant profile is loaded
  useEffect(() => {
    if (applicantProfile) {
      setFormikInitialValues({
        firstName: applicantProfile.firstName || "",
        lastName: applicantProfile.lastName || "",
        email: applicantProfile.email || "",
        phone: applicantProfile.phone || "",
        address: applicantProfile.address || "",
        country: applicantProfile.country || "",
        hasWorkAuth: "",
        dataConsent: false,
        emailConsent: false,
      });
    }
  }, [applicantProfile]);

  // Handle apply vacancy state changes
  useEffect(() => {
    if (applyVacancyState === State.success) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Application submitted successfully!",
          type: "success",
        })
      );
      handleCloseApplyModal();
      dispatch(resetApplyVacancyState());
    } else if (applyVacancyState === State.failed && applyVacancyError) {
      dispatch(
        enqueueSnackbarMessage({
          message: applyVacancyError,
          type: "error",
        })
      );
      dispatch(resetApplyVacancyState());
    }
  }, [applyVacancyState, applyVacancyError, dispatch]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleOpenApplyModal = () => {
    // Check if user has created a profile
    if (!applicantProfile) {
      dispatch(
        enqueueSnackbarMessage({
          message: "Please create a profile first before applying to vacancies.",
          type: "warning",
        })
      );
      return;
    }
    setOpenApplyModal(true);
  };

  const handleCloseApplyModal = () => {
    setOpenApplyModal(false);
    setResumeFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setFieldError: (field: string, message: string | undefined) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (PDF only)
      if (file.type !== "application/pdf") {
        setFieldError("resume", "Only PDF files are allowed (max 5MB)");
        setResumeFile(null);
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFieldError("resume", "File size must be less than 5MB");
        setResumeFile(null);
        return;
      }
      setResumeFile(file);
      setFieldError("resume", undefined);
    }
  };

  const fileToByteArray = (file: File): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const byteArray = Array.from(new Uint8Array(arrayBuffer));
        resolve(byteArray);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleSubmitApplication = async (values: ApplicationFormValues, setFieldError: (field: string, message: string) => void) => {
    if (!vacancy) return;

    // Validate resume
    if (!resumeFile && !applicantProfile?.resume) {
      setFieldError("resume", "CV/Resume is required");
      return;
    }

    try {
      let resumeBytes: number[];

      // Use uploaded file or existing resume
      if (resumeFile) {
        resumeBytes = await fileToByteArray(resumeFile);
      } else if (applicantProfile?.resume && Array.isArray(applicantProfile.resume)) {
        resumeBytes = applicantProfile.resume;
      } else {
        throw new Error("No resume available");
      }

      const payload = {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        personalEmail: values.email.trim(),
        contactNo: values.phone.trim(),
        address: values.address.trim(),
        resume: resumeBytes,
      };

      // Dispatch the apply action
      dispatch(applyToVacancy({ vacancyId: vacancy.id, payload }));
      
    } catch (error: any) {
      dispatch(
        enqueueSnackbarMessage({
          message: error.message || "Failed to prepare application. Please try again.",
          type: "error",
        })
      );
    }
  };

  if (vacancyDetailState === State.loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress sx={{ color: theme.palette.brand.orange }} />
      </Box>
    );
  }

  if (vacancyDetailState === State.failed || !vacancy) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error">
          {vacancyDetailError || "Failed to load vacancy details"}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate("/vacancies")}
          sx={{
            mt: 2,
            color: theme.palette.brand.orange,
            borderColor: theme.palette.brand.orange,
          }}
        >
          Back to Vacancies
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: "100vh" }}>
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Left Column - Job Details */}
          <Grid item xs={12} md={8}>
            {/* Job Header Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Chip
                  label={vacancy.team}
                  size="small"
                  sx={{
                    bgcolor: theme.palette.background.banner,
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h3"
                  fontWeight="700"
                  gutterBottom
                  sx={{ color: theme.palette.text.primary, mb: 3 }}
                >
                  {vacancy.title}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <WorkIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.brand.orange,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Job Type
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {vacancy.job_type}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOnIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.brand.orange,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Location
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {vacancy.country.join(", ")}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BusinessIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.brand.orange,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Office
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {Object.values(vacancy.office_locations)[0] || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon
                        sx={{
                          fontSize: 20,
                          color: theme.palette.brand.orange,
                        }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          Published
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {formatDate(vacancy.published_on)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Job Description - Main Content */}
            {vacancy.mainContent && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent 
                  sx={{ 
                    p: 4,
                    "& h2": {
                      color: theme.palette.brand.orangeDark,
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      marginTop: "1.5rem",
                      "&:first-of-type": {
                        marginTop: 0,
                      }
                    },
                    "& h3": {
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      marginBottom: "0.75rem",
                      marginTop: "1.25rem",
                    },
                    "& p": {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.8,
                      marginBottom: "1rem",
                    },
                    "& ul": {
                      paddingLeft: "1.5rem",
                      marginTop: "0.5rem",
                      marginBottom: "1rem",
                    },
                    "& li": {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                      marginBottom: "0.75rem",
                      "::marker": {
                        color: theme.palette.brand.orange,
                      }
                    },
                    "& a": {
                      color: theme.palette.brand.orange,
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      }
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: vacancy.mainContent }}
                />
              </Card>
            )}

            {/* Task Information */}
            {vacancy.taskInformation && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent 
                  sx={{ 
                    p: 4,
                    "& h2": {
                      color: theme.palette.brand.orangeDark,
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      marginTop: "1.5rem",
                      "&:first-of-type": {
                        marginTop: 0,
                      }
                    },
                    "& h3": {
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      marginBottom: "0.75rem",
                      marginTop: "1.25rem",
                    },
                    "& p": {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.8,
                      marginBottom: "1rem",
                    },
                    "& ul": {
                      paddingLeft: "1.5rem",
                      marginTop: "0.5rem",
                      marginBottom: "1rem",
                    },
                    "& li": {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                      marginBottom: "0.75rem",
                      "::marker": {
                        color: theme.palette.brand.orange,
                      }
                    },
                    "& a": {
                      color: theme.palette.brand.orange,
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      }
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: vacancy.taskInformation }}
                />
              </Card>
            )}

            {/* Additional Information */}
            {vacancy.additionalContent && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  borderRadius: 3,
                  border: `1px solid ${theme.palette.divider}`,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <CardContent 
                  sx={{ 
                    p: 4,
                    "& h2": {
                      color: theme.palette.brand.orangeDark,
                      fontWeight: 700,
                      fontSize: "1.5rem",
                      marginBottom: "1rem",
                      marginTop: "1.5rem",
                      "&:first-of-type": {
                        marginTop: 0,
                      }
                    },
                    "& h3": {
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      marginBottom: "0.75rem",
                      marginTop: "1.25rem",
                    },
                    "& p": {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.8,
                      marginBottom: "1rem",
                    },
                    "& ul": {
                      paddingLeft: "1.5rem",
                      marginTop: "0.5rem",
                      marginBottom: "1rem",
                    },
                    "& li": {
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
                      marginBottom: "0.75rem",
                      "::marker": {
                        color: theme.palette.brand.orange,
                      }
                    },
                    "& a": {
                      color: theme.palette.brand.orange,
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      }
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: vacancy.additionalContent }}
                />
              </Card>
            )}
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Apply Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                position: "sticky",
                top: 24,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Interested in this position?
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleOpenApplyModal}
                  sx={{
                    bgcolor: theme.palette.brand.orange,
                    color: "white",
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    boxShadow: "none",
                    mb: 2,
                    "&:hover": {
                      bgcolor: theme.palette.brand.orangeDark,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  Apply Now
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => navigate("/vacancies")}
                  sx={{
                    color: theme.palette.brand.orange,
                    borderColor: theme.palette.brand.orange,
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 2,
                    textTransform: "none",
                    "&:hover": {
                      borderColor: theme.palette.brand.orangeDark,
                      bgcolor: "rgba(255, 102, 0, 0.04)",
                    },
                  }}
                >
                  View All Positions
                </Button>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            {vacancy?.similar_job_listing &&
              vacancy.similar_job_listing.length > 0 && (
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography
                      variant="h6"
                      fontWeight="700"
                      gutterBottom
                      sx={{ mb: 3 }}
                    >
                      Similar Positions
                    </Typography>
                    {vacancy.similar_job_listing.map((job: any, idx: number) => (
                      <Box
                        key={job.id}
                        sx={{
                          mb: 2,
                          pb: 2,
                          borderBottom:
                            idx !== vacancy.similar_job_listing.length - 1
                              ? `1px solid ${theme.palette.divider}`
                              : "none",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            transform: "translateX(4px)",
                          },
                        }}
                        onClick={() => navigate(`/vacancies/${job.id}`)}
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight="600"
                          sx={{
                            mb: 1,
                            color: theme.palette.text.primary,
                            "&:hover": {
                              color: theme.palette.brand.orange,
                            },
                          }}
                        >
                          {job.title}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                          >
                            <BusinessIcon
                              sx={{ fontSize: 14, color: "text.secondary" }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {job.team}
                            </Typography>
                          </Box>
                          <Box
                            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                          >
                            <LocationOnIcon
                              sx={{ fontSize: 14, color: "text.secondary" }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {job.country.join(", ")}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              )}
          </Grid>
        </Grid>
      </Container>

      {/* Apply Now Modal */}
      <Dialog
        open={openApplyModal}
        onClose={handleCloseApplyModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
          },
        }}
      >
        <Formik
          initialValues={formikInitialValues}
          enableReinitialize={true}
          validationSchema={applicationValidationSchema}
          onSubmit={async (values, { setFieldError }) => {
            await handleSubmitApplication(values, setFieldError);
          }}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldError }) => (
            <Form onSubmit={handleSubmit}>
              <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 2 }}>
                <Typography variant="h5" fontWeight="700">
                  Apply Now
                </Typography>
                <IconButton onClick={handleCloseApplyModal} size="small">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent dividers sx={{ py: 3 }}>
                <Grid container spacing={2}>
                  {/* First Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="First Name"
                      name="firstName"
                      placeholder="First Name *"
                      value={values.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.firstName && Boolean(errors.firstName)}
                      helperText={touched.firstName && errors.firstName}
                      size="small"
                    />
                  </Grid>

                  {/* Last Name */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      required
                      label="Last Name"
                      name="lastName"
                      placeholder="Last Name *"
                      value={values.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.lastName && Boolean(errors.lastName)}
                      helperText={touched.lastName && errors.lastName}
                      size="small"
                    />
                  </Grid>

                  {/* Email */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="Email *"
                      value={values.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                      size="small"
                    />
                  </Grid>

                  {/* Phone */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Phone"
                      name="phone"
                      placeholder="Phone *"
                      value={values.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.phone && Boolean(errors.phone)}
                      helperText={touched.phone && errors.phone}
                      size="small"
                    />
                  </Grid>

                  {/* Address */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      label="Address"
                      name="address"
                      placeholder="Address *"
                      value={values.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.address && Boolean(errors.address)}
                      helperText={touched.address && errors.address}
                      size="small"
                    />
                  </Grid>

                  {/* Country */}
                  <Grid item xs={12}>
                    <FormControl 
                      fullWidth 
                      required 
                      error={touched.country && Boolean(errors.country)} 
                      size="small"
                    >
                      <InputLabel>Country *</InputLabel>
                      <Select
                        name="country"
                        value={values.country}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        label="Country *"
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          - Please Select -
                        </MenuItem>
                        {COUNTRIES.map((country) => (
                          <MenuItem key={country} value={country}>
                            {country}
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.country && errors.country && (
                        <FormHelperText>{errors.country}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Upload CV */}
                  <Grid item xs={12}>
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Upload CV (PDF only / 5MB) *
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          sx={{
                            textTransform: "none",
                            color: theme.palette.text.secondary,
                            borderColor: theme.palette.divider,
                            "&:hover": {
                              borderColor: theme.palette.brand.orange,
                              color: theme.palette.brand.orange,
                            },
                          }}
                        >
                          Choose File
                          <input
                            type="file"
                            hidden
                            accept=".pdf"
                            onChange={(e) => handleFileChange(e, setFieldError)}
                          />
                        </Button>
                        <Box>
                          {resumeFile ? (
                            <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                              ✓ {resumeFile.name}
                            </Typography>
                          ) : applicantProfile?.resume && Array.isArray(applicantProfile.resume) && applicantProfile.resume.length > 0 ? (
                            <Typography variant="caption" sx={{ color: theme.palette.brand.orange, fontWeight: 600 }}>
                              Using saved resume ({(applicantProfile.resume.length / 1024).toFixed(1)} KB)
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                              No file chosen
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {errors.resume && (
                        <FormHelperText error sx={{ mt: 1 }}>{errors.resume}</FormHelperText>
                      )}
                      {!resumeFile && applicantProfile?.resume && (
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: theme.palette.text.secondary, fontStyle: "italic" }}>
                          Note: Your previously uploaded resume will be used. Upload a new file to replace it.
                        </Typography>
                      )}
                    </Box>
                  </Grid>

                  {/* Work Authorization */}
                  <Grid item xs={12}>
                    <FormControl 
                      component="fieldset" 
                      error={touched.hasWorkAuth && Boolean(errors.hasWorkAuth)}
                    >
                      <Typography variant="body2" gutterBottom>
                        Do you have authorization to work in selected job location? *
                      </Typography>
                      <RadioGroup
                        row
                        name="hasWorkAuth"
                        value={values.hasWorkAuth}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                        <FormControlLabel value="no" control={<Radio />} label="No" />
                      </RadioGroup>
                      {touched.hasWorkAuth && errors.hasWorkAuth && (
                        <FormHelperText>{errors.hasWorkAuth}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Data Consent */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="dataConsent"
                          checked={values.dataConsent}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Yes, I give WSO2 permission to use my personal data for recruitment purposes only.
                        </Typography>
                      }
                    />
                    {touched.dataConsent && errors.dataConsent && (
                      <FormHelperText error>{errors.dataConsent}</FormHelperText>
                    )}
                  </Grid>

                  {/* Email Consent */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="emailConsent"
                          checked={values.emailConsent}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          I would like to receive emails from WSO2 to learn about new releases, security announcements, and other updates.
                        </Typography>
                      }
                    />
                  </Grid>
                </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, py: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={applyVacancyState === State.loading}
                    sx={{
                      bgcolor: theme.palette.common.black,
                      color: "white",
                      px: 4,
                      py: 1.2,
                      textTransform: "none",
                      fontSize: "1rem",
                      fontWeight: 600,
                      "&:hover": {
                        bgcolor: "#333",
                      },
                      "&:disabled": {
                        bgcolor: theme.palette.grey[400],
                      },
                    }}
                  >
                    {applyVacancyState === State.loading ? "Submitting..." : "Submit"}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </Dialog>
    </Box>
  );
}
