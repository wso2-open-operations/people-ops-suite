// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useState } from "react";
import { 
  Box, 
  Button, 
  Typography, 
  Stack, 
  useTheme, 
  Fade 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import { ParCreationForm } from "@view/adminPortal/components/ParCreationForm"; 

const OngoingPanel = () => {
  const theme = useTheme();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateClick = () => setIsCreating(true);
  const handleFormClose = () => setIsCreating(false);


  return (
    <Fade in={true}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "50vh",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Stack spacing={1} alignItems="center" maxWidth="sm">
          <Typography 
            variant="h4"
          >
            PAR cycle not in progress
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              maxWidth: "480px",
              // USING YOUR THEME TOKENS (lighter text for description):
              color: theme.palette.customText.primary.p3.active 
            }}
          >
            There is currently no active performance cycle. Initialize a new cycle to begin the evaluation process for this period.
          </Typography>
        </Stack>

        {/* Call to Action */}
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleCreateClick}
          sx={{
            padding: "10px 28px",
            fontSize: "1rem",
            marginTop: 2,
            boxShadow: theme.shadows[2],
            // The button colors are already handled by your theme.ts MuiButton override
            transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: theme.shadows[4],
            },
          }}
        >
          CREATE CYCLE
        </Button>
      </Box>
    </Fade>
  );
};

export default OngoingPanel;