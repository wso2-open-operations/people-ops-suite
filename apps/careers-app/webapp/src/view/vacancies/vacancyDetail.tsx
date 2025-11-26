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

import React, { useEffect } from "react";
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
  Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@slices/store";
import {
  fetchVacancyDetail,
  clearVacancyDetail,
} from "@slices/vacanciesSlice/vacancies";
import { State } from "@/types/types";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BusinessIcon from "@mui/icons-material/Business";

export default function VacancyDetail() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { id } = useParams<{ id: string }>();

  const { selectedVacancy: vacancy, vacancyDetailState, vacancyDetailError } = useSelector(
    (state: RootState) => state.vacancies
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchVacancyDetail(Number(id)));
    }
    return () => {
      dispatch(clearVacancyDetail());
    };
  }, [id, dispatch]);

  // Helper function to parse JSON content safely
  const parseContent = (content: string | null): any => {
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  };

  const mainContentParsed = vacancy ? parseContent(vacancy.mainContent) : null;
  const taskInformationParsed = vacancy
    ? parseContent(vacancy.taskInformation)
    : null;
  const additionalContentParsed = vacancy
    ? parseContent(vacancy.additionalContent)
    : null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  // Map the parsed data to display structure
  const mainContent = mainContentParsed || {};
  const taskInformation = taskInformationParsed || {};
  const additionalContent = additionalContentParsed || {};

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
                  variant="h4"
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

            {/* About the Role */}
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
                <Typography
                  variant="h5"
                  fontWeight="700"
                  gutterBottom
                  sx={{ color: theme.palette.brand.orangeDark, mb: 3 }}
                >
                  About the Role
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8, mb: 3 }}
                >
                  {mainContent?.aboutRole || "No description available"}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Your Key Responsibilities
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                  {mainContent?.keyResponsibilities?.map((item: string, index: number) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1.5,
                        "::marker": {
                          color: theme.palette.brand.orange,
                        },
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mt: 4, mb: 2 }}
                >
                  Customer-focused Work
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                  {mainContent?.customerFocusedWork?.map((item: string, index: number) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1.5,
                        "::marker": {
                          color: theme.palette.brand.orange,
                        },
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Qualifications and Skills */}
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
                <Typography
                  variant="h5"
                  fontWeight="700"
                  gutterBottom
                  sx={{ color: theme.palette.brand.orangeDark, mb: 3 }}
                >
                  Qualifications and Skills
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Educational Qualifications and Work Experience
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 2, mb: 3 }}>
                  {taskInformation?.qualifications?.map((item: string, index: number) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1.5,
                        "::marker": {
                          color: theme.palette.brand.orange,
                        },
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mt: 3, mb: 2 }}
                >
                  Technical Skills
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 2, mb: 3 }}>
                  {taskInformation?.technicalSkills?.map((item: string, index: number) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1.5,
                        "::marker": {
                          color: theme.palette.brand.orange,
                        },
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mt: 3, mb: 2 }}
                >
                  Communication Skills
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 2, mb: 3 }}>
                  {taskInformation?.communicationSkills?.map(
                    (item: string, index: number) => (
                      <Box
                        component="li"
                        key={index}
                        sx={{
                          mb: 1.5,
                          "::marker": {
                            color: theme.palette.brand.orange,
                          },
                        }}
                      >
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ lineHeight: 1.7 }}
                        >
                          {item}
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mt: 3, mb: 2 }}
                >
                  Leadership Skills
                </Typography>
                <Box component="ul" sx={{ pl: 2, mt: 2 }}>
                  {taskInformation?.leadershipSkills?.map((item: string, index: number) => (
                    <Box
                      component="li"
                      key={index}
                      sx={{
                        mb: 1.5,
                        "::marker": {
                          color: theme.palette.brand.orange,
                        },
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.7 }}
                      >
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Additional Information */}
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
                <Typography
                  variant="h5"
                  fontWeight="700"
                  gutterBottom
                  sx={{ color: theme.palette.brand.orangeDark, mb: 3 }}
                >
                  In Addition to a Competitive Compensation Package, WSO2 Offers:
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8, mb: 3 }}
                >
                  {additionalContent?.compensation || "Information not available"}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography
                  variant="h6"
                  fontWeight="700"
                  gutterBottom
                  sx={{ mb: 2 }}
                >
                  Diversity Drives Innovation:
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  {additionalContent?.diversity || "Information not available"}
                </Typography>
              </CardContent>
            </Card>
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
    </Box>
  );
}
