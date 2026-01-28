// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Box, Step, StepLabel, Stepper, Typography } from "@mui/material";
import dayjs from "dayjs";
import { type ParCycle } from "@utils/types";
import { StepperIcon } from "@components/common/StepperIcon";
import { shortDateFormat } from "@config/constant";

interface CycleDatesStepperProps {
  cycle: Partial<ParCycle>;
  activeStep: number;
}

export const CycleDatesStepper = ({
  cycle,
  activeStep,
}: CycleDatesStepperProps) => {
  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        <Step>
          <StepLabel StepIconComponent={StepperIcon}>
            <Typography>
              {dayjs(cycle.parEvaluationStartDate).format(shortDateFormat)}
            </Typography>
            <Typography mt={-12.5}>Start Date</Typography>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel StepIconComponent={StepperIcon}>
            <Typography>
              {dayjs(cycle.parEmployeeDeadline).format(shortDateFormat)}
            </Typography>
            <Typography mt={-12.5}>Employee PAR Deadline</Typography>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel StepIconComponent={StepperIcon}>
            <Typography>
              {dayjs(cycle.parLeadDeadline).format(shortDateFormat)}
            </Typography>
            <Typography mt={-12.5}>Lead’s PAR Deadline</Typography>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel StepIconComponent={StepperIcon}>
            <Typography>
              {dayjs(cycle.parSpecialRatingDeadline).format(shortDateFormat)}
            </Typography>
            <Typography mt={-12.5}>Top 5%/20% Rating Submission</Typography>
          </StepLabel>
        </Step>
        <Step>
          <StepLabel StepIconComponent={StepperIcon}>
            <Typography>
              {dayjs(cycle.parEvaluationEndDate).format(shortDateFormat)}
            </Typography>
            <Typography mt={-12.5}>End Date</Typography>
          </StepLabel>
        </Step>
      </Stepper>
    </Box>
  );
};
