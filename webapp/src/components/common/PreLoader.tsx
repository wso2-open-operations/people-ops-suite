// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Box, Container, LinearProgress, useTheme } from "@mui/material";
import { tokens } from "../../theme";

interface PreLoaderProps {
  message: string | null;
  hideLogo?: boolean;
  isLoading?: boolean;
}

const PreLoader = (props: PreLoaderProps) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box
      sx={{
        background: colors.customColors.lightGray,
        display: "flex",
        pt: "20vh",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Container maxWidth="md">
        <Box>
          <Grid
            container
            direction="column"
            justifyContent="center"
            alignItems="center"
            spacing={2}
          >
            <Grid item xs={12}>
              {!props.hideLogo && (
                <img
                  alt="logo"
                  width="250"
                  height="auto"
                  src="/pre_load.svg"
                ></img>
              )}
            </Grid>
            <Grid item xs={12}></Grid>

            <Grid item xs={12}>
              <Typography variant="h4">{props.message}</Typography>
            </Grid>
            <Grid item xs={12}></Grid>
            <Grid item xs={12}>
              {props.isLoading && <LinearProgress sx={{ width: "100px" }} />}
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default PreLoader;
