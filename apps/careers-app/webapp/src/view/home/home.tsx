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

import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

import HeroImage from "@assets/images/wso2-careers-hero-image.svg";
import InternshipImage from "@assets/images/interns-wso2-careers.svg";
import ProfileBannerImage from "@assets/images/profile-banner-1.svg";
import SupportedImage from "@assets/images/WSO2-Career-Supported-distribution.svg";
import CourageImage from "@assets/images/WSO2-Career-Courageous-Honesty.svg";
import PurposeImage from "@assets/images/WSO2-Career-Purpose-Passion.svg";
import OneTeamImage from "@assets/images/WSO2-Career-One-Team.svg";
import EmployeesImage from "@assets/images/wso2-employees.svg";

import BannerCarousel, { BannerSlide } from "@component/common/BannerCarousel";

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();

  const heroSlides: BannerSlide[] = [
    {
      title: "WSO2 Careers: Where Passion Meets Purpose",
      description:
        "Our culture is powered by one simple value: treat people the way you want to be treated. This means we treat everyone in a fair, open, honest and respectful manner from the moment you apply for a role at WSO2.",
      buttonText: "View Open Positions",
      buttonAction: () => navigate("/vacancies"),
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
      title: "Join Our Journey: Build the Future with Us",
      description:
        "Our culture is powered by one simple value: treat people the way you want to be treated. This means we treat everyone in a fair, open, honest and respectful manner from the moment you apply for a role at WSO2.",
      buttonText: "Learn More",
      buttonAction: () => navigate("/"),
      image: EmployeesImage,
    },
  ];

  const maxims = [
    {
      image: SupportedImage,
      title: "Trust and Openness",
      description:
        "Share knowledge, information, give and receive feedback, and refrain from micromanaging teams.",
    },
    {
      image: CourageImage,
      title: "Courageous Honesty",
      description:
        "We don't have hidden agendas, we're honest with ourselves and others, and discuss successes and failures openly.",
    },
    {
      image: PurposeImage,
      title: "Purpose and Passion",
      description:
        "We live in a culture of transparency where performance and meaningful contribution are valued over tenure.",
    },
    {
      image: OneTeamImage,
      title: "One Team",
      description:
        "We don't have silos for egos - we respect each other, even if we disagree, and focus on solutions instead of problems.",
    },
  ];

  const interviewSteps = [
    {
      step: "Step 1",
      title: "Initial Interviews",
      description:
        "Each candidate goes through three independent, first-level interviews. Reasons for votes are provided to ensure transparency.",
    },
    {
      step: "Step 2",
      title: "Team Leadership",
      description:
        "Candidates with at least two +1 votes move to the level where they meet respective team directors. Meet the HR team to discuss employee benefits and work culture.",
    },
    {
      step: "Step 3",
      title: "Founder & CEO",
      description:
        "Meet the Founder & CEO. This conversation will focus on WSO2's culture and the ushering year's important to us.",
    },
  ];

  const [activeStep, setActiveStep] = React.useState(0);
  const steps = interviewSteps;

  return (
    <Box sx={{ overflow: "hidden", mx: "-24px", mt: "-24px" }}>
      {/* Hero Carousel Section */}
      <BannerCarousel
        slides={heroSlides}
        autoPlayInterval={5000}
        showIndicators={true}
      />

      {/* Our Maxims Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h2"
            fontWeight="700"
            gutterBottom
            sx={{
              fontSize: { xs: "1.75rem", md: "2rem" },
              color: theme.palette.brand.orangeDark,
            }}
          >
            Our Maxims
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 800, mx: "auto", fontSize: "0.95rem" }}
          >
            We have no office rules and our culture is our way of life. Our four
            maxims guide us in how we treat each other across our global team.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {maxims.map((maxim, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid #E0E0E0",
                  borderRadius: 2,
                  boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
                }}
              >
                <CardContent
                  sx={{
                    p: 7,
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={maxim.image}
                    alt={maxim.title}
                    sx={{
                      mb: 2,
                      width: 80,
                      height: 80,
                      objectFit: "contain",
                    }}
                  />
                  <Typography
                    variant="h5"
                    fontWeight="700"
                    gutterBottom
                    sx={{ fontSize: "1.1rem", mb: 2 }}
                  >
                    {maxim.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}
                  >
                    {maxim.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Internships Section */}
      <Box sx={{ bgcolor: theme.palette.background.banner }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={InternshipImage}
                alt="Interns"
                sx={{
                  width: "100%",
                  maxWidth: 500,
                  height: "auto",
                  mx: "auto",
                  display: "block",
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                fontWeight="700"
                gutterBottom
                sx={{ fontSize: { xs: "1.75rem", md: "2rem" } }}
              >
                Internships
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 3, fontSize: "0.95rem", lineHeight: 1.6 }}
              >
                We empower interns to develop their skills and contribute to
                innovative projects in a dynamic and collaborative environment.
              </Typography>
              <Button
                variant="contained"
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
                    boxShadow: "none",
                  },
                }}
              >
                Learn More
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Interview Process Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <Box sx={{ textAlign: "center", mb: 5 }}>
          <Typography
            variant="h2"
            fontWeight="700"
            sx={{
              fontSize: { xs: "1.75rem", md: "2rem" },
              color: theme.palette.brand.orangeDark,
              mb: 2,
            }}
          >
            Interview Process
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              maxWidth: 900,
              mx: "auto",
              fontSize: "0.95rem",
              lineHeight: 1.6,
            }}
          >
            The interview process at WSO2 involves multiple conversations about
            your qualifications, skills, and what motivates you. It's a chance
            for us to ensure you're a strong match for our company culture, and
            just as importantly, it allows you to determine if WSO2 aligns with
            your own career aspirations.
          </Typography>
        </Box>

        {/* Stepper */}
        <Box sx={{ maxWidth: 1100, mx: "auto", position: "relative" }}>
          {/* Full background line */}
          <Box
            sx={{
              position: "absolute",
              top: 38,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: theme.palette.background.banner,
              zIndex: 1,
            }}
          />

          {/* Progress line */}
          <Box
            sx={{
              position: "absolute",
              top: 38,
              left: 0,
              height: 3,
              bgcolor: theme.palette.brand.orange,
              width: `${(activeStep / (steps.length - 1)) * 100}%`,
              zIndex: 2,
              transition: "0.3s ease",
            }}
          />

          <Grid
            container
            justifyContent="space-between"
            sx={{ position: "relative", zIndex: 3 }}
          >
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <Grid item xs={4} key={index} textAlign="center">
                  <Box
                    onClick={() => setActiveStep(index)}
                    sx={{ cursor: "pointer" }}
                  >
                    <Box
                      sx={{
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.background.paper,
                        border: `3px solid ${
                          isActive || isCompleted
                            ? theme.palette.brand.orange
                            : theme.palette.divider
                        }`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: 700,
                        color:
                          isActive || isCompleted
                            ? theme.palette.brand.orange
                            : theme.palette.text.secondary,
                        fontSize: "1.1rem",
                        transition: "0.3s",
                        boxShadow: isActive
                          ? "0px 4px 15px rgba(255,102,0,0.25)"
                          : "none",
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Typography
                      variant="subtitle1"
                      fontWeight="700"
                      sx={{ mt: 2, mb: 1 }}
                    >
                      {step.title}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>

        {/* Step Details Card (Only active step visible) */}
        <Box sx={{ mt: 5, maxWidth: 900, mx: "auto" }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background:
                theme.palette.mode === "light"
                  ? "linear-gradient(180deg, #FFF7F1, #FFFFFF)"
                  : `linear-gradient(180deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
              boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h5"
              fontWeight="700"
              sx={{ mb: 2, color: theme.palette.brand.orangeDark }}
            >
              {steps[activeStep].title}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ lineHeight: 1.7, fontSize: "0.95rem" }}
            >
              {steps[activeStep].description}
            </Typography>
          </Paper>
        </Box>
      </Container>

      {/* Glassdoor Section */}
      <Box
        sx={{ bgcolor: theme.palette.background.banner, py: { xs: 6, md: 8 } }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={EmployeesImage}
                alt="WSO2 Employees"
                sx={{
                  width: "100%",
                  maxWidth: 500,
                  height: "auto",
                  mx: "auto",
                  display: "block",
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                fontWeight="700"
                sx={{
                  fontSize: { xs: "1.75rem", md: "2.25rem" },
                  mb: 2,
                  lineHeight: 1.3,
                }}
              >
                What Employees Say in
              </Typography>
              <Typography
                variant="h2"
                fontWeight="700"
                sx={{
                  fontSize: { xs: "2rem", md: "2.5rem" },
                  color: "#00a264",
                  mb: 4,
                  fontStyle: "italic",
                }}
              >
                'GLASSDOOR'
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: theme.palette.brand.orange,
                  color: "white",
                  px: 5,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 1,
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": {
                    bgcolor: theme.palette.brand.orangeDark,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  },
                }}
                onClick={() =>
                  window.open(
                    "https://www.glassdoor.com/Reviews/WSO2-Reviews-E327184.htm",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Learn More
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
