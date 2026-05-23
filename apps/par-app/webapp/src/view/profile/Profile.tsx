// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import PersonIcon from "@mui/icons-material/Person";
import { Fade, Grid, IconButton, Paper, Typography } from "@mui/material";

import { EmployeeProfileCard } from "./components/EmployeeProfileCard";

const Profile = () => {
  return (
    <Fade in={true}>
      <Grid>
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
            size={{ md: 12, xs: 12 }}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              margin: "10px",
            }}
          >
            <Grid
              size={{ xs: 12, md: 6 }}
              style={{
                display: "flex",
                justifyContent: "left",
              }}
            >
              <IconButton color="primary" component="label" onClick={() => {}}>
                <PersonIcon fontSize="large" />
              </IconButton>
              <Typography variant="h4" sx={{ marginTop: "12px", marginLeft: "10px" }}>
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
