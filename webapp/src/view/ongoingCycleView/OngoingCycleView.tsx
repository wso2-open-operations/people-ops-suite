// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import DataUsageIcon from "@mui/icons-material/DataUsage";
import GroupIcon from "@mui/icons-material/Group";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import PersonIcon from "@mui/icons-material/Person";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { Box, Fade, Stack, Step, StepLabel, Stepper, Tab, Tabs, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

import { SyntheticEvent, useEffect, useState } from "react";

import { StepperIcon } from "@component/common/StepperIcon";
import { F2fPanel } from "@component/common/F2fPanel";
import { FormContainer } from "@component/common/FormContainer";
import NoDataView from "@component/common/NoDataView";
import { ProvideFeedbackTab } from "@component/common/ProvideFeedbackTab";
import { RequestFeedbackTab } from "@component/common/RequestFeedbackTab";
import Title from "@component/common/Title";
import { LoadingEffect } from "@component/ui/Loading";
import { defaultTabWidth, shortDateFormat, uiMessages } from "@config/constant";
import { selectEmployeeInfo, selectUserEmail } from "@slices/authSlice/auth";
import {
  fetchCurrentParCycleOfEmployee,
  selectCurrentParCycleOfEmployee,
  selectEmployeeStatus,
} from "@slices/employeeSlice/employee";
import { selectCurrentCycle } from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";

import EmployeePanel from "./panels/EmployeePanel";

const OngoingCycleView = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const currentCycle = useAppSelector(selectCurrentParCycleOfEmployee);
  const fullCurrentCycle = useAppSelector(selectCurrentCycle);
  const employeeStatus = useAppSelector(selectEmployeeStatus);
  const employeeInfo = useAppSelector(selectEmployeeInfo);
  const dispatch = useAppDispatch();

  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState<number>(0);
  const [activeStep, setActiveStep] = useState(0);

  enum ParCycleViewTabs {
    EMPLOYEE = "employee",
    PROVIDETHREESIXTYREVIEWS = "provideThreeSixtyReviews",
    REQUESTTHREESIXTYREVIEWS = "requestThreeSixtyReviews",
    F2F = "F2F",
    REQUESTS = "requests",
  }

  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Set tabs based on if the user has a lead or not
  const tabsAndPanelsData =
    employeeInfo?.leadEmail !== null
      ? [
          {
            component: <EmployeePanel />,
            disabled: false,
            icon: <PersonIcon />,
            label: "Employee Feedback",
            value: ParCycleViewTabs.EMPLOYEE,
          },
          {
            component: <RequestFeedbackTab />,
            icon: <GroupWorkIcon />,
            label: "Request 360° Feedback",
            value: ParCycleViewTabs.REQUESTTHREESIXTYREVIEWS,
          },
          {
            component: <ProvideFeedbackTab />,
            icon: <VolunteerActivismIcon />,
            label: "Provide 360° Feedback",
            value: ParCycleViewTabs.PROVIDETHREESIXTYREVIEWS,
          },
          {
            component: (
              <>
                {userEmail && currentCycle?.parCycleId && (
                  <F2fPanel employeeId={userEmail} parCycle={currentCycle} isEmployeeView={true} />
                )}
              </>
            ),
            disabled:
              employeeStatus === RequestState.SUCCEEDED && Boolean(!currentCycle?.parCycleId),
            icon: <GroupIcon />,
            label: "F2F",
            value: ParCycleViewTabs.F2F,
          },
        ]
      : [
          {
            component: <ProvideFeedbackTab />,
            disabled: false,
            icon: <GroupWorkIcon />,
            label: "Provide 360° Feedback",
            value: ParCycleViewTabs.REQUESTS,
          },
        ];

  useEffect(() => {
    if (!fullCurrentCycle?.parCycleId) return;
    setActiveStep(0);
    if (dayjs().diff(fullCurrentCycle.parEmployeeDeadline, "day", true) >= 0) setActiveStep(1);
    if (dayjs().diff(fullCurrentCycle.parThreeSixtyRatingDeadline, "day", true) >= 0) setActiveStep(2);
    if (dayjs().diff(fullCurrentCycle.parF2FDeadline, "day", true) >= 0) setActiveStep(3);
    if (dayjs().diff(fullCurrentCycle.parEvaluationEndDate, "day", true) >= 0) setActiveStep(4);
  }, [fullCurrentCycle]);

  useEffect(() => {
    const currentTab = searchParams.get("tab");

    if (currentTab && Object.values(ParCycleViewTabs).includes(currentTab as ParCycleViewTabs)) {
      setValue(Object.values(ParCycleViewTabs).indexOf(currentTab as ParCycleViewTabs));
    } else {
      searchParams.set(
        "tab",
        employeeInfo?.leadEmail !== null ? ParCycleViewTabs.EMPLOYEE : ParCycleViewTabs.REQUESTS,
      );
      setSearchParams(searchParams);
    }

    if (userEmail) {
      dispatch(fetchCurrentParCycleOfEmployee(userEmail));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Fade in={true}>
      <Stack sx={{ height: "100%" }}>
        <FormContainer>
          <Title
            firstWord="Employee"
            secondWord={currentCycle?.parCycleId ? `Portal - ${currentCycle.parCycleName}` : "Portal"}
            icon={<DataUsageIcon fontSize="medium" />}
          />

          {fullCurrentCycle?.parCycleId && (
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5, borderBottom: 1, borderColor: "divider" }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                <Step>
                  <StepLabel StepIconComponent={StepperIcon}>
                    <Typography variant="caption" display="block" fontWeight={500}>
                      Deadline for employee PAR
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(fullCurrentCycle.parEmployeeDeadline).format(shortDateFormat)}
                    </Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel StepIconComponent={StepperIcon}>
                    <Typography variant="caption" display="block" fontWeight={500}>
                      Deadline for 360° feedback
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(fullCurrentCycle.parThreeSixtyRatingDeadline).format(shortDateFormat)}
                    </Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel StepIconComponent={StepperIcon}>
                    <Typography variant="caption" display="block" fontWeight={500}>
                      PAR F2F deadline
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(fullCurrentCycle.parF2FDeadline).format(shortDateFormat)}
                    </Typography>
                  </StepLabel>
                </Step>
                <Step>
                  <StepLabel StepIconComponent={StepperIcon}>
                    <Typography variant="caption" display="block" fontWeight={500}>
                      PAR end date
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(fullCurrentCycle.parEvaluationEndDate).format(shortDateFormat)}
                    </Typography>
                  </StepLabel>
                </Step>
              </Stepper>
            </Box>
          )}

          <Box sx={{ borderBottom: 1, borderColor: "divider", px: "20px" }}>
            <Tabs
              value={value}
              onChange={handleTabChange}
              aria-label="icon label tabs"
              sx={{
                "&.MuiTabs-root": {
                  height: "3rem",
                  alignItems: "center",
                },
                "& .MuiTabs-indicator": {
                  pb: "0.925rem",
                },
              }}
            >
              {tabsAndPanelsData.map((item, index) => (
                <Tab
                  key={index}
                  icon={item.icon}
                  iconPosition="start"
                  label={item.label}
                  disabled={item.disabled}
                  onClick={() => setSearchParams({ tab: item.value })}
                  sx={{ minWidth: defaultTabWidth }}
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {employeeStatus === RequestState.LOADING && (
              <LoadingEffect message={uiMessages.loading.pageLoading} />
            )}

            {employeeStatus === RequestState.SUCCEEDED && currentCycle?.parCycleId && (
              <>
                {tabsAndPanelsData.map((item, index) => (
                  <TabPanel key={index} value={value} index={index}>
                    {item.component}
                  </TabPanel>
                ))}
              </>
            )}

            {employeeStatus === RequestState.SUCCEEDED && !currentCycle?.parCycleId && (
              <Box sx={{ height: "70vh" }}>
                <NoDataView text={uiMessages.error.noParCycleFound} />
              </Box>
            )}
          </Box>
        </FormContainer>
      </Stack>
    </Fade>
  );
};

export default OngoingCycleView;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
};
