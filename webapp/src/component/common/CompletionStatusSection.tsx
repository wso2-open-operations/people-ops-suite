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

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
  Box,
  Card,
  Grid,
  IconButton,
  LinearProgress,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { tooltipVisibilityDelay } from "@config/constant";

const overviewButtonSx = {
  borderRadius: "4px",
  padding: "2px",
  mr: "4px",
  color: "primary.main",
  "&:hover": {
    borderRadius: "4px",
    bgcolor: "primary.main",
    color: "white",
  },
} as const;

interface CompletionStatusSectionProps {
  employeeParComplete: number;
  leadReviewComplete: number;
  f2fComplete: number;
  total: number;
  onOpenOverview?: () => void;
  sx?: SxProps<Theme>;
}

export const CompletionStatusSection = ({
  employeeParComplete,
  leadReviewComplete,
  f2fComplete,
  total,
  onOpenOverview,
  sx,
}: CompletionStatusSectionProps) => {
  const theme = useTheme();

  return (
    <Card
      variant="outlined"
      sx={{
        padding: 1,
        mx: 0.2,
        background: "transparent",
        backdropFilter: "none",
        ...sx,
      }}
    >
      <Grid container>
        <Grid
          size={{ xs: 12 }}
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
        >
          <Typography sx={{ color: theme.palette.brandColors.lightOrange }}>
            Completion Status
          </Typography>
          {onOpenOverview && (
            <Tooltip
              arrow
              title="PAR Completion Overview"
              enterDelay={tooltipVisibilityDelay}
              enterNextDelay={tooltipVisibilityDelay}
            >
              <IconButton
                size="small"
                aria-label="PAR completion overview"
                onClick={onOpenOverview}
                sx={overviewButtonSx}
              >
                <OpenInNewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Grid>
      </Grid>
      <Grid container spacing={10}>
        {[
          { name: "Employee PAR", completed: employeeParComplete },
          { name: "Lead's PAR", completed: leadReviewComplete },
          { name: "F2F", completed: f2fComplete },
        ].map(({ name, completed }) => (
          <Grid key={name} size={{ xs: 12, sm: 4 }}>
            <Box>
              <Typography pb="5px">
                {name} : {total - completed} Pending
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(completed * 100) / total}
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Card>
  );
};
