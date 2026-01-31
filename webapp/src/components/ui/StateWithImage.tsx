// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { Grid, Typography } from "@mui/material";

interface StateWithImageProps {
  message: string;
  imageUrl: string;
  hideImage?: boolean;
}

const StateWithImage = (props: StateWithImageProps) => {
  return (
    <>
      {!props.hideImage && (
        <Grid
          item
          xs={12}
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "100px",
            height: "180px",
          }}
        >
          <img
            height={"100%"}
            src={props.imageUrl}
            alt="Image"
            className="image"
          />
        </Grid>
      )}
      <Grid
        item
        xs={12}
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: props.hideImage ? 100 : 30,
        }}
      >
        <Typography variant="h5">{props.message}</Typography>
      </Grid>
    </>
  );
};

export default StateWithImage;
