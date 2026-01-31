// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { alpha, Avatar, Chip, Tooltip, useTheme } from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import DoneIcon from "@mui/icons-material/Done";
import {
  ParEmployeeStatus,
  ParThreeSixtyReviewStatus,
  ParLeadStatus,
  ParF2fStatus,
  ParSpecialRating,
} from "../../utils/types";
import { tokens } from "../../theme";
import { parUiText, tooltipVisibilityDelay } from "@config/constant";
import { capitalizeFirstLetter } from "@utils/utils";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

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
  const colors = tokens(theme.palette.mode);

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
      color:
        theme.palette.mode === "light" ? alpha(colors.greenAccent[500], 0.15) : alpha(colors.greenAccent[500], 0.4),
      textColor: theme.palette.mode === "light" ? colors.greenAccent[100] : colors.greenAccent[100],
      icon: <DoneIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Completed",
    },
    pending: {
      color: theme.palette.mode === "light" ? alpha(colors.yellowAccent[900], 1) : alpha(colors.yellowAccent[900], 1),
      textColor: theme.palette.mode === "light" ? colors.yellowAccent[100] : colors.yellowAccent[100],
      icon: <HourglassEmptyIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Pending",
    },
    rejected: {
      color: theme.palette.mode === "light" ? alpha(colors.redAccent[500], 0.15) : alpha(colors.redAccent[500], 0.25),
      textColor: colors.redAccent[500],
      icon: <CloseIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Rejected",
    },
    draft: {
      color: theme.palette.mode === "light" ? alpha(colors.blueAccent[500], 0.15) : alpha(colors.blueAccent[500], 0.25),
      textColor: colors.blueAccent[500],
      icon: <EditIcon sx={{ fontSize: "0.875rem" }} />,
      tooltip: "Draft",
    },
    default: {
      color: theme.palette.mode === "light" ? alpha(colors.grey[500], 0.15) : alpha(colors.grey[500], 0.25),
      textColor: theme.palette.mode === "light" ? colors.grey[700] : colors.grey[400],
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
          minWidth: "120xp",
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
