import TabsPage from "@root/src/layout/pages/TabsPage";
import {
  fetchEmployeeInfo,
  fetchEmployeePersonalInfo,
} from "@root/src/slices/employeeSlice/employee";
import { RootState, useAppDispatch, useAppSelector } from "@root/src/slices/store";
import { SquareUserRound, UserLock } from "lucide-react";

import { useEffect } from "react";

import EmployeeInfo from "./panel/EmployeeInfo";
import PersonalInfo from "./panel/PersonalInfo";

function Profile() {
  const user = useAppSelector((state: RootState) => state.user);

  const dispatch = useAppDispatch();

  const workEmail = user.userInfo?.workEmail;

  useEffect(() => {
    if (!workEmail) return;
    dispatch(fetchEmployeeInfo(workEmail));
    dispatch(fetchEmployeePersonalInfo(workEmail));

    console.log("called");
  }, [dispatch, workEmail]);
  return (
    <TabsPage
      title="Profile"
      tabsPage={[
        {
          tabTitle: "Employee Info",
          tabPath: "employee-info",
          icon: <SquareUserRound />,
          page: <EmployeeInfo />,
        },
        {
          tabTitle: "Personal Info",
          tabPath: "personal-info",
          icon: <UserLock />,
          page: <PersonalInfo />,
        },
      ]}
    />
  );
}

export default Profile;
