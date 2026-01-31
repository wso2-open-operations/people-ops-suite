// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import React from "react";
import { Theme, alpha } from "@mui/material/styles";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import {
  NavLink as RouterLink,
  LinkProps as RouterLinkProps,
} from "react-router-dom";
import { Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";

const Link = React.forwardRef<HTMLAnchorElement, RouterLinkProps>(function Link(
  itemProps,
  ref
) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <RouterLink
      ref={ref}
      {...itemProps}
      role={undefined}
      style={({ isActive, isPending }) =>
        isActive
          ? {
              background: alpha(colors.customColors.white, 0.05),
              color: colors.customColors.orange,
            }
          : {}
      }
    />
  );
});

const ListItemLink = ({
  icon,
  primary,
  to,
  open,
  theme,
  isActive,
}: ListItemLinkProps) => {
  const colors = tokens(theme.palette.mode);

  return (
    <li>
      <ListItem
        component={Link}
        to={to}
        sx={{
          height: "38px",
          borderRadius: "5px",
          paddingLeft: "15px",
          marginLeft: "8px",
          width: "calc(100% - 16px)",
          marginRight: "8px",
          marginBottom: "10px",

          "&:hover": {
            background: alpha(theme.palette.common.white, 0.05),

            ...(!open && {
              "& .menu-tooltip": {
                opacity: 1,
                visibility: "visible",
                color: "white",
              },
            }),
          },
          ...(isActive && {
            background: alpha(theme.palette.common.white, 0.05),
          }),
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),

          ...(open && {}),
        }}
      >
        {icon ? (
          <ListItemIcon
            sx={{
              color: "white",
              "&:hover": {
                color: colors.customColors.orange,
              },

              ...(isActive && {
                color: colors.customColors.orange,
              }),
            }}
          >
            {icon}
          </ListItemIcon>
        ) : null}
        <ListItemText
          sx={{
            "& .MuiListItemText-primary": {
              color: "white",
              ...(isActive && {
                color: colors.customColors.orange,
              }),
              marginTop: "1px",
              fontSize: "16px",
            },
          }}
          primary={primary}
        />
        <span className="menu-tooltip">
          <Typography variant="h6">{primary}</Typography>{" "}
        </span>
      </ListItem>
    </li>
  );
};

export default ListItemLink;

interface ListItemLinkProps {
  icon?: React.ReactElement;
  primary: string;
  to: string;
  open: boolean;
  isActive: boolean;
  theme: Theme;
}
