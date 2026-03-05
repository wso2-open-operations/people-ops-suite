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

import React from "react";
import { Grid, Chip } from "@mui/material";
import StarRateIcon from "@mui/icons-material/StarRate";
import WorkHistoryIcon from "@mui/icons-material/WorkHistory";
import LightbulbIcon from "@mui/icons-material/Lightbulb";

interface EmployeeChipProps {
  isSpecial: boolean;
  isFromLead: boolean;
  text: string;
}

const EmployeeChip: React.FC<EmployeeChipProps> = ({ isSpecial, isFromLead, text }) => {
  let displayText: string = text;
  let chipColor: "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning";

  switch (text) {
    case "TOP5P":
      displayText = "Top 5%";
      chipColor = "warning";
      break;

    case "TOP20P":
      displayText = "Top 20%";
      chipColor = "warning";
      break;

    case "Successful":
      chipColor = "success";
      break;

    case "Needs Improvements":
      displayText = "Need Improvements";
      chipColor = "error";
      break;

    case "NOT_ASSIGNED":
      displayText = "Not Assigned";
      chipColor = "default";
      break;

    case "Exceptional":
      chipColor = "primary";
      break;

    default:
      displayText = text;
      chipColor = "default";
  }
  return (
    <Grid container alignItems="center" spacing={1} textAlign={"center"} display="flex" justifyContent="center">
      {isSpecial ? (
        <Chip
          icon={<StarRateIcon />}
          label={displayText}
          color={chipColor}
          sx={{ width: "155px", mt: 1 }}
          size="medium"
          variant="outlined"
        />
      ) : (
        <>
          {isFromLead ? (
            <Chip
              icon={<WorkHistoryIcon />}
              label={displayText}
              color={chipColor}
              sx={{ width: "155px", mt: 1 }}
              size="medium"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<LightbulbIcon />}
              label={displayText}
              color={chipColor}
              sx={{ width: "155px", mt: 1 }}
              size="medium"
              variant="outlined"
            />
          )}
        </>
      )}
    </Grid>
  );
};

export default EmployeeChip;
