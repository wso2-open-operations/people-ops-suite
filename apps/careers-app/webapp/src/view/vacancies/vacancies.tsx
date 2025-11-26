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
  Checkbox,
  FormControlLabel,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@slices/store";
import {
  fetchVacancies,
  fetchOrgStructure,
  setSelectedLocations,
  setSelectedTeams,
  clearFilters,
  VacancyBasicInfo,
} from "@slices/vacanciesSlice/vacancies";
import { State } from "@/types/types";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import HeroImage from "@assets/images/wso2-employees.svg";
import ProfileBannerImage from "@assets/images/profile-banner-1.svg";
import HeroImageCareer from "@assets/images/wso2-careers-hero-image.svg";

import BannerCarousel, { BannerSlide } from "@component/common/BannerCarousel";

export default function Vacancies() {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    filteredVacancies,
    orgStructure,
    vacanciesState,
    vacanciesError,
    orgStructureState,
    orgStructureError,
    selectedLocations,
    selectedTeams,
  } = useSelector((state: RootState) => state.vacancies);

  const heroSlides: BannerSlide[] = [
    {
      title: "Join Our Journey: Build the Future with Us",
      description:
        "Our culture is powered by one simple value: treat people the way you want to be treated. This means we treat everyone in a fair, open, honest and respectful manner from the moment you apply for a role at WSO2.",
      buttonText: "View Open Positions",
      buttonAction: () => {},
      image: HeroImage,
    },
    {
      title: "Showcase Your Talent with a WSO2 Profile",
      description:
        "Upload your CV, highlight your expertise, and manage your professional profile—all in one place. Let WSO2 discover the real you and match you with opportunities that fit your passion and potential.",
      buttonText: "Create Your Profile",
      buttonAction: () => navigate("/profile"),
      image: ProfileBannerImage,
    },
    {
      title: "WSO2 Careers: Where Passion Meets Purpose",
      description:
        "We empower talents to develop their skills and contribute to innovative projects in a dynamic and collaborative environment. Join our global team and make an impact.",
      buttonText: "Learn More",
      buttonAction: () => {},
      image: HeroImageCareer,
    },
  ];

  useEffect(() => {
    dispatch(fetchVacancies());
    dispatch(fetchOrgStructure());
  }, [dispatch]);

  const handleLocationChange = (location: string) => {
    const newLocations = selectedLocations.includes(location)
      ? selectedLocations.filter((loc: string) => loc !== location)
      : [...selectedLocations, location];
    dispatch(setSelectedLocations(newLocations));
  };

  const handleTeamChange = (team: string) => {
    const newTeams = selectedTeams.includes(team)
      ? selectedTeams.filter((t: string) => t !== team)
      : [...selectedTeams, team];
    dispatch(setSelectedTeams(newTeams));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const locations: string[] = orgStructure?.location_list
    ? Object.values(orgStructure.location_list)
    : [];
  const teams: string[] = orgStructure?.team_list
    ? Object.values(orgStructure.team_list)
    : [];

  return (
    <Box sx={{ overflow: "hidden", mx: "-24px", mt: "-24px" }}>
      {/* Hero Carousel Banner */}
      <BannerCarousel
        slides={heroSlides}
        autoPlayInterval={5000}
        showIndicators={true}
      />

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 6, px: { xs: 4, sm: 6, md: 8, lg: 10 } }}>
        <Grid container spacing={4}>
          {/* Filters Sidebar */}
          <Grid item xs={12} md={3}>
            <Box
              sx={{
                position: "sticky",
                top: 24,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 3,
                p: 3,
                bgcolor: theme.palette.background.paper,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                  pb: 2,
                  borderBottom: `2px solid ${theme.palette.divider}`,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="700"
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: "1.1rem",
                  }}
                >
                  Filters
                </Typography>
                {(selectedLocations.length > 0 || selectedTeams.length > 0) && (
                  <Button
                    size="small"
                    onClick={handleClearFilters}
                    sx={{
                      color: theme.palette.brand.orange,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      "&:hover": {
                        bgcolor: "rgba(255, 102, 0, 0.08)",
                      },
                    }}
                  >
                    Clear All
                  </Button>
                )}
              </Box>

              {/* Locations Filter */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <LocationOnIcon
                    sx={{
                      fontSize: 20,
                      color: theme.palette.brand.orange,
                    }}
                  />
                  Locations
                  {selectedLocations.length > 0 && (
                    <Chip
                      label={selectedLocations.length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        bgcolor: theme.palette.brand.orange,
                        color: "white",
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {locations.map((location) => (
                    <FormControlLabel
                      key={location}
                      control={
                        <Checkbox
                          checked={selectedLocations.includes(location)}
                          onChange={() => handleLocationChange(location)}
                          size="small"
                          sx={{
                            color: theme.palette.text.secondary,
                            "&.Mui-checked": {
                              color: theme.palette.brand.orange,
                            },
                            "&:hover": {
                              bgcolor: "rgba(255, 102, 0, 0.04)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {location}
                        </Typography>
                      }
                      sx={{
                        display: "flex",
                        width: "100%",
                        ml: 0,
                        mr: 0,
                        borderRadius: 1,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.02)",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Teams Filter */}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="700"
                  sx={{
                    mb: 2,
                    color: theme.palette.text.primary,
                    fontSize: "0.95rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <WorkIcon
                    sx={{
                      fontSize: 20,
                      color: theme.palette.brand.orange,
                    }}
                  />
                  Teams
                  {selectedTeams.length > 0 && (
                    <Chip
                      label={selectedTeams.length}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.7rem",
                        bgcolor: theme.palette.brand.orange,
                        color: "white",
                        fontWeight: 700,
                      }}
                    />
                  )}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {teams.map((team) => (
                    <FormControlLabel
                      key={team}
                      control={
                        <Checkbox
                          checked={selectedTeams.includes(team)}
                          onChange={() => handleTeamChange(team)}
                          size="small"
                          sx={{
                            color: theme.palette.text.secondary,
                            "&.Mui-checked": {
                              color: theme.palette.brand.orange,
                            },
                            "&:hover": {
                              bgcolor: "rgba(255, 102, 0, 0.04)",
                            },
                          }}
                        />
                      }
                      label={
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {team}
                        </Typography>
                      }
                      sx={{
                        display: "flex",
                        width: "100%",
                        ml: 0,
                        mr: 0,
                        borderRadius: 1,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.02)",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Vacancies List */}
          <Grid item xs={12} md={9}>
            {(vacanciesState === State.loading || orgStructureState === State.loading) && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  py: 8,
                }}
              >
                <CircularProgress sx={{ color: theme.palette.brand.orange }} />
              </Box>
            )}

            {vacanciesState === State.failed && vacanciesError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {vacanciesError}
              </Alert>
            )}

            {orgStructureState === State.failed && orgStructureError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {orgStructureError}
              </Alert>
            )}

            {vacanciesState === State.success && orgStructureState === State.success && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" fontWeight="700" gutterBottom>
                    Open Positions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filteredVacancies.length} position
                    {filteredVacancies.length !== 1 ? "s" : ""} available
                  </Typography>
                </Box>

                {filteredVacancies.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                      border: `1px dashed ${theme.palette.divider}`,
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      No vacancies found matching your filters
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={handleClearFilters}
                      sx={{
                        mt: 2,
                        color: theme.palette.brand.orange,
                        borderColor: theme.palette.brand.orange,
                        "&:hover": {
                          borderColor: theme.palette.brand.orangeDark,
                          bgcolor: "rgba(255, 102, 0, 0.04)",
                        },
                      }}
                    >
                      Clear Filters
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {filteredVacancies.map((vacancy: VacancyBasicInfo) => (
                      <Grid item xs={12} md={6} key={vacancy.id}>
                        <Card
                          elevation={0}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            height: "100%",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        >
                          <CardContent
                            sx={{
                              p: 3,
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                            }}
                          >
                            <Typography
                              variant="h4"
                              fontWeight="700"
                              gutterBottom
                              sx={{
                                color: theme.palette.text.primary,
                                mb: 2,
                                minHeight: "3rem",
                              }}
                            >
                              {vacancy.title}
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 2,
                                mb: 2,
                                flexGrow: 1,
                              }}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <WorkIcon
                                  sx={{
                                    fontSize: 19,
                                    color: theme.palette.text.secondary,
                                    mr: 0.5,
                                  }}
                                />
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  {vacancy.job_type}
                                </Typography>
                              </Box>

                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <LocationOnIcon
                                  sx={{
                                    fontSize: 18,
                                    color: theme.palette.text.secondary,
                                    mr: 0.5,
                                  }}
                                />
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  {vacancy.country.join(", ")}
                                </Typography>
                              </Box>

                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <AccessTimeIcon
                                  sx={{
                                    fontSize: 18,
                                    color: theme.palette.text.secondary,
                                    mr: 0.5,
                                  }}
                                />
                                <Typography
                                  variant="body1"
                                  color="text.secondary"
                                >
                                  {formatDate(vacancy.published_on)}
                                </Typography>
                              </Box>
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: 2,
                                flexWrap: "wrap",
                                gap: 2,
                              }}
                            >
                              <Chip
                                label={vacancy.team}
                                size="small"
                                sx={{
                                  bgcolor: theme.palette.background.banner,
                                  color: theme.palette.text.primary,
                                  fontWeight: 600,
                                  fontSize: "0.75rem",
                                }}
                              />

                              <Button
                                variant="contained"
                                onClick={() => navigate(`/vacancies/${vacancy.id}`)}
                                sx={{
                                  bgcolor: theme.palette.brand.orange,
                                  color: "white",
                                  px: 4,
                                  py: 1.2,
                                  fontSize: "0.95rem",
                                  fontWeight: 600,
                                  borderRadius: 1,
                                  textTransform: "none",
                                  boxShadow: "none",
                                  "&:hover": {
                                    bgcolor: theme.palette.brand.orangeDark,
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                  },
                                }}
                              >
                                Apply Now
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
