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
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  Tooltip,
  Container,
  alpha,
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@slices/store";
import {
  WorkOutline,
  SchoolOutlined,
  EmojiEventsOutlined,
  CodeOutlined,
  LanguageOutlined,
  InterestsOutlined,
  LinkOutlined,
  EmailOutlined,
  PhoneOutlined,
  LocationOnOutlined,
  PublicOutlined,
  CalendarTodayOutlined,
  DescriptionOutlined,
  GitHub,
  EditOutlined,
} from "@mui/icons-material";
import { useState } from "react";
import EditApplicant from "./editApplicant";
import { getImageDataUrl, viewPdfInNewTab, isValidByteArray } from "@utils/utils";

export default function ApplicantProfile() {
  const theme = useTheme();
  const applicant = useAppSelector((s) => s.applicant.applicantProfile);
  const [isEditMode, setIsEditMode] = useState(false);

  if (!applicant) return null;

  // If in edit mode, show the edit form
  if (isEditMode) {
    return <EditApplicant applicant={applicant} onCancel={() => setIsEditMode(false)} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section with Gradient Background */}
      <Paper
        elevation={3}
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.brand.orange,
            0.1
          )} 0%, ${alpha(theme.palette.brand.orangeDark, 0.05)} 100%)`,
          borderRadius: 3,
          p: 4,
          mb: 4,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            right: 0,
            width: "300px",
            height: "300px",
            background: `radial-gradient(circle, ${alpha(
              theme.palette.brand.orange,
              0.2
            )}, transparent)`,
            borderRadius: "50%",
            transform: "translate(30%, -30%)",
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={3} position="relative">
          <Avatar
            src={getImageDataUrl(applicant.user_thumbnail)}
            sx={{
              width: 120,
              height: 120,
              border: `4px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[4],
              bgcolor: theme.palette.brand.orange,
              fontSize: 40,
              fontWeight: "bold",
            }}
          >
            {applicant.first_name?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              {applicant.first_name} {applicant.last_name}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
              <Chip
                label={applicant.status}
                color="primary"
                sx={{
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              />
              <Chip
                icon={<EmailOutlined />}
                label={applicant.email}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
            </Stack>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Edit Profile">
              <Button
                onClick={() => setIsEditMode(true)}
                variant="outlined"
                size="large"
                startIcon={<EditOutlined />}
                sx={{
                  borderColor: theme.palette.brand.orange,
                  color: theme.palette.brand.orangeDark,
                  "&:hover": {
                    borderColor: theme.palette.brand.orangeDark,
                    bgcolor: alpha(theme.palette.brand.orange, 0.08),
                  },
                  fontWeight: "bold",
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                }}
              >
                Edit Profile
              </Button>
            </Tooltip>
            {isValidByteArray(applicant.resume_link) && (
              <Tooltip title="View Resume">
                <Button
                  onClick={() => viewPdfInNewTab(applicant.resume_link)}
                  variant="contained"
                  size="large"
                  startIcon={<DescriptionOutlined />}
                  sx={{
                    bgcolor: theme.palette.brand.orangeDark,
                    "&:hover": {
                      bgcolor: theme.palette.brand.orange,
                    },
                    fontWeight: "bold",
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  View Resume
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Single Consolidated Card for All Information */}
      <Card
        elevation={2}
        sx={{
          borderRadius: 3,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            {/* Contact Information Section */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                fontWeight="bold"
                mb={3}
                color="primary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <LocationOnOutlined />
                Contact Details
              </Typography>
              <Grid container spacing={3}>
                {applicant.phone && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <PhoneOutlined fontSize="small" sx={{ color: "text.secondary", mt: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Phone
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {applicant.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {applicant.country && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <PublicOutlined fontSize="small" sx={{ color: "text.secondary", mt: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Country
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {applicant.country}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
                {applicant.address && (
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <LocationOnOutlined fontSize="small" sx={{ color: "text.secondary", mt: 0.3 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Address
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {applicant.address}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ mt: 3 }} />
            </Grid>

            {/* Professional Links Section */}
            {applicant.professional_links && applicant.professional_links.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <LinkOutlined />
                  Professional Links
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {applicant.professional_links.map((link, idx) => (
                    <Button
                      key={idx}
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      startIcon={<LinkOutlined fontSize="small" />}
                      sx={{
                        borderColor: alpha(theme.palette.brand.orange, 0.5),
                        color: theme.palette.brand.orangeDark,
                        "&:hover": {
                          borderColor: theme.palette.brand.orangeDark,
                          bgcolor: alpha(theme.palette.brand.orange, 0.08),
                        },
                        textTransform: "none",
                        fontWeight: 500,
                        py: 0.5,
                        px: 1.5,
                      }}
                    >
                      {link.title}
                    </Button>
                  ))}
                </Stack>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Education Section */}
            {applicant.educations && applicant.educations.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <SchoolOutlined />
                  Education
                </Typography>
                <Grid container spacing={2}>
                  {applicant.educations.map((edu, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          bgcolor: alpha(theme.palette.info.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.info.main,
                            0.1
                          )}`,
                          height: "100%",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {edu.degree}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          gutterBottom
                        >
                          {edu.institution}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          flexWrap="wrap"
                          mt={1}
                        >
                          <Chip
                            icon={<LocationOnOutlined />}
                            label={edu.location}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<CalendarTodayOutlined />}
                            label={`${edu.start_year} - ${
                              edu.end_year || "Present"
                            }`}
                            size="small"
                            variant="outlined"
                          />
                          {edu.gpa_zscore && (
                            <Chip
                              label={`GPA/Z-Score: ${edu.gpa_zscore}`}
                              size="small"
                              variant="outlined"
                              color="info"
                            />
                          )}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Experience Section */}
            {applicant.experiences && applicant.experiences.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <WorkOutline />
                  Work Experience
                </Typography>
                <Grid container spacing={2}>
                  {applicant.experiences.map((exp, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          bgcolor: alpha(theme.palette.success.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.success.main,
                            0.1
                          )}`,
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {exp.job_title}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          color="primary"
                          gutterBottom
                        >
                          {exp.company}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={2}
                          alignItems="center"
                          flexWrap="wrap"
                          mt={1}
                        >
                          <Chip
                            icon={<LocationOnOutlined />}
                            label={exp.location}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            icon={<CalendarTodayOutlined />}
                            label={`${exp.start_date} - ${
                              exp.end_date || "Present"
                            }`}
                            size="small"
                            variant="outlined"
                            color="success"
                          />
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Certifications Section */}
            {applicant.certifications && applicant.certifications.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <EmojiEventsOutlined />
                  Certifications
                </Typography>
                <Grid container spacing={2}>
                  {applicant.certifications.map((cert, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.5,
                          bgcolor: alpha(theme.palette.warning.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.2
                          )}`,
                          height: "100%",
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold">
                          {cert.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" my={1}>
                          {cert.issued_by}
                        </Typography>
                        <Chip
                          label={cert.year}
                          size="small"
                          sx={{ mb: cert.link ? 1.5 : 0 }}
                        />
                        {cert.link && (
                          <Box mt={1.5}>
                            <Button
                              href={cert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="text"
                              size="small"
                              sx={{
                                color: theme.palette.brand.orangeDark,
                                textTransform: "none",
                                fontWeight: 600,
                                p: 0,
                                "&:hover": {
                                  bgcolor: "transparent",
                                  textDecoration: "underline",
                                },
                              }}
                            >
                              View Certificate →
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Projects Section */}
            {applicant.projects && applicant.projects.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CodeOutlined />
                  Projects
                </Typography>
                <Grid container spacing={3}>
                  {applicant.projects.map((project, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 3,
                          bgcolor: alpha(theme.palette.info.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.info.main,
                            0.2
                          )}`,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {project.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={2}
                          flex={1}
                        >
                          {project.description}
                        </Typography>
                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <Stack
                              direction="row"
                              flexWrap="wrap"
                              gap={1}
                              mb={2}
                            >
                              {project.technologies.map((tech, techIdx) => (
                                <Chip
                                  key={techIdx}
                                  label={tech}
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                />
                              ))}
                            </Stack>
                          )}
                        {project.github && (
                          <Button
                            href={project.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="contained"
                            size="small"
                            startIcon={<GitHub />}
                            sx={{
                              bgcolor: theme.palette.brand.orangeDark,
                              "&:hover": {
                                bgcolor: theme.palette.brand.orange,
                              },
                              textTransform: "none",
                              fontWeight: 600,
                              alignSelf: "flex-start",
                            }}
                          >
                            View on GitHub
                          </Button>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Skills Section */}
            {applicant.skills && applicant.skills.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CodeOutlined />
                  Skills
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {applicant.skills.map((skill, idx) => (
                    <Chip
                      key={idx}
                      label={skill}
                      sx={{
                        bgcolor: alpha(theme.palette.brand.orange, 0.15),
                        color: theme.palette.brand.orangeDark,
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.brand.orange, 0.25),
                        },
                      }}
                    />
                  ))}
                </Stack>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Languages Section */}
            {applicant.languages && applicant.languages.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <LanguageOutlined />
                  Languages
                </Typography>
                <Grid container spacing={2}>
                  {applicant.languages.map((lang, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          p: 1.5,
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="body1" fontWeight={600}>
                          {lang.language}
                        </Typography>
                        <Chip
                          label={lang.proficiency}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Divider sx={{ mt: 3 }} />
              </Grid>
            )}

            {/* Interests Section */}
            {applicant.interests && applicant.interests.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  mb={3}
                  color="primary"
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <InterestsOutlined />
                  Interests & Hobbies
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                  {applicant.interests.map((interest, idx) => (
                    <Chip
                      key={idx}
                      label={interest}
                      sx={{
                        bgcolor: alpha(theme.palette.secondary.main, 0.15),
                        color: theme.palette.secondary.dark,
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        "&:hover": {
                          bgcolor: alpha(theme.palette.secondary.main, 0.25),
                        },
                      }}
                    />
                  ))}
                </Stack>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}

