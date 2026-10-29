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

import { Box, LinearProgress, Typography } from "@wso2/oxygen-ui";
import { Navigate, useSearchParams } from "react-router-dom";

import { useEffect } from "react";

import { useAppAuthContext } from "@context/AuthContext";
import { isValidEmail } from "@utils/email";

// The entry of the link in the email sent after applying: it opens the Asgardeo sign-in right away, where the
// candidate can also create an account. A valid ?email= in the link is filled in there.
const Landing = () => {
  const { isSignedIn, appSignIn } = useAppAuthContext();
  const [params] = useSearchParams();
  const emailParam = params.get("email")?.trim() ?? "";
  const email = isValidEmail(emailParam) ? emailParam : undefined;

  useEffect(() => {
    if (!isSignedIn) appSignIn(email);
  }, [isSignedIn, appSignIn, email]);

  if (isSignedIn) return <Navigate to="/applications" replace />;

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <LinearProgress color="primary" sx={{ width: { xs: "70%", sm: 530 }, borderRadius: 1 }} />
      <Typography variant="body2" color="text.secondary">
        Authenticating...
      </Typography>
    </Box>
  );
};

export default Landing;
