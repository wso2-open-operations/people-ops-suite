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

import { useState, useEffect } from "react";
import { Box, Typography, Button, Container, Grid, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export interface BannerSlide {
  title: string;
  description: string;
  buttonText: string;
  buttonAction: () => void;
  image: string;
}

interface BannerCarouselProps {
  slides: BannerSlide[];
  autoPlayInterval?: number; 
  showIndicators?: boolean;
}

export default function BannerCarousel({
  slides,
  autoPlayInterval = 5000,
  showIndicators = true,
}: BannerCarouselProps) {
  const theme = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play carousel effect
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [slides.length, autoPlayInterval]);

  // Clamp currentSlide if slides array shrinks
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Early return after all hooks
  if (!slides || slides.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: theme.palette.background.banner,
        py: { xs: 6, md: 8 },
        px: { xs: 3, md: 6 },
        minHeight: { xs: "500px", md: "600px" },
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          spacing={4}
          alignItems="center"
          sx={{ minHeight: { md: "450px" } }}
        >
          {/* Left Content */}
          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <Typography
                variant="h1"
                fontWeight="800"
                sx={{
                  fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" },
                  lineHeight: 1.2,
                  color: theme.palette.text.primary,
                  minHeight: { md: "150px" },
                }}
              >
                {slides[currentSlide].title}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: "0.95rem", md: "1rem" },
                  lineHeight: 1.6,
                  maxWidth: 550,
                  minHeight: { md: "120px" },
                }}
              >
                {slides[currentSlide].description}
              </Typography>

              <Box>
                <Button
                  variant="contained"
                  size="large"
                  onClick={slides[currentSlide].buttonAction}
                  sx={{
                    bgcolor: theme.palette.brand.orange,
                    color: "white",
                    px: 4,
                    py: 1.5,
                    fontSize: "1rem",
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
                  {slides[currentSlide].buttonText}
                </Button>
              </Box>
            </Stack>
          </Grid>

          {/* Right Image */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: { xs: "300px", md: "400px" },
              }}
            >
              <Box
                component="img"
                src={slides[currentSlide].image}
                alt="Banner"
                sx={{
                  width: "90%",
                  height: "90%",
                  maxHeight: "400px",
                  objectFit: "contain",
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Carousel Indicators */}
        {showIndicators && slides.length > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1.5,
              mt: 4,
            }}
          >
            {slides.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentSlide(index)}
                sx={{
                  width: currentSlide === index ? 40 : 12,
                  height: 12,
                  borderRadius: 6,
                  bgcolor:
                    currentSlide === index
                      ? theme.palette.brand.orange
                      : theme.palette.grey[300],
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor:
                      currentSlide === index
                        ? theme.palette.brand.orangeDark
                        : theme.palette.grey[400],
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
