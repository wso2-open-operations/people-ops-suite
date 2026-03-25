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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useEffect, useMemo, useState } from "react";

import EmployeeChip from "@component/common/EmployeeChip";
import ErrorComponent from "@component/ui/ErrorComponent";
import { LoadingEffect } from "@component/ui/Loading";
import { uiMessages } from "@config/constant";
import ThreeSixtyFeedbackSection from "@root/src/view/leadPortal/components/FeedbackComponent";
import { selectUserEmail } from "@slices/authSlice/auth";
import {
  ParSpecialRating,
  fetchHistoryParRatingOfEmployee,
  fetchHistoryReviews,
  fetchParticipatedParCyclesOfEmployee,
  resetEmpRatingHistorySate,
  resetEmpReviewHistorySate,
  selectEmployeeHistoryRating,
  selectEmployeeHistoryRatingStatus,
  selectEmployeeHistoryReviewStatus,
  selectParticipatedParCyclesOfEmployee,
  selectParticipatedParCyclesOfEmployeeState,
} from "@slices/employeeHistorySlice/employeeHistory";
import {
  Employee,
  fetchEntityEmployees,
  resetParticipants,
  selectEmployeeMap,
  selectSubordinates,
  selectSubordinatesArray,
} from "@slices/metaSlice/meta";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { fetchReviews } from "@slices/threeSixtyReviewSlice/threeSixtyReview";
import { RequestState } from "@utils/types";

import CommentPaper from "./CommentPaper";
import NoDataView from "./NoDataView";

const DEFAULT_CYCLE_ID = -1;

const EmployeeHistoryView = () => {
  const dispatch = useAppDispatch();
  const [inputValue, setInputValue] = useState("");
  const userEmail = useAppSelector(selectUserEmail);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const employeeArray = useAppSelector(selectSubordinatesArray);
  const ratings = useAppSelector(selectEmployeeHistoryRating);
  const [cycleID, setCycleID] = useState<number>(DEFAULT_CYCLE_ID);
  const employeeArrayStatus = useAppSelector(selectSubordinates);
  const ratingsStatus = useAppSelector(selectEmployeeHistoryRatingStatus);
  const reviewsStatus = useAppSelector(selectEmployeeHistoryReviewStatus);
  const allCycles = useAppSelector(selectParticipatedParCyclesOfEmployee);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const cycleLoadingState = useAppSelector(selectParticipatedParCyclesOfEmployeeState);
  const selectedEmployeeEmail = selectedEmployee?.workEmail;
  const empThumbnail = selectedEmployeeEmail
    ? employeeMap[selectedEmployeeEmail]?.employeeThumbnail
    : undefined;
  const empName = selectedEmployeeEmail
    ? (employeeMap[selectedEmployeeEmail]?.employeeName ?? selectedEmployeeEmail)
    : "Select a subordinate";

  useEffect(
    () => {
      if (userEmail) {
        dispatch(fetchParticipatedParCyclesOfEmployee({}));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Fetch participants when cycle is selected
  useEffect(() => {
    if (cycleID !== DEFAULT_CYCLE_ID && userEmail) {
      dispatch(fetchEntityEmployees({ leadEmail: userEmail }));
      setSelectedEmployee(null);
    }
  }, [cycleID, userEmail, dispatch]);

  useEffect(() => {
    if (cycleID !== DEFAULT_CYCLE_ID && selectedEmployeeEmail) {
      dispatch(
        fetchHistoryParRatingOfEmployee({
          employeeId: selectedEmployeeEmail,
          parCycleId: cycleID,
        }),
      );
      dispatch(
        fetchHistoryReviews({
          employeeId: selectedEmployeeEmail,
          parCycleId: cycleID,
        }),
      );
      dispatch(fetchReviews({ employeeId: selectedEmployeeEmail, parCycleId: cycleID }));
    }
  }, [selectedEmployeeEmail, cycleID, dispatch]);

  const formatString = (str: string | undefined): string => {
    if (!str?.trim() || str === "NA") return "-";
    if (str.includes("@") || str.length < 3) return str;

    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const hasContent = (str: string | undefined): boolean => {
    return !!str?.trim();
  };

  const handleCycleChange = (cycleId: number) => {
    setCycleID(cycleId);
  };

  const handleEmployeeSelection = (employee: Employee | null) => {
    setSelectedEmployee(employee);
    setInputValue("");
  };

  useEffect(
    () => {
      return () => {
        dispatch(resetEmpRatingHistorySate());
        dispatch(resetEmpReviewHistorySate());
        dispatch(resetParticipants());
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const filteredEmployees = useMemo(() => {
    const searchTerm = inputValue.toLowerCase();

    // If inputValue matches the selected value exactly, show full list again
    if (
      selectedEmployee &&
      inputValue === `${selectedEmployee.employeeName} (${selectedEmployee.workEmail})`
    ) {
      return employeeArray.filter((emp) => emp.workEmail !== userEmail);
    }

    return employeeArray.filter(
      (employee) =>
        employee.workEmail !== userEmail &&
        (employee.employeeName.toLowerCase().includes(searchTerm) ||
          employee.workEmail.toLowerCase().includes(searchTerm)),
    );
  }, [employeeArray, userEmail, inputValue, selectedEmployee]);

  const isLoading =
    cycleLoadingState === RequestState.LOADING ||
    employeeArrayStatus === RequestState.LOADING ||
    ratingsStatus === RequestState.LOADING ||
    reviewsStatus === RequestState.LOADING;

  const hasError =
    cycleLoadingState === RequestState.FAILED ||
    employeeArrayStatus === RequestState.FAILED ||
    ratingsStatus === RequestState.FAILED ||
    reviewsStatus === RequestState.FAILED;

  const showEmployeeDetails =
    cycleLoadingState === RequestState.SUCCEEDED &&
    selectedEmployeeEmail &&
    ratingsStatus === RequestState.SUCCEEDED &&
    reviewsStatus === RequestState.SUCCEEDED;

  const hasRatings =
    ratings.parSpecialRating !== ParSpecialRating.NONE ||
    ratings.parRating !== ParSpecialRating.NONE;

  return (
    <Box
      sx={{
        maxWidth: "1000px",
        minHeight: "70vh",
        margin: "0 auto",
        padding: 1,
        overflow: "auto",
      }}
    >
      <Stack display="flex" direction="row" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <TextField
          select
          sx={{ width: "50%" }}
          SelectProps={{ native: true }}
          variant="outlined"
          disabled={cycleLoadingState === RequestState.LOADING || allCycles.length === 0}
          value={cycleID}
          onChange={(e) => handleCycleChange(Number(e.target.value))}
        >
          {allCycles.length > 0 &&
            allCycles.map((cycle) => (
              <option key={cycle.parCycleId} value={cycle.parCycleId}>
                {cycle.parCycleName}
              </option>
            ))}
          {allCycles.length === 0 ? (
            <option value="-1">No previous par cycles found</option>
          ) : (
            <option value="-1">Please select a par cycle</option>
          )}
        </TextField>
        <Autocomplete
          sx={{ width: "50%" }}
          options={filteredEmployees}
          getOptionLabel={(option) => `${option.employeeName} (${option.workEmail})`}
          loading={employeeArrayStatus === RequestState.LOADING}
          disabled={employeeArrayStatus === RequestState.LOADING || cycleID === DEFAULT_CYCLE_ID}
          value={selectedEmployee}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
          onChange={(_, newValue) => {
            handleEmployeeSelection(newValue);
            if (newValue) {
              setInputValue(`${newValue.employeeName} (${newValue.workEmail})`);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} placeholder="Select an employee" fullWidth />
          )}
          ListboxProps={{ style: { maxHeight: "400px" } }}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box display="flex" alignItems="center" gap={2} width="100%">
                <Avatar
                  src={employeeMap[option.workEmail]?.employeeThumbnail}
                  alt={option.employeeName}
                  sx={{ height: "2.2rem", width: "2.2rem" }}
                />
                <Box>
                  <Typography variant="body1">{option.employeeName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.workEmail}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        />
      </Stack>

      {isLoading && <LoadingEffect message={uiMessages.loading.pageLoading} />}

      {hasError && <ErrorComponent />}

      {!isLoading && !showEmployeeDetails && !hasError && (
        <NoDataView text={"Choose a PAR cycle and subordinate to view previous PAR's."} />
      )}
      {showEmployeeDetails && (
        <>
          <Grid container spacing={2} sx={{ mt: 3, mb: 2 }}>
            <Grid size={{ xs: "auto" }}>
              <Avatar
                variant="rounded"
                src={empThumbnail}
                alt="Employee Thumbnail"
                sx={{ width: 100, height: 100 }}
              />
            </Grid>

            {hasRatings && (
              <Grid size={{ xs: "auto" }}>
                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {ratings.parSpecialRating !== ParSpecialRating.NONE && (
                      <EmployeeChip
                        isSpecial={true}
                        isFromLead={false}
                        text={ratings.parSpecialRating!}
                      />
                    )}
                    {ratings.parRating !== ParSpecialRating.NONE && (
                      <EmployeeChip isSpecial={false} isFromLead={true} text={ratings.parRating!} />
                    )}
                  </Box>
                  {ratings.parRatingSharedBy && (
                    <Box mt={1}>
                      <Chip size="small" label={` PAR shared by: ${ratings.parRatingSharedBy} `} />
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            <EmployeeInfoGridItem
              title={empName}
              subtitle1="Employee"
              subtitle2={selectedEmployeeEmail}
            />

            <EmployeeInfoGridItem
              title={formatString(employeeMap[ratings.parLeadEmail ?? ""]?.employeeName)}
              subtitle1="Lead"
              subtitle2={formatString(ratings.parLeadEmail)}
            />

            <EmployeeInfoGridItem
              title={formatString(ratings.parTeam)}
              subtitle1="Team"
              subtitle2={formatString(ratings.parDepartment)}
            />
          </Grid>

          <Divider sx={{ my: 2 }} />

          <CommentAccordion
            title="Employee PAR"
            comment={ratings.parEmployeeComment}
            disabled={!hasContent(ratings.parEmployeeComment)}
          />

          <CommentAccordion
            title="Lead's Feedback"
            comment={ratings.parLeadComment}
            disabled={!hasContent(ratings.parLeadComment)}
          />

          {hasContent(ratings.parAdminComment) && (
            <CommentAccordion title="Admin Comment" comment={ratings.parAdminComment} />
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mt: 2 }}>
            <ThreeSixtyFeedbackSection isAdminsSelfProfile={false} />
          </Box>
        </>
      )}
    </Box>
  );
};

const EmployeeInfoGridItem = ({
  title,
  subtitle1,
  subtitle2,
}: {
  title: string;
  subtitle1: string;
  subtitle2: string;
}) => (
  <Grid size={{ xs: "auto" }}>
    <Box>
      <Typography variant="body1">{title || "-"}</Typography>
      <Typography variant="subtitle2" color="textSecondary">
        {subtitle1}
      </Typography>
      <Typography variant="subtitle2" color="textSecondary">
        {subtitle2 || "-"}
      </Typography>
    </Box>
  </Grid>
);

const CommentAccordion = ({
  title,
  comment,
  disabled = false,
}: {
  title: string;
  comment?: string;
  disabled?: boolean;
}) => (
  <Accordion disabled={disabled} sx={{ mt: 1 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>{title}</AccordionSummary>
    <AccordionDetails>
      <Divider sx={{ my: 1 }} />
      <CommentPaper comment={comment} />
    </AccordionDetails>
  </Accordion>
);

export default EmployeeHistoryView;
