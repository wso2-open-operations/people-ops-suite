// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Typography, Grid, IconButton, Fade, Paper } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { EmployeeProfileCard } from "./components/EmployeeProfileCard";

const Profile = () => {
  return (
    <Fade in={true}>
      <Grid item>
        <Paper
          className="paper"
          variant="outlined"
          sx={{
            minHeight: "calc(100vh - 150px)",
            borderRadius: "5px",
            minWidth: "1200px",
          }}
        >
          <Grid
            item
            xs={12}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              margin: "10px",
            }}
          >
            <Grid
              item
              xs={12}
              style={{
                display: "flex",
                justifyContent: "left",
              }}
            >
              <IconButton color="primary" component="label" onClick={() => {}}>
                <PersonIcon fontSize="large" />
              </IconButton>
              <Typography
                variant="h4"
                sx={{ marginTop: "12px", marginLeft: "10px" }}
              >
                Profile
              </Typography>
            </Grid>
          </Grid>
          <EmployeeProfileCard />
        </Paper>
      </Grid>
    </Fade>
  );
};

export default Profile;
