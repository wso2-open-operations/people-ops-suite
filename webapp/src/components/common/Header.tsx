// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";

import { Grid } from "@mui/material";

const HeaderWithImage = (props: { image: string }) => {
  return (
    <Grid
      item
      xs={12}
      style={{
        display: "flex",
        justifyContent: "center",
        marginTop: "100px",
        height: "400px",
      }}
    >
      <img height={"100%"} src={props.image} alt="Image" className="image" />
    </Grid>
  );
}

export default HeaderWithImage;
