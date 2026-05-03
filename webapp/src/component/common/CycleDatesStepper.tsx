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
import { Box, Card, Divider, Step, StepLabel, Stepper, Typography } from "@mui/material";
import dayjs from "dayjs";

import { CustomModal } from "@component/common/CustomModal";
import { StepperIcon } from "@component/common/StepperIcon";
import { shortDateFormat } from "@config/constant";
import { type ParCycle } from "@slices/parCycleSlice/parCycle";

interface CycleDatesStepperProps {
  cycle: Partial<ParCycle>;
  activeStep: number;
  open: boolean;
  onClose: () => void;
}

export const CycleDatesStepper = ({ cycle, activeStep, open, onClose }: CycleDatesStepperProps) => {
  return (
    <CustomModal open={open} onClose={onClose} width="80vw">
      <Typography variant="h5" fontWeight={600} pb={2}>
        Cycle Dates
      </Typography>
      <Divider />
      <Box pt={3} pb={2}>
        <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            <Step>
              <StepLabel StepIconComponent={StepperIcon}>
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {dayjs(cycle.parEvaluationStartDate).format(shortDateFormat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Start Date
                </Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel StepIconComponent={StepperIcon}>
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {dayjs(cycle.parEmployeeDeadline).format(shortDateFormat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Employee PAR Deadline
                </Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel StepIconComponent={StepperIcon}>
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {dayjs(cycle.parLeadDeadline).format(shortDateFormat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Lead's PAR Deadline
                </Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel StepIconComponent={StepperIcon}>
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {dayjs(cycle.parSpecialRatingDeadline).format(shortDateFormat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Top 5%/20% Rating
                </Typography>
              </StepLabel>
            </Step>
            <Step>
              <StepLabel StepIconComponent={StepperIcon}>
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  {dayjs(cycle.parEvaluationEndDate).format(shortDateFormat)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  End Date
                </Typography>
              </StepLabel>
            </Step>
          </Stepper>
        </Card>
      </Box>
    </CustomModal>
  );
};
