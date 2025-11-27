import React from "react";
import { Box, styled } from "@mui/material";

const Dot = styled("span")(({ theme, delay }) => ({
  display: "inline-block",
  width: 8,
  height: 8,
  margin: "0 4px",
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  animation: `dotWave 1.4s infinite ease-in-out`,
  animationDelay: delay,
  "@keyframes dotWave": {
    "0%, 80%, 100%": {
      transform: "scale(0)",
    },
    "40%": {
      transform: "scale(1)",
    },
  },
}));

const ThreeDotWave = () => {
  return (
    <Box display="flex" alignItems="center">
      <Dot delay="0s" />
      <Dot delay="0.2s" />
      <Dot delay="0.4s" />
    </Box>
  );
};

export default ThreeDotWave;
