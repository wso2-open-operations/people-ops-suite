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
import { Box, Fade, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";

import { SyntheticEvent, useEffect, useState } from "react";

import { F2fPanel } from "@component/common/F2fPanel";
import { FormContainer } from "@component/common/FormContainer";
import NoDataView from "@component/common/NoDataView";
import { ProvideFeedbackTab } from "@component/common/ProvideFeedbackTab";
import { RequestFeedbackTab } from "@component/common/RequestFeedbackTab";
import Title from "@component/common/Title";
import { LoadingEffect } from "@component/ui/Loading";
import { defaultTabWidth, uiMessages } from "@config/constant";
import { selectEmployeeInfo, selectUserEmail } from "@slices/authSlice/auth";
import {
  fetchCurrentParCycleOfEmployee,
  selectCurrentParCycleOfEmployee,
  selectEmployeeStatus,
} from "@slices/employeeSlice/employee";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { RequestState } from "@utils/types";

import EmployeePanel from "./panels/EmployeePanel";

const OngoingCycleView = () => {
  const userEmail = useAppSelector(selectUserEmail);
  const currentCycle = useAppSelector(selectCurrentParCycleOfEmployee);
  const employeeStatus = useAppSelector(selectEmployeeStatus);
  const employeeInfo = useAppSelector(selectEmployeeInfo);
  const dispatch = useAppDispatch();

  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState<number>(0);
  enum ParCycleViewTabs {
    EMPLOYEE = "employee",
    REQUESTTHREESIXTYREVIEWS = "requestThreeSixtyReviews",
    PROVIDETHREESIXTYREVIEWS = "provideThreeSixtyReviews",
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

          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={value}
              onChange={handleTabChange}
              aria-label="icon label tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 0,
                "& .MuiTab-root": {
                  minHeight: 0,
                  height: "60px",
                  py: 0,
                  px: { xs: 1, sm: 1.5 },
                  minWidth: { xs: "auto", sm: "230px" },
                  "& .MuiTab-iconWrapper": { fontSize: "1rem" },
                },
                "& .MuiTabs-indicator": { pb: "0.1rem" },
              }}
            >
              {tabsAndPanelsData.map((item, index) => (
                <Tab
                  key={index}
                  icon={item.icon}
                  iconPosition="start"
                  label={<Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{item.label}</Box>}
                  disabled={item.disabled}
                  onClick={() => setSearchParams({ tab: item.value })}
                />
              ))}
            </Tabs>
          </Box>

          <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", px: 3, pt: 1 }}>
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
  const isActive = value === index;

  return (
    <div
      role="tabpanel"
      hidden={!isActive}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={isActive ? { height: "100%", display: "flex", flexDirection: "column" } : undefined}
      {...other}
    >
      {isActive && (
        <Box sx={{ p: 1, flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Box>
      )}
    </div>
  );
};
