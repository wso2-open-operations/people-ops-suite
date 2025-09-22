import TabsPage from "@root/src/layout/pages/TabsPage";
import { Files, Landmark, SquareUserRound, UserLock } from "lucide-react";

import EmployeeInfo from "./panel/EmployeeInfo";

function Profile() {
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
          page: <EmployeeInfo />,
        },
        {
          tabTitle: "Documents",
          tabPath: "documents",
          icon: <Files />,
          page: <EmployeeInfo />,
        },
        {
          tabTitle: "Bank Details",
          tabPath: "bank-details",
          icon: <Landmark />,
          page: <EmployeeInfo />,
        },
      ]}
    />
  );
}

export default Profile;
