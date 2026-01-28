// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { Typography } from "@mui/material";

interface CardProps {
  name: string;
  completed: number;
  total: number;
  hideLeftCount?: boolean;
}

export const CompletionStatusCard = ({
  name,
  completed,
  total,
  hideLeftCount,
}: CardProps) => {
  return (
    <Box pt={1.5}>
      <Typography py={1}>
        {name}
        {!hideLeftCount && <> {` : ${total - completed}`} Pending</>}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(completed * 100) / total}
        sx={{ height: 15, borderRadius: 2 }}
      />
    </Box>
  );
};
