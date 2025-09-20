import { LucideIcon } from "lucide-react";

import { useCallback, useState } from "react";

import { Button } from "@component/common/button";
import { hexToRgba } from "@utils/utils";

interface ProfileCardProps {
  Icon: LucideIcon;
  IconColor: string;
  heading: string;
  ActionIcon: LucideIcon;
}

function ProfileCard(props: ProfileCardProps) {
  const { Icon, heading, ActionIcon, IconColor } = props;

  const [editing, setEditing] = useState(false);

  const color = IconColor.startsWith("#") ? IconColor : `#${IconColor}`;

  const toggleEditing = useCallback(() => setEditing((v) => !v), []);

  return (
    <div className="w-full flex flex-col gap-4 bg-[#F5F8FA] border-1 border-st-card-border p-1 pt-4 rounded-2xl">
      <div className="flex flex-row gap-2 px-3 justify-center items-center">
        <div style={{ backgroundColor: hexToRgba(color, 0.2) }} className="rounded-[4px] p-1">
          <Icon style={{ color }} className="w-5 h-5" />
        </div>

        <p className="w-full h6 text-st-200">{heading}</p>

        {editing ? (
          <div className="flex flex-row gap-4">
            <Button
              variant="secondary"
              onClick={toggleEditing}
              className="border border-st-border-light"
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" form="profile-form">
              Save
            </Button>
          </div>
        ) : (
          <button type="button" onClick={toggleEditing} className="p-1">
            <ActionIcon className="text-[#1476B8]" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 w-full bg-white/70 border-1 border-st-card-inner-border rounded-lg p-4"></div>
    </div>
  );
}

export default ProfileCard;
