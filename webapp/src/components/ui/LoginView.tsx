// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import {
  Box,
  Container,
  useTheme,
  Card,
  CardContent,
  Divider,
  Stack,
} from "@mui/material";
import { asgardeoLogoUrl, choreoLogoUrl, wso2LogoUrl } from "@config/constant";
import { tokens } from "../../theme";
import LoadingButton from "@mui/lab/LoadingButton";

interface PreLoaderProps {
  hideLogo?: boolean;
  action: () => void;
}

const LoginView = (props: PreLoaderProps) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box
      sx={{
        backgroundImage: "url('./login-bg.png')",
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        justifyContent: "center",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Container fixed maxWidth="xs">
        <Card
          elevation={24}
          sx={{
            borderRadius: 3,
            pt: 3,
            mx: 1,
            backgroundColor: "white",
          }}
        >
          <CardContent>
            <Box
              sx={{
                px: 1,
                backgroundColor: "white",
              }}
            >
              <Grid
                container
                direction="column"
                justifyContent="center"
                alignItems="center"
                spacing={2}
                p={1}
              >
                <Grid item xs={12}>
                  <img
                    alt="logo"
                    width="130"
                    height="auto"
                    src={wso2LogoUrl}
                  ></img>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    align="center"
                    sx={{ fontWeight: "bold" }}
                    variant="h5"
                    color={"black"}
                  >
                    PAR App
                  </Typography>
                </Grid>
                <Grid item xs={12} sx={{ pb: 2 }}>
                  <Typography
                    align="center"
                    sx={{ fontSize: "1em" }}
                    color={"black"}
                    fontWeight={"400"}
                  >
                    Empower Performance
                    <br /> Elevate Success
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <LoadingButton
                    variant="contained"
                    sx={{
                      fontWeight: "bold",
                      backgroundColor: colors.customColors.orange,
                      "&:hover": {
                        backgroundColor: colors.customColors.orange,
                      },
                    }}
                    onClick={() => props.action()}
                  >
                    LOG IN
                  </LoadingButton>
                </Grid>
                <Grid item xs={12} mt={6}>
                  <Stack direction="column" spacing={2}>
                    <Typography align="center" color={"black"}>
                      Powered By
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Box
                        display="flex"
                        gap={2}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <img
                          alt="logo"
                          width="100"
                          height={22}
                          src={asgardeoLogoUrl}
                          style={{ paddingBottom: 5 }}
                        />
                        <img
                          alt="logo"
                          width="100"
                          height="auto"
                          src={choreoLogoUrl}
                        />
                      </Box>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={12} mt={3}>
                  <Typography sx={{ fontSize: "0.8em" }} color={"GrayText"}>
                    © {new Date().getFullYear()} WSO2 LLC
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
          <Divider />
        </Card>
      </Container>
    </Box>
  );
};

export default LoginView;
