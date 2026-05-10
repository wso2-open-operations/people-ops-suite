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

import React, { SyntheticEvent, useCallback, useState } from "react";

import {
  Autocomplete,
  Avatar,
  Chip,
  CircularProgress,
  TextField
} from "@mui/material";

import { RequestState } from "@utils/types";

import { selectUserEmail } from "@slices/authSlice/auth";
import {
  selectEmployeeArray,
  selectEmployeeMap,
  selectEmployeeMapStatus,
} from "@slices/metaSlice/meta";
import { useAppSelector } from "@slices/store";
import { selectThreeSixtyReviewers } from "@slices/threeSixtyReviewSlice/threeSixtyReview";

const emailRegex = /^[^\s@]+@wso2\.com$/;

interface EmailAutocompleteProps {
  value: string[];
  onChange: (emails: string[]) => void;
  onBlur: () => void;
  error?: boolean;
  helperText?: string;
  emailsToSkip: string[];
}

export const EmailAutocomplete = ({
  value,
  onChange,
  onBlur,
  error,
  helperText,
  emailsToSkip,
}: EmailAutocompleteProps) => {
  const emailLoadingState = useAppSelector(selectEmployeeMapStatus);
  const employeeArray = useAppSelector(selectEmployeeArray);
  const employeeMap = useAppSelector(selectEmployeeMap);
  const ownEmail = useAppSelector(selectUserEmail);
  const reviewers = useAppSelector(selectThreeSixtyReviewers);

  // State for controlling the open state of the autocomplete
  const [open, setOpen] = useState(false);
  // State for the current input value
  const [inputValue, setInputValue] = useState("");

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (_event: SyntheticEvent<Element, Event>, newValue: string[]) => {
      onChange(newValue);
      if (newValue.length > 0) {
        setInputValue("");
      }
    },
    [onChange],
  );

  const handleInputChange = useCallback((_event: SyntheticEvent<Element, Event>, value: string) => {
    setInputValue(value);
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent) => {
      const pastedText = event.clipboardData.getData("text");

      // Get valid employee emails from the dropdown
      const validEmployeeEmails = employeeArray.map((employee) => employee.workEmail);

      if (pastedText.includes(",") || pastedText.includes(";") || pastedText.includes("\n")) {
        event.preventDefault();

        // Split by separators: comma, semicolon, newline, space
        const pastedEmails = pastedText
          .split(/[,;\n\s]+/)
          .map((email) => email.replace(/[^a-zA-Z0-9@._-]/g, "").trim())
          .filter((email) => email.length > 0 && emailRegex.test(email))
          .filter((email) => validEmployeeEmails.includes(email))
          .filter(
            (email) =>
              ![
                ownEmail,
                ...reviewers.map((reviewer) => reviewer.reviewerEmail),
                ...emailsToSkip,
              ].includes(email),
          );

        // Removing duplicates
        const newEmails = Array.from(new Set([...value, ...pastedEmails]));
        onChange(newEmails);
        setInputValue("");
      }
    },
    [value, onChange, ownEmail, reviewers, emailsToSkip, employeeArray],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Disable Enter key submission
      if (event.key === "Enter") {
        event.preventDefault();
        return;
      }

      // Get valid employee emails from the dropdown
      const validEmployeeEmails = employeeArray.map((employee) => employee.workEmail);

      // Handle comma or semicolon to add email
      if ((event.key === "," || event.key === ";") && inputValue.trim()) {
        event.preventDefault();
        const email = inputValue.trim().replace(/[,;]$/g, ""); // Remove trailing comma/semicolon

        if (
          emailRegex.test(email) &&
          validEmployeeEmails.includes(email) && // Only allow emails in employee list
          ![
            ownEmail,
            ...reviewers.map((reviewer) => reviewer.reviewerEmail),
            ...emailsToSkip,
          ].includes(email) &&
          !value.includes(email)
        ) {
          onChange([...value, email]);
          setInputValue("");
        }
      }
    },
    [inputValue, value, onChange, ownEmail, reviewers, emailsToSkip, employeeArray],
  );

  return (
    <Autocomplete
      id="email-autocomplete"
      open={open}
      onOpen={handleOpen}
      onClose={handleClose}
      isOptionEqualToValue={(option: string, optionValue) => option === optionValue}
      getOptionLabel={(option) => option}
      options={employeeArray
        .map((employee) => employee.workEmail)
        .filter(
          (email) =>
            ![
              ownEmail,
              ...reviewers.map((reviewer) => reviewer.reviewerEmail),
              ...emailsToSkip,
            ].includes(email),
        )}
      loading={emailLoadingState === RequestState.LOADING}
      multiple
      value={value}
      onChange={handleSelect}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onBlur={onBlur}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => (
          <Chip
            variant="outlined"
            label={
              <div style={{ display: "flex", alignItems: "center" }}>
                {employeeMap[option]?.employeeThumbnail && (
                  <Avatar
                    src={employeeMap[option].employeeThumbnail}
                    alt={option}
                    sx={{
                      marginRight: "8px",
                      marginLeft: "-8px",
                      width: 24,
                      height: 24,
                    }}
                  />
                )}
                {option}
              </div>
            }
            {...getTagProps({ index })}
            key={option}
          />
        ))
      }
      renderOption={(props, option) => (
        <li {...props}>
          <div style={{ display: "flex", alignItems: "center", height: 30 }}>
            <Avatar
              src={employeeMap[option]?.employeeThumbnail}
              alt={option}
              sx={{ marginRight: "8px", width: 24, height: 24 }}
            />
            {employeeMap[option]?.employeeName}
            <span style={{ color: "GrayText", marginLeft: 8 }}>{option}</span>
          </div>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search by email or paste comma-separated emails"
          error={error}
          helperText={helperText ?? "No emails found, Please refresh the window and try again."}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {emailLoadingState === RequestState.LOADING ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
};
