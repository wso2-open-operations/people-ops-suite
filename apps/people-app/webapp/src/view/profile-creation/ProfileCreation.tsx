import EmployeeInfoCreationForm from "@root/src/view/profile-creation/form/EmployeeInfoCreationForm";
import ProfileCard from "@root/src/view/profile/form/ProfileCard";
import { Edit, User } from "lucide-react";

export default function ProfileCreation() {
  return (
    <div>
      <ProfileCard Icon={User} heading="Employee Info" ActionIcon={Edit} IconColor="FF7300">
        {({ editing, toggleEditing }) => (
          <EmployeeInfoCreationForm editing={editing} toggleEditing={toggleEditing} />
        )}
      </ProfileCard>
    </div>
  );
}
