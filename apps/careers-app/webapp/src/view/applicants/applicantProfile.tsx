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

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  Button,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useAppSelector } from "@slices/store";

export default function ApplicantProfile() {
  const theme = useTheme();
  const applicant = useAppSelector((s) => s.applicant.applicantProfile);

  if (!applicant) return null;

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      <Box textAlign="center" mb={4}>
        <Avatar
          src={applicant.profile_photo || ""}
          sx={{
            width: 120,
            height: 120,
            mx: "auto",
            bgcolor: theme.palette.brand.orange + "20",
            fontSize: 40,
          }}
        >
          {applicant.first_name?.[0]?.toUpperCase()}
        </Avatar>
        <Typography variant="h4" mt={2}>
          {applicant.first_name} {applicant.last_name}
        </Typography>
        <Typography color="text.secondary">{applicant.email}</Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Contact Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography>
                <strong>Phone:</strong> {applicant.phone || "-"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography>
                <strong>Country:</strong> {applicant.country || "-"}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                <strong>Address:</strong> {applicant.address || "-"}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Resume
          </Typography>
          {applicant.resume_link ? (
            <Button
              href={applicant.resume_link}
              target="_blank"
              sx={{
                color: theme.palette.brand.orangeDark,
                fontWeight: "bold",
              }}
            >
              View Resume
            </Button>
          ) : (
            <Typography color="text.secondary">No resume uploaded</Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

