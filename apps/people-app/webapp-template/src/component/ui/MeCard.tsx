import { Avatar, AvatarFallback, AvatarImage } from "@root/components/ui/avatar";
import { RootState, useAppSelector } from "@root/src/slices/store";

function MeCard() {
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

  return (
    <div className="bg-secondary-default p-6 ">
      <div className="flex gap-3 bg-[hsla(0,0%,97%,0.08)] outline-1 outline-offset-[-1px] outline-neutral-200/10 p-2 rounded-lg">
        <Avatar className="p-5 outline-1 outline-offset-[-1px] outline-neutral-100/10 ">
          <AvatarImage className="h-8 w-8 " src={`${user.userInfo?.employeeThumbnail}`} />
          <AvatarFallback>
            <p className="p-r text-st-nav-clicked ">{initials}</p>
          </AvatarFallback>
        </Avatar>

        <div className="">
          <p className="p-m text-st-nav-clicked">{userName}</p>
          <p className="p-s text-st-nav-link">{user.userInfo?.workEmail || ""}</p>
        </div>
      </div>
    </div>
  );
}

export default MeCard;
