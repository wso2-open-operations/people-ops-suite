import { styled, Theme, CSSObject, alpha } from "@mui/material/styles";
import { MUIStyledCommonProps } from "@mui/system";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import HelpIcon from "@mui/icons-material/Help";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import ListLinkItem from "@components/layout/LinkItem";

import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import SettingsIcon from "@mui/icons-material/Settings";

import { getActiveRouteDetails } from "./../../route";

import { SIDEBAR_WIDTH } from "@config/ui";
import { Role } from "@utils/types";

import {
  useLocation,
  useNavigate,
  matchPath,
  useMatches,
} from "react-router-dom";

import { ColorModeContext } from "@context/ColorModeContext";
import { Typography } from "@mui/material";
import { tokens } from "../../theme";
import { useContext } from "react";

interface SidebarProps {
  open: boolean;
  theme: Theme;
  handleDrawer: () => void;
  roles: Role[];
  currentPath: string;
}

const useRouteMatch = (patterns: readonly string[]) => {
  const { pathname } = useLocation();

  let matches = useMatches();

  for (let i = 0; i < patterns.length; i += 1) {
    const pattern = patterns[i];
    const possibleMatch = matchPath(pattern, pathname);
    if (possibleMatch !== null) {
      return patterns.indexOf(possibleMatch.pattern.path);
    }
  }
  for (let i = 0; i < matches.length; i += 1) {
    if (patterns.indexOf(matches[i].pathname) !== -1) {
      return patterns.indexOf(matches[i].pathname);
    }
  }

  return null;
};

const Sidebar = (props: SidebarProps) => {
  const navigate = useNavigate();
  const currentIndex = useRouteMatch([
    ...getActiveRouteDetails(props.roles).map((r) => r.path),
  ]);
  const colorMode = useContext(ColorModeContext);
  const colors = tokens(props.theme.palette.mode);

  return (
    <Drawer variant="permanent" open={props.open}>
      <DrawerHeader open={props.open}>
        <img
          alt="wso2"
          style={{
            marginLeft: "2px",
            height: "45px",
            maxWidth: "100px",
            ...(props.open && { opacity: 0, maxWidth: "0px" }),
            transition: props.theme.transitions.create(["all"], {
              easing: props.theme.transitions.easing.sharp,
              duration: props.theme.transitions.duration.enteringScreen,
            }),
          }}
          onClick={() => (window.location.href = "/")}
          src="/wso2-logo-o.svg"
        ></img>
        <img
          alt="wso2"
          onClick={() => (window.location.href = "/")}
          style={{
            marginLeft: "0px",
            height: "40px",
            maxWidth: "100px",
            ...(!props.open && { display: "none" }),
          }}
          src="/wso2-logo.svg"
        ></img>
        <div
          className="text-white"
          style={{
            marginLeft: "5px",
            borderLeft: "1px solid #ffffff36",
            height: "43px",
            paddingLeft: "15px",
            ...(!props.open && { display: "none" }),
            lineHeight: "5px",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              marginTop: "18px",
            }}
          >
            PAR App
          </p>
        </div>
      </DrawerHeader>
      <List>
        {getActiveRouteDetails(props.roles).map((r, idx) => (
          <div key={idx}>
            {!r.bottomNav &&
              r.path !== "/settings" &&
              r.path !== "/profile" && (
                <ListLinkItem
                  key={idx}
                  theme={props.theme}
                  to={r.path}
                  primary={r.text}
                  icon={r.icon}
                  open={props.open}
                  isActive={currentIndex === idx}
                />
              )}
          </div>
        ))}
      </List>
      <DrawerSpace />
      <DrawerFooter
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "end",
          gap: 1,
        }}
      >
        {props.roles.includes(Role.ADMIN) && (
          <IconButton
            onClick={() => navigate("/settings")}
            color="inherit"
            sx={{
              color: "white",
              "&:hover": {
                background: alpha(props.theme.palette.common.white, 0.05),
                ...(!props.open && {
                  "& .menu-tooltip": {
                    opacity: 1,
                    visibility: "visible",
                    color: "white",
                  },
                }),
              },
            }}
          >
            <SettingsIcon />
            <span className="menu-tooltip">
              <Typography variant="h6">{"Settings"}</Typography>{" "}
            </span>
          </IconButton>
        )}
        <IconButton
          onClick={colorMode.toggleColorMode}
          color="inherit"
          sx={{
            color: "white",
            "&:hover": {
              background: alpha(props.theme.palette.common.white, 0.05),
              ...(!props.open && {
                "& .menu-tooltip": {
                  opacity: 1,
                  visibility: "visible",
                  color: "white",
                },
              }),
            },
          }}
        >
          {props.theme.palette.mode === "dark" ? (
            <LightModeOutlinedIcon />
          ) : (
            <DarkModeOutlinedIcon />
          )}
          <span className="menu-tooltip">
            <Typography variant="h6">
              {"Switch to " +
                (props.theme.palette.mode === "dark" ? "light" : "dark") +
                " mode"}
            </Typography>{" "}
          </span>
        </IconButton>
      </DrawerFooter>
      {getActiveRouteDetails(props.roles).map((r, idx) => (
        <div key={idx}>
          {r.bottomNav && (
            <DrawerFooter key={idx}>
              <IconButton
                key={idx}
                onClick={() => navigate(r.path)}
                sx={{
                  "&:hover": {
                    background: alpha(props.theme.palette.common.white, 0.05),
                    ...(!props.open && {
                      "& .menu-tooltip": {
                        opacity: 1,
                        visibility: "visible",
                        color: "white",
                      },
                    }),
                  },
                  ...(currentIndex === idx && {
                    background: alpha(props.theme.palette.common.white, 0.05),
                  }),
                }}
              >
                <HelpIcon
                  sx={{
                    color: "white",
                    ...(currentIndex === idx && {
                      color: colors.customColors.orange,
                    }),
                  }}
                />
                <span className="menu-tooltip">
                  <Typography variant="h6">{"Help"}</Typography>{" "}
                </span>
              </IconButton>
            </DrawerFooter>
          )}
        </div>
      ))}

      <DrawerFooter>
        <IconButton
          onClick={props.handleDrawer}
          sx={{
            "&:hover": {
              background: alpha(props.theme.palette.common.white, 0.05),
            },
          }}
        >
          {!props.open ? (
            <ChevronRightIcon sx={{ color: "white" }} />
          ) : (
            <ChevronLeftIcon sx={{ color: "white" }} />
          )}
        </IconButton>
      </DrawerFooter>
    </Drawer>
  );
};

export default Sidebar;

interface DrawerHeaderInterface extends MUIStyledCommonProps {
  open: boolean;
}

const DrawerSpace = styled("div")(({ theme }) => ({
  flex: 1,
  ...theme.mixins.toolbar,
}));

export const DrawerFooter = styled("div")(({ theme }) => ({
  position: "relative",
  bottom: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 2),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: SIDEBAR_WIDTH,
  flexShrink: 0,
  display: "flex",
  whiteSpace: "nowrap",
  // boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const openedMixin = (theme: Theme): CSSObject => ({
  width: SIDEBAR_WIDTH,
  backgroundColor:
    theme.palette.mode === "light"
      ? tokens(theme.palette.mode).customColors.darkBlue
      : tokens(theme.palette.mode).customColors.darkGray,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  backgroundColor:
    theme.palette.mode === "light"
      ? tokens(theme.palette.mode).customColors.darkBlue
      : tokens(theme.palette.mode).customColors.darkGray,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(10)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
});

export const DrawerHeader = styled("div")<DrawerHeaderInterface>(
  ({ theme, open }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    transition: theme.transitions.create(["display"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...theme.mixins.toolbar,
    ...(open && {
      justifyContent: "flex-start",
    }),
  })
);
