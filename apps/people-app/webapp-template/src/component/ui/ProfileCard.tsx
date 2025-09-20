import { LucideIcon } from "lucide-react";

import { ReactNode } from "react";

import { hexToRgba } from "@utils/utils";

interface ProfileCardProps {
  Icon: LucideIcon;
  IconColor: string;
  heading: string;
  ActionIcon: LucideIcon;
}

function ProfileCard(props: ProfileCardProps) {
  const { Icon, heading, ActionIcon, IconColor } = props;

  const color = IconColor.startsWith("#") ? IconColor : `#${IconColor}`;

  return (
    <div className="w-full flex flex-col gap-4 bg-st-bg-secondary-light border-1 border-st-card-border p-1 pt-4 rounded-2xl">
      <div className="flex flex-row gap-2 px-3 justify-center items-center">
        <div
          style={{ backgroundColor: hexToRgba(color, 0.2) }}
          className={`rounded-[4px] p-1 bg-[${hexToRgba(IconColor, 20)}]`}
        >
          <Icon style={{ color }} className="w-5 h-5" />
        </div>
        <p className="w-full h6 text-st-200 ">{heading}</p>
        <ActionIcon className="text-[#1476B8]" />
      </div>
      <div className=" flex flex-col gap-4 w-full bg-st-bg-main-light border-1 border-st-card-inner-border rounded-lg p-4 "></div>
    </div>
  );
}

export default ProfileCard;
