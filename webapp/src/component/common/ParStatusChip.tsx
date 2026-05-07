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

import { Chip, alpha, useTheme } from "@mui/material";

import { parUiText } from "@config/constant";
import {
  ParEmployeeStatus,
  ParF2fStatus,
  ParLeadStatus,
  ParSpecialRating,
} from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParThreeSixtyReviewStatus } from "@root/src/slices/threeSixtyReviewSlice/threeSixtyReview";

interface StatusChipProps {
  content:
  | ParEmployeeStatus
  | ParThreeSixtyReviewStatus
  | ParLeadStatus
  | ParF2fStatus
  | string
  | ParSpecialRating;
  countDetails?: {
    total: number;
    completed: number;
  };
  isDeadlinePassed?: boolean;
}

const ParStatusChip = ({ content, countDetails, isDeadlinePassed }: StatusChipProps) => {
  const theme = useTheme();

  const statusConfig = {
    completed: {
      color: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor:
        theme.palette.mode === "light" ? theme.palette.success.dark : theme.palette.success.main,
    },
    pending: {
      color: alpha(theme.palette.warning.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor:
        theme.palette.mode === "light" ? theme.palette.warning.dark : theme.palette.warning.main,
    },
    rejected: {
      color: alpha(theme.palette.error.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor:
        theme.palette.mode === "light" ? theme.palette.error.dark : theme.palette.error.main,
    },
    draft: {
      color: alpha(theme.palette.info.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor: theme.palette.mode === "light" ? theme.palette.info.dark : theme.palette.info.main,
    },
    default: {
      color: alpha(
        (theme.palette.neutral?.[1000] as string) || "#808080",
        theme.palette.mode === "light" ? 0.15 : 0.25,
      ),
      textColor:
        (theme.palette.neutral?.[theme.palette.mode === "light" ? "1600" : "400"] as string) ||
        "#808080",
    },
  };

  const labelMap: Record<string, string> = {
    SHARED: "Shared",
    SHARED_BLOCKED: "Shared",
    PENDING: "Pending",
    DRAFT: "Drafted",
    COMPLETED: "Completed",
    REJECTED: "Rejected",
  };

  const colorMap: Record<string, (typeof statusConfig)[keyof typeof statusConfig]> = {
    SHARED: statusConfig.completed,
    SHARED_BLOCKED: statusConfig.completed,
    PENDING: statusConfig.pending,
    DRAFT: statusConfig.draft,
    COMPLETED: statusConfig.completed,
    REJECTED: statusConfig.rejected,
  };

  const getDisplay = () => {
    if (isDeadlinePassed && content === ParThreeSixtyReviewStatus.PENDING) {
      return { label: "-", config: statusConfig.default };
    }

    if (countDetails) {
      const config = colorMap[content as string] ?? statusConfig.default;
      return { label: `${countDetails.completed}/${countDetails.total}`, config };
    }

    let label: string;
    if (labelMap[content as string]) {
      label = labelMap[content as string];
    } else if (content === ParSpecialRating.TOP_FIVE_PERCENT) {
      label = parUiText.ParSpecialRatingTopFivePercent;
    } else if (content === ParSpecialRating.TOP_TWENTY_PERCENT) {
      label = parUiText.ParSpecialRatingTopTwentyPercent;
    } else if (content === ParSpecialRating.NONE || content === "") {
      label = parUiText.NotAvailableText;
    } else {
      label = (content as string)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    const config = colorMap[content as string] ?? statusConfig.default;
    return { label, config };
  };

  const { label, config } = getDisplay();

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        height: "24px",
        width: "auto",
        minWidth: "90px",
        borderRadius: "12px",
        backgroundColor: config.color,
        color: config.textColor,
        fontWeight: 500,
        "& .MuiChip-label": { px: 1.5, py: 0.5 },
      }}
    />
  );
};

export default ParStatusChip;
