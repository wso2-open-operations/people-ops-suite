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

import { Box, Button, Typography } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { useEffect, useState } from "react";

import { PAGE_MAX_WIDTH } from "@config/brand";
import { useAppAuthContext } from "@context/AuthContext";
import { loadJobDetail, toggleSaveJob } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import ApplySection from "@view/jobs/components/ApplySection";
import JobDescription from "@view/jobs/components/JobDescription";
import JobDetailSkeleton from "@view/jobs/components/JobDetailSkeleton";
import JobHero from "@view/jobs/components/JobHero";

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Browser-back keeps the list's search and filters; a directly opened job has no history to go back to.
  const goBackToJobs = () => (location.key !== "default" ? navigate(-1) : navigate("/jobs"));
  const dispatch = useAppDispatch();
  const { getToken: getAccessToken, isSignedIn } = useAppAuthContext();

  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const detail = useAppSelector((state: RootState) => (id ? state.careers.jobDetails[id] : undefined)) ?? null;

  const [loading, setLoading] = useState(!detail);
  const [error, setError] = useState(false);

  // A link ending in #Apply-Now opens straight at the form. The short delay lets the shell's
  // scroll-to-top on navigation happen first.
  useEffect(() => {
    if (!detail || window.location.hash !== "#Apply-Now") return;
    const timer = setTimeout(() => document.getElementById("Apply-Now")?.scrollIntoView(), 100);
    return () => clearTimeout(timer);
  }, [detail]);

  useEffect(() => {
    if (!id || detail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getAccessToken()
      .then((token) => dispatch(loadJobDetail({ accessToken: token, jobId: id })).unwrap())
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id, detail, dispatch, getAccessToken]);

  if (loading) return <JobDetailSkeleton />;

  if (error || !detail) {
    return (
      <Box>
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography variant="h5" mb={2} color="text.primary">
            Failed to load job details.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/jobs")}>
            Back to Jobs
          </Button>
        </Box>
      </Box>
    );
  }

  const isSaved = savedJobIds.includes(detail.id);

  const scrollToApplyForm = () => {
    // Updates the address bar without adding a history entry, so the back button still returns to the list.
    window.history.replaceState(window.history.state, "", `${location.pathname}${location.search}#Apply-Now`);
    document.getElementById("Apply-Now")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Box>
      <JobHero
        detail={detail}
        isSignedIn={isSignedIn}
        isSaved={isSaved}
        onBack={goBackToJobs}
        onApplyNow={scrollToApplyForm}
        onToggleSave={() => dispatch(toggleSaveJob(detail.id))}
        onSeeAllRoles={() => navigate("/jobs")}
      />

      <Box sx={{ maxWidth: PAGE_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 5, md: 7 } }}>
        <JobDescription
          mainContent={detail.mainContent}
          taskInformation={detail.taskInformation}
          additionalContent={detail.additionalContent}
        />
        <ApplySection detail={detail} />
      </Box>
    </Box>
  );
};

export default JobDetail;
