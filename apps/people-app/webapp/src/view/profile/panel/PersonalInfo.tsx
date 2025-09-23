import { H } from "@root/src/component/common/heading";
import { P } from "@root/src/component/common/text";
import { getNameInitials, yearsOfService } from "@root/src/utils/utils";
import PersonalInfoForm from "@root/src/view/profile/form/PersonalInfoForm";
import ProfileCard from "@root/src/view/profile/form/ProfileCard";
import { Edit, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@component/common/avatar";
import { RootState, useAppSelector } from "@slices/store";

function PersonalInfo() {
  const user = useAppSelector((state: RootState) => state.user);
  const employee = useAppSelector((state: RootState) => state.employee.employeeInfo);
  const employeePersonalInfo = useAppSelector((state: RootState) => state.employee.personalInfo);

  console.log("Personal Info : ", employeePersonalInfo);

  const userName: string | undefined =
    [user.userInfo?.firstName, user.userInfo?.lastName].filter(Boolean).join(" ") || undefined;

  const initials = getNameInitials(userName);

  const service = yearsOfService(employee?.startDate);

  if (!user.userInfo) return <div />;
  return (
    <div className="flexColFull gap-8">
      <div className="flex p-1">
        <div className="flexColFitStart gap-2">
          <Avatar className="h-30 w-30">
            <AvatarImage src={`${user.userInfo?.employeeThumbnail}`} />
            <AvatarFallback>
              <H variant="h5">{initials}</H>
            </AvatarFallback>
          </Avatar>

          <div className="flexColFit gap-1">
            <H variant="h5" className="whitespace-nowrap truncate">
              {userName}
            </H>
            <P variant="mediumThree">{user.userInfo?.workEmail}</P>
          </div>
        </div>

        <div className="w-full"></div>

        <div className="flexColFitEnd whitespace-nowrap">
          <div className="primaryChip">
            <P variant="mediumPrimary">{user.userInfo?.jobRole}</P>
          </div>
          <div className="flexRowFullCenter gap-0">
            <p>Service Time&nbsp;:&nbsp;</p>
            <p className="h6">{`${service.value} ${service.label}`}</p>
          </div>
          {/* <p> {`${employee_info?.employeeLocation} - ${now}`} </p> */}
        </div>
      </div>

      <ProfileCard Icon={User} heading="Personal Info" ActionIcon={Edit} IconColor="FF7300">
        {({ editing, toggleEditing }) => (
          <PersonalInfoForm editing={editing} toggleEditing={toggleEditing} />
        )}
      </ProfileCard>
    </div>
  );
}

export default PersonalInfo;
