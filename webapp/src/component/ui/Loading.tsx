// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.
import { CircularProgress, Grid, LinearProgress, Typography } from "@mui/material";

export const LoadingEffect = (props: { message: string | null; isCircularLoading?: boolean }) => {
  return (
    <>
      <Grid
        size={{ xs: 12 }}
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "50px",
        }}
      >
        {props.isCircularLoading ? <CircularProgress /> : <LinearProgress sx={{ width: "70px" }} />}
      </Grid>
      <Grid
        size={{ xs: 12 }}
        style={{
          display: "flex",
          justifyContent: "center",
          paddingTop: "30px",
        }}
      >
        <Typography variant="h5">{props.message}</Typography>
      </Grid>
    </>
  );
};
