// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";
import { StepIconProps } from "@mui/material";

export const StepperIcon = (props: StepIconProps) => {
  const { active, completed } = props;

  if (completed || active) {
    return <CheckCircleIcon color="primary" />;
  }

  return <CircleIcon color="disabled" />;
};
