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
  Launch,
} from "@mui/icons-material";
import { useState } from "react";
import EditApplicant from "./editApplicant";
import {
  getImageDataUrl,
  viewPdfInNewTab,
  isValidByteArray,
} from "@utils/utils";

export default function ApplicantProfile() {
  const theme = useTheme();
  const applicant = useAppSelector((s) => s.applicant.applicantProfile);
  const [isEditMode, setIsEditMode] = useState(false);

  if (!applicant) return null;

  // If in edit mode, show the edit form
  if (isEditMode) {
    return (
      <EditApplicant
        applicant={applicant}
        onCancel={() => setIsEditMode(false)}
      />
    );
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
          borderRadius: 4,
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
        <Box display="flex" alignItems="center" gap={4} position="relative">
          {/* Avatar Section */}
          <Avatar
            src={getImageDataUrl(applicant.user_thumbnail)}
            sx={{
              width: 100,
              height: 100,
              border: `3px solid ${alpha(theme.palette.brand.orange, 0.2)}`,
              boxShadow: `0 4px 14px ${alpha(theme.palette.brand.orange, 0.2)}`,
              bgcolor: theme.palette.brand.orange,
              fontSize: 36,
              fontWeight: "bold",
              transition: "transform 0.2s ease-in-out",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {applicant.first_name?.[0]?.toUpperCase()}
          </Avatar>

          {/* Main Info Section */}
          <Box flex={1}>
            <Typography
              variant="h4"
              fontWeight={700}
              sx={{
                mb: 1,
                background: `linear-gradient(135deg, ${
                  theme.palette.text.primary
                } 0%, ${alpha(theme.palette.text.primary, 0.8)} 100%)`,
                WebkitBackgroundClip: "text",
                letterSpacing: "-0.5px",
              }}
            >
              {applicant.first_name} {applicant.last_name}
            </Typography>

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
            >
              <Chip
                label={applicant.status}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.brand.orange, 0.12),
                  color: theme.palette.brand.orangeDark,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  fontSize: "0.7rem",
                  height: 24,
                  border: `1px solid ${alpha(theme.palette.brand.orange, 0.3)}`,
                }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  color: theme.palette.text.secondary,
                  fontSize: "0.875rem",
                }}
              >
                <EmailOutlined sx={{ fontSize: 16 }} />
                <Typography variant="body2" fontWeight={500}>
                  {applicant.email}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Action Buttons - Right Side */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              onClick={() => setIsEditMode(true)}
              variant="outlined"
              size="medium"
              startIcon={<EditOutlined />}
              sx={{
                borderColor: alpha(theme.palette.text.primary, 0.2),
                color: theme.palette.text.primary,
                "&:hover": {
                  borderColor: theme.palette.brand.orangeDark,
                  color: theme.palette.brand.orangeDark,
                  bgcolor: alpha(theme.palette.brand.orange, 0.05),
                  transform: "translateY(-1px)",
                  boxShadow: `0 2px 8px ${alpha(
                    theme.palette.brand.orange,
                    0.15
                  )}`,
                },
                fontWeight: 600,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                textTransform: "none",
                fontSize: "0.875rem",
                transition: "all 0.2s ease-in-out",
                borderWidth: 1.5,
              }}
            >
              Edit Profile
            </Button>

            {isValidByteArray(applicant.resume_link) && (
              <Button
                onClick={() => viewPdfInNewTab(applicant.resume_link)}
                variant="contained"
                size="medium"
                startIcon={<DescriptionOutlined />}
                sx={{
                  bgcolor: theme.palette.brand.orangeDark,
                  color: theme.palette.common.white,
                  "&:hover": {
                    bgcolor: theme.palette.brand.orange,
                    transform: "translateY(-1px)",
                    boxShadow: `0 4px 12px ${alpha(
                      theme.palette.brand.orange,
                      0.4
                    )}`,
                  },
                  fontWeight: 600,
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.875rem",
                  transition: "all 0.2s ease-in-out",
                  boxShadow: `0 2px 8px ${alpha(
                    theme.palette.brand.orange,
                    0.25
                  )}`,
                }}
              >
                View Resume
              </Button>
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
                variant="h5"
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <PhoneOutlined
                        fontSize="small"
                        sx={{ color: "text.secondary", mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          fontSize="0.875rem"
                        >
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <PublicOutlined
                        fontSize="small"
                        sx={{ color: "text.secondary", mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          fontSize="0.875rem"
                        >
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <LocationOnOutlined
                        fontSize="small"
                        sx={{ color: "text.secondary", mt: 0.3 }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          fontSize="0.875rem"
                        >
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
            {applicant.professional_links &&
              applicant.professional_links.length > 0 && (
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
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
                  variant="h5"
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
                          bgcolor: alpha(theme.palette.warning.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.2
                          )}`,
                          height: "100%",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
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
                            size="medium"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(
                                theme.palette.brand.orangeDark,
                                0.4
                              ),
                              color: theme.palette.brand.orangeDark,
                              fontWeight: 500,
                            }}
                          />
                          <Chip
                            icon={<CalendarTodayOutlined />}
                            label={`${edu.start_year} - ${
                              edu.end_year || "Present"
                            }`}
                            size="medium"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(
                                theme.palette.brand.orangeDark,
                                0.4
                              ),
                              color: theme.palette.brand.orangeDark,
                              fontWeight: 500,
                            }}
                          />
                          {edu.gpa_zscore && (
                            <Chip
                              label={`GPA/Z-Score: ${edu.gpa_zscore}`}
                              size="medium"
                              variant="outlined"
                              sx={{
                                borderColor: alpha(
                                  theme.palette.brand.orangeDark,
                                  0.4
                                ),
                                color: theme.palette.brand.orangeDark,
                                fontWeight: 500,
                              }}
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
                  variant="h5"
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
                          bgcolor: alpha(theme.palette.warning.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.2
                          )}`,
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
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
                            size="medium"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(
                                theme.palette.brand.orangeDark,
                                0.4
                              ),
                              color: theme.palette.brand.orangeDark,
                              fontWeight: 500,
                            }}
                          />
                          <Chip
                            icon={<CalendarTodayOutlined />}
                            label={`${exp.start_date} - ${
                              exp.end_date || "Present"
                            }`}
                            size="medium"
                            variant="outlined"
                            sx={{
                              borderColor: alpha(
                                theme.palette.brand.orangeDark,
                                0.4
                              ),
                              color: theme.palette.brand.orangeDark,
                              fontWeight: 500,
                            }}
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
            {applicant.certifications &&
              applicant.certifications.length > 0 && (
                <Grid item xs={12}>
                  <Typography
                    variant="h5"
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
                            position: "relative",
                          }}
                        >
                          {cert.link && (
                            <Tooltip title="View Certificate" placement="top">
                              <Button
                                href={cert.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  position: "absolute",
                                  top: 12,
                                  right: 12,
                                  minWidth: "auto",
                                  p: 1,
                                  borderRadius: 1.5,
                                  color: theme.palette.brand.orangeDark,
                                  "&:hover": {
                                    bgcolor: alpha(
                                      theme.palette.brand.orange,
                                      0.1
                                    ),
                                  },
                                }}
                              >
                                <Launch fontSize="medium" />
                              </Button>
                            </Tooltip>
                          )}
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            gutterBottom
                            sx={{ pr: cert.link ? 5 : 0 }}
                          >
                            {cert.name}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            color="text.secondary"
                            my={1}
                          >
                            {cert.issued_by}
                          </Typography>
                          <Chip
                            label={cert.year}
                            size="small"
                            sx={{
                              borderColor: alpha(
                                theme.palette.brand.orangeDark,
                                0.4
                              ),
                              color: theme.palette.brand.orangeDark,
                            }}
                            variant="outlined"
                          />
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
                  variant="h5"
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
                          bgcolor: alpha(theme.palette.warning.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.2
                          )}`,
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                          {project.name}
                        </Typography>
                        <Typography color="text.secondary" mb={2} flex={1}>
                          {project.description}
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          {project.technologies &&
                            project.technologies.length > 0 && (
                              <Stack
                                direction="row"
                                flexWrap="wrap"
                                gap={1}
                                flex={1}
                              >
                                {project.technologies.map((tech, techIdx) => (
                                  <Chip
                                    key={techIdx}
                                    label={tech}
                                    size="medium"
                                    variant="outlined"
                                    sx={{
                                      borderColor: alpha(
                                        theme.palette.brand.orangeDark,
                                        0.3
                                      ),
                                      color: theme.palette.brand.orangeDark,
                                    }}
                                  />
                                ))}
                              </Stack>
                            )}
                          {project.github && (
                            <Button
                              href={project.github}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="outlined"
                              size="small"
                              startIcon={<GitHub />}
                              sx={{
                                borderColor: alpha(
                                  theme.palette.text.primary,
                                  0.2
                                ),
                                color: theme.palette.text.primary,
                                "&:hover": {
                                  borderColor: theme.palette.brand.orangeDark,
                                  color: theme.palette.brand.orangeDark,
                                  bgcolor: alpha(
                                    theme.palette.brand.orange,
                                    0.05
                                  ),
                                },
                                textTransform: "none",
                                fontWeight: 600,
                                borderRadius: 1.5,
                                flexShrink: 0,
                              }}
                            >
                              View on GitHub
                            </Button>
                          )}
                        </Box>
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
                  variant="h5"
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
                  variant="h5"
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
                          bgcolor: alpha(theme.palette.warning.main, 0.04),
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            theme.palette.warning.main,
                            0.2
                          )}`,
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
                          sx={{
                            borderColor: alpha(
                              theme.palette.brand.orangeDark,
                              0.3
                            ),
                            color: theme.palette.brand.orangeDark,
                          }}
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
                  variant="h5"
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
                        bgcolor: alpha(theme.palette.brand.orange, 0.15),
                        color: theme.palette.brand.orangeDark,
                        fontWeight: 600,
                        fontSize: "0.875rem",
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
