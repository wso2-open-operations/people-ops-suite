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

import { alpha, Avatar, Chip, Tooltip, useTheme } from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import DoneIcon from "@mui/icons-material/Done";
import { parUiText, tooltipVisibilityDelay } from "@config/constant";
import { capitalizeFirstLetter } from "@utils/utils";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { ParEmployeeStatus, ParLeadStatus, ParF2fStatus, ParSpecialRating } from "@root/src/slices/employeeHistorySlice/employeeHistory";
import { ParThreeSixtyReviewStatus } from "@root/src/slices/threeSixtyReviewSlice/threeSixtyReview";

interface StatusChipProps {
  content: ParEmployeeStatus | ParThreeSixtyReviewStatus | ParLeadStatus | ParF2fStatus | string | ParSpecialRating;
  countDetails?: {
    total: number;
    completed: number;
  };
  isDeadlinePassed?: boolean;
}

const ParStatusChip = ({ content, countDetails, isDeadlinePassed }: StatusChipProps) => {
  const theme = useTheme();

  const isCompleted = (status: string) => {
    return [
      ParEmployeeStatus.SHARED,
      ParEmployeeStatus.SHARED_BLOCKED,
      ParThreeSixtyReviewStatus.COMPLETED,
      ParLeadStatus.SHARED,
      ParF2fStatus.COMPLETED,
    ].includes(status as any);
  };

  const isPending = (status: string) => {
    return [
      ParEmployeeStatus.PENDING,
      ParThreeSixtyReviewStatus.PENDING,
      ParLeadStatus.PENDING,
      ParF2fStatus.PENDING,
    ].includes(status as any);
  };
  const statusConfig = {
    completed: {
      color: alpha(theme.palette.success.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor: theme.palette.mode === "light" ? theme.palette.success.dark : theme.palette.success.main,
      icon: <DoneIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Completed",
    },
    pending: {
      color: alpha(theme.palette.warning.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor: theme.palette.mode === "light" ? theme.palette.warning.dark : theme.palette.warning.main,
      icon: <HourglassEmptyIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Pending",
    },
    rejected: {
      color: alpha(theme.palette.error.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor: theme.palette.mode === "light" ? theme.palette.error.dark : theme.palette.error.main,
      icon: <CloseIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Rejected",
    },
    draft: {
      color: alpha(theme.palette.info.main, theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor: theme.palette.mode === "light" ? theme.palette.info.dark : theme.palette.info.main,
      icon: <EditIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Draft",
    },
    default: {
      color: alpha((theme.palette.neutral?.[1000] as string) || "#808080", theme.palette.mode === "light" ? 0.15 : 0.25),
      textColor: (theme.palette.neutral?.[theme.palette.mode === "light" ? "1600" : "400"] as string) || "#808080",
    },
  };

  const getStatusConfig = (status: string) => {
    if (isCompleted(status)) return statusConfig.completed;
    if (isPending(status)) return statusConfig.pending;
    if (status === ParThreeSixtyReviewStatus.REJECTED) return statusConfig.rejected;
    if (status === ParThreeSixtyReviewStatus.DRAFT) return statusConfig.draft;
    return statusConfig.default;
  };

  const getStatusDisplay = () => {
    if (isDeadlinePassed && content === ParThreeSixtyReviewStatus.PENDING) {
      return {
        type: "text",
        content: "-",
        style: statusConfig.default,
      };
    }

    const config = getStatusConfig(content as string);

    if (isCompleted(content as string) || isPending(content as string)) {
      return {
        type: "status",
        ...config,
      };
    }

    let displayContent = content;
    if (content === ParSpecialRating.TOP_FIVE_PERCENT) {
      displayContent = parUiText.ParSpecialRatingTopFivePercent;
    } else if (content === ParSpecialRating.TOP_TWENTY_PERCENT) {
      displayContent = parUiText.ParSpecialRatingTopTwentyPercent;
    } else if (content === ParSpecialRating.NONE || content === "") {
      displayContent = parUiText.NotAvailableText;
    } else {
      displayContent = capitalizeFirstLetter(content as string);
    }

    return {
      type: "text",
      content: displayContent,
      style: config,
    };
  };

  const renderStatusIndicator = (statusInfo: any) => {
    if (countDetails) {
      return (
        <Chip
          size="small"
          label={`${countDetails.completed}/${countDetails.total}`}
          sx={{
            height: "24px",
            minWidth: "120px",
            borderRadius: "12px",
            backgroundColor: statusInfo.color,
            color: statusInfo.textColor,
            fontWeight: 500,
            "& .MuiChip-label": {
              px: 1.5,
              py: 0.5,
            },
            width: "auto",
          }}
        />
      );
    }

    if (statusInfo.type === "status") {
      return (
        <Tooltip
          arrow
          title={statusInfo.tooltip}
          enterDelay={tooltipVisibilityDelay}
          enterNextDelay={tooltipVisibilityDelay}
        >
          <Avatar
            sx={{
              backgroundColor: statusInfo.color,
              width: 24,
              height: 24,
              ".MuiSvgIcon-root": {
                color: statusInfo.textColor,
              },
            }}
          >
            {statusInfo.icon}
          </Avatar>
        </Tooltip>
      );
    }

    return (
      <Chip
        size="small"
        label={statusInfo.content}
        sx={{
          height: "24px",
          width: "auto",
          minWidth: "120px",
          borderRadius: "12px",
          backgroundColor: statusInfo.style.color,
          color: statusInfo.style.textColor,
          fontWeight: 500,
          "& .MuiChip-label": {
            px: 1.5,
            py: 0.5,
          },
        }}
      />
    );
  };

  return renderStatusIndicator(getStatusDisplay());
};

export default ParStatusChip;
