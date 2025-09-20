import { Edit, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@component/common/avatar";
import { RootState, useAppSelector } from "@slices/store";

function EmployeeInfo() {
  const user = useAppSelector((state: RootState) => state.user);

  const userName: string | undefined =
    [user.userInfo?.firstName, user.userInfo?.lastName].filter(Boolean).join(" ") || undefined;

  const initials =
    typeof userName === "string"
      ? userName
          .split(" ")
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
      : "name";

  const date = new Date();

  const now = new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(date);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex p-1">
        <div className="flex justify-start items-start flex-col w-fit gap-3">
          <Avatar className=" h-30 w-30 outline-[1.6px] outline-offset-[-1px] outline-neutral-100/10 rounded-lg">
            <AvatarImage className="rounded-lg" src={`${user.userInfo?.employeeThumbnail}`} />
            <AvatarFallback className="rounded-lg">
              <p className="h5 text-st-200">{initials}</p>
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col w-fit">
            <p className="h5 whitespace-nowrap truncate text-st-200">{`${user.userInfo?.firstName} ${user.userInfo?.lastName}`}</p>
            <p className="p-m text-st-300">{user.userInfo?.workEmail}</p>
          </div>
        </div>

        <div className="w-full"></div>

        <div className="flex flex-col items-end gap-3 justify-end text-st-200 whitespace-nowrap p-r">
          <div className="bg-[#FFEBDB] px-3 py-1 rounded-[4px]">
            <p className="text-primary-45">{user.userInfo?.jobRole}</p>
          </div>
          <div className="flex items-center justify-center">
            <p>Service Time&nbsp;</p> <p className="h6">{`years`}</p>
          </div>
          {/* <p> {`${employee_info?.employeeLocation} - ${now}`} </p> */}
        </div>
      </div>
    </div>
  );
}

export default EmployeeInfo;
