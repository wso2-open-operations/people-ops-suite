// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { Avatar } from "@mui/material";
import { selectEmployeeInfo } from "@slices/authSlice";
import { useAppSelector } from "@slices/store";
import { useEffect, useState } from "react";

interface UserImageProps {
  isRound?: boolean;
  email: string;
  src?: string;
  size: number;
  name: string;
  variant?: "rounded" | "circular" | "square" | undefined;
}

const UserImage = (props: UserImageProps) => {
  const employeeInfo = useAppSelector(selectEmployeeInfo);

  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (employeeInfo?.employeeThumbnail) {
      setUrl(employeeInfo?.employeeThumbnail.replace("=s100", "=s500"));
    }
  }, [employeeInfo?.employeeThumbnail]);

  return (
    <Avatar
      src={url}
      alt={props.name}
      sx={{
        borderRadius: props.isRound ? "50%" : "5%",
        height: props.size,
        width: props.size,
      }}
    />
  );
};

export default UserImage;
