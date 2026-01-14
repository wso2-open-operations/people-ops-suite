import CommonPage from "@layout/pages/CommonPage";
import GroupsIcon from '@mui/icons-material/Groups';
import EmployeesTable from "./employeesTable/EmployeesTable";

export default function EmployeesView() {
  return (
    <CommonPage
      title="Employees"
      icon={<GroupsIcon />}
      commonPageTabs={[]}
      page={<EmployeesTable />}
    />
  );
}