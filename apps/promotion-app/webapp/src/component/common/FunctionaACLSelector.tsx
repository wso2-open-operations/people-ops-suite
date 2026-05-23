import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Abs from "./treeACL";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

import * as _ from "lodash";
import {
  BUAccessLevel,
  DepartmentAccess,
  Entity,
  TeamAccess,
} from "./../../utils/types";
import { capitalizedFLWords } from "./../../utils/utils";
import { RootState, useAppSelector } from "../../slices/store";


export default function FunctionalLeadACLSelector(props: {
  value: BUAccessLevel[];
  setValue: (value: BUAccessLevel[]) => void;
}) {
  const [buId, setBuId] = useState<number | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);

  const [bu, setBu] = useState<BUAccessLevel[]>([]);
  const [departments, setDeparments] = useState<readonly Entity[]>([]);
  const [teams, setTeams] = useState<readonly Entity[]>([]);
  const [subTeams, setSubTeams] = useState<readonly Entity[]>([]);

  const selected = props.value;
const setSelected = props.setValue;

  const userManagement = useAppSelector((state: RootState) => state.userManagement);

  useEffect(() => {
  if (Array.isArray(userManagement.businessUnits)) {
    setBu(userManagement.businessUnits);
  } else {
    setBu([]);
  }

  if (props.value) {
    setSelected(props.value);
  }
}, [userManagement.businessUnits, props.value]);

  const toggleSelection = (
    type: "bu" | "department" | "team" | "sub-team",
    item: Entity
  ) => {
    var tempSelected: BUAccessLevel[];
    var tempDepartment: DepartmentAccess;

    var departments: DepartmentAccess[] | undefined;
    var index: number;

    if (type === "bu") {
      tempSelected = _.cloneDeep(selected);

      index = tempSelected.findIndex((value) => value.id === item.id);

      if (index === -1) {
        tempSelected.push(item);
      } else {
        tempSelected.splice(index, 1);
      }

      setSelected(tempSelected);
    }

    if (type === "department") {
      tempSelected = _.cloneDeep(selected);

      var buIndex = tempSelected.findIndex((value) => value.id === buId);

      if (buIndex === -1) {
        index = bu.findIndex((value) => value.id === buId);

        if (index !== -1) {
          tempSelected.push(_.cloneDeep(bu[index]));
          departments = tempSelected[tempSelected.length - 1].departments;

          if (departments) {
            index = departments.findIndex((value) => value.id === item.id);

            if (index !== -1) {
              tempDepartment = departments[index];
              index = tempSelected.findIndex((value) => value.id === buId);

              if (index !== -1) {
                tempSelected[index].departments = [tempDepartment];
              }
            }
          }
        }
      } else {
        departments = tempSelected[buIndex].departments;

        if (departments) {
          index = departments.findIndex((value) => value.id === item.id);

          if (index === -1) {
            departments.push(item);

            tempSelected[buIndex].departments = departments;
          } else {
            departments.splice(index, 1);
            tempSelected[buIndex].departments = departments;
          }
        }
      }
      cleanUp(tempSelected);
      setSelected(tempSelected);
    }

    if (type === "team") {
      tempSelected = _.cloneDeep(selected);

      var buIndex = tempSelected.findIndex((value) => value.id === buId);

      if (buIndex === -1) {
        //adding bu
        index = bu.findIndex((value) => value.id === buId);

        if (index !== -1) {
          tempSelected.push(_.cloneDeep(bu[index]));
          departments = tempSelected[tempSelected.length - 1].departments;

          if (departments) {
            index = departments.findIndex((value) => value.id === departmentId);

            if (index !== -1) {
              tempDepartment = departments[index];

              if (tempDepartment) {
                var teams = tempDepartment.teams;

                if (teams) {
                  index = teams.findIndex((value) => value.id === item.id);
                  if (index !== -1) {
                    tempDepartment.teams = [teams[index]];

                    index = tempSelected.findIndex(
                      (value) => value.id === buId
                    );
                    if (index !== -1) {
                      tempSelected[index].departments = [tempDepartment];
                    }
                  }
                }
              }
            }
          }
        }
      } else {
        departments = tempSelected[buIndex].departments;

        if (departments) {
          var dep_index = departments.findIndex(
            (value) => value.id === departmentId
          );

          if (dep_index !== -1) {
            teams = departments[dep_index].teams;

            if (teams) {
              index = teams.findIndex((value) => value.id === item.id);
              if (index === -1) {
                teams?.push(item);
              } else {
                teams.splice(index, 1);
              }
            } else {
            }
          } else {
            departments = bu[buIndex].departments;

            if (departments) {
              index = departments.findIndex(
                (value) => value.id === departmentId
              );

              if (index != -1) {
                tempDepartment = _.cloneDeep(departments[index]);

                tempDepartment.teams = [item];
                tempSelected[buIndex].departments?.push(tempDepartment);
              }
            }
          }
        }
      }

      cleanUp(tempSelected);
      setSelected(tempSelected);
    }
  };

  const checkIsActive = (
    type: "bu" | "department" | "team" | "sub-team",
    id: number
  ) => {
    if (type === "bu") {
      var tempSelected = [...selected];

      return tempSelected.findIndex((value) => value.id === id) !== -1;
    }

    if (type === "department" && buId != null) {
      var tempSelected = [...selected];

      var buIndex = tempSelected.findIndex((value) => value.id === buId);

      if (buIndex === -1) {
        return false;
      }

      var departmentList = selected[buIndex].departments
        ? selected[buIndex].departments
        : [];

      if (!departmentList) {
        return false;
      }

      return departmentList.findIndex((value) => value.id === id) !== -1;
    }

    if (type === "team" && buId != null && departmentId != null) {
      var tempSelected = [...selected];

      var buIndex = tempSelected.findIndex((value) => value.id === buId);

      if (buIndex === -1) {
        return false;
      }

      var departmentList = selected[buIndex].departments;

      if (!departmentList) {
        return false;
      }

      var departmentIndex = departmentList.findIndex(
        (value) => value.id === departmentId
      );

      if (departmentIndex === -1) {
        return false;
      }

      var teamList = departmentList[departmentIndex].teams;

      if (!teamList) {
        return false;
      }

      return teamList.findIndex((value) => value.id === id) !== -1;
    }

    if (
      type === "sub-team" &&
      buId != null &&
      departmentId != null &&
      teamId != null
    ) {
      var tempSelected = [...selected];

      var buIndex = tempSelected.findIndex((value) => value.id === buId);

      if (buIndex === -1) {
        return false;
      }

      var departmentList = selected[buIndex].departments;

      if (!departmentList) {
        return false;
      }

      var departmentIndex = departmentList.findIndex(
        (value) => value.id === departmentId
      );

      if (departmentIndex === -1) {
        return false;
      }

      var teamList = departmentList[departmentIndex].teams;

      if (!teamList) {
        return false;
      }

      return teamList.findIndex((value) => value.id === id) !== -1;
    }
  };

  const checkIndeterminate = (
    type: "bu" | "department" | "team" | "sub-team",
    id: number
  ) => {
    if (type === "bu") {
      var bu_index = bu.findIndex((value) => value.id === id);
      var selected_index = selected.findIndex((value) => value.id === id);

      if (bu_index !== -1 && selected_index !== -1) {
        var deps = bu[bu_index].departments;
        var sel_deps = selected[selected_index].departments;

        if (deps && sel_deps) {
          return sel_deps.length !== 0 && deps.length !== sel_deps.length;
        }
      }
    }

    if (type === "department") {
      var bu_index = bu.findIndex((value) => value.id === buId);
      var selected_index = selected.findIndex((value) => value.id === buId);

      if (bu_index !== -1 && selected_index !== -1) {
        var deps = bu[bu_index].departments;
        var sel_deps = selected[selected_index].departments;

        if (deps && sel_deps) {
          // checking selected index
          var teams_idx = deps.findIndex((value) => value.id === id);
          var sel_teams_idx = sel_deps.findIndex((value) => value.id === id);
          if (teams_idx !== -1 && sel_teams_idx !== -1) {
            var team = deps[teams_idx].teams;
            var sel_team = sel_deps[sel_teams_idx].teams;

            if (team && sel_team) {
              return sel_team.length !== 0 && team.length !== sel_team.length;
            }
          }
        }
      }
    }

    return false;
  };

  const cleanUp = (tempSelected: BUAccessLevel[]) => {
    if (buId != null) {
      var index = tempSelected.findIndex((value) => value.id === buId);

      if (index !== -1) {
        var departments = tempSelected[index].departments;
        if (departments && departments.length === 0) {
          
          tempSelected.splice(index, 1);
        } else if (departments && departmentId != null) {
          index = departments.findIndex((value) => value.id === departmentId);

          if (index !== -1) {
            var teams = departments[index].teams;
            if (teams && teams.length === 0) {
              departments.splice(index, 1);
              cleanUp(tempSelected);
            }
          }
        }
      }
    }
  };

  useEffect(() => {
    setBu(userManagement?.businessUnits || []);
    if (props.value) {
      setSelected(props.value);
    }
  }, [userManagement.businessUnits]);

  const BuList = (items: readonly BUAccessLevel[]) => (
    <Card variant="outlined" square sx={{ m: 0, p: 0 }}>
      <CardHeader sx={{ px: 2, py: 1 }} title={<>Business Units</>} />
      <Divider />
      <List
        sx={{
          width: 250,
          height: 300,
          bgcolor: "background.paper",
          overflow: "auto",
          marginLeft: "5px",
        }}
        dense
        component="div"
        role="list"
      >
        {Array.isArray(items) &&
  items.map((item) => {
          const labelId = `transfer-list-all-item-${item.id}-label`;

          return (
            <ListItem
              key={item.id}
              role="listitem"
              sx={{
                width: 248,
              }}
              style={{
                ...(item.id === buId && {
                  background: "gray",
                }),
              }}
              button
              onClick={() => {
                if (item.id !== buId) {
                  setDepartmentId(null);
                  setTeamId(null);
                  setTeams([]);
                  setSubTeams([]);
                }

                setDeparments(item.departments ? item.departments : []);
                setBuId(item.id);
              }}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checkIsActive("bu", item.id)}
                  onClick={() => {
                    toggleSelection("bu", item);
                  }}
                  indeterminate={checkIndeterminate("bu", item.id)}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{
                    "aria-labelledby": labelId,
                  }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={`${capitalizedFLWords(item.name)}`} />
              {item.id === buId && item.departments && item.departments.length>0 && <ArrowForwardIosIcon />}
            </ListItem>
          );
        })}
      </List>
    </Card>
  );

  const departmentList = (items: readonly DepartmentAccess[]) => (
    <Card variant="outlined" square>
      <CardHeader sx={{ px: 2, py: 1 }} title={<>Departments</>} />
      <Divider />
      <List
        sx={{
          width: 250,
          height: 300,
          bgcolor: "background.paper",
          overflow: "auto",
        }}
        dense
        component="div"
        role="list"
      >
        {Array.isArray(items) &&
  items.map((item) => {
          const labelId = `transfer-list-all-item-${item.id}-label`;

          return (
            <ListItem
              key={"d-" + item.id}
              role="listitem"
              style={{
                ...(item.id === departmentId && {
                  background: "gray",
                }),
              }}
              button
              onClick={() => {
                if (item.id !== departmentId) {
                  setTeamId(null);
                  setSubTeams([]);
                }
                setDepartmentId(item.id);
                setTeams(item.teams ? item.teams : []);
              }}
            >
              <ListItemIcon>
                <Checkbox
                  disabled={items.length === 0}
                  checked={checkIsActive("department", item.id)}
                  onClick={() => {
                    toggleSelection("department", item);
                  }}
                  tabIndex={-1}
                  disableRipple
                  indeterminate={checkIndeterminate("department", item.id)}
                  inputProps={{
                    "aria-labelledby": labelId,
                  }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={`${capitalizedFLWords(item.name)}`} />
              {item.id === departmentId && item.teams && item.teams.length>0 && <ArrowForwardIosIcon />}
            </ListItem>
          );
        })}
      </List>
    </Card>
  );

  const teamList = (items: readonly TeamAccess[]) => (
    <Card variant="outlined" square>
      <CardHeader
        sx={{ px: 2, py: 1 }}
        title={<>Teams</>}
        // subheader={`${numberOfChecked(items)}/${items.length} selected`}
      />
      <Divider />
      <List
        sx={{
          width: 250,
          height: 300,
          bgcolor: "background.paper",
          overflow: "auto",
        }}
        dense
        component="div"
        role="list"
      >
        {Array.isArray(items) &&
  items.map((item) => {
          const labelId = `transfer-list-all-item-${item.id}-label`;

          return (
            <ListItem
              key={"t-" + item.id}
              role="listitem"
              style={{
                ...(item.id === teamId && {
                  background: "gray",
                }),
              }}
              button
              onClick={() => {
                setTeamId(item.id);
                setSubTeams(item.subTeams ? item.subTeams : []);
              }}
            >
              <ListItemIcon>
                <Checkbox
                  checked={checkIsActive("team", item.id)}
                  tabIndex={-1}
                  disableRipple
                  onClick={() => {
                    toggleSelection("team", item);
                  }}
                  inputProps={{
                    "aria-labelledby": labelId,
                  }}
                />
              </ListItemIcon>
              <ListItemText id={labelId} primary={`${capitalizedFLWords(item.name)}`} />
            </ListItem>
          );
        })}
      </List>
    </Card>
  );

  return (
    <>
      <Grid
        container
        spacing={2}
        justifyContent="left"
        alignItems="center"
        style={{ paddingLeft: "12px" }}
      >
        <Grid item xs={12} sx={{ paddingLeft: "2px!important" }}>
          Access Level of the functional lead{" "}
          <span style={{ color: "red" }}>*</span>
        </Grid>
        <Grid item sx={{ paddingLeft: "2px!important" }}>
          {BuList(bu)}
        </Grid>
        <Grid item sx={{ paddingLeft: "2px!important" }}>
          {departmentList(departments)}
        </Grid>
        <Grid item sx={{ paddingLeft: "2px!important" }}>
          {teamList(teams)}
        </Grid>

        <Grid item sx={{ paddingLeft: "2px!important" }}>
          <Abs data={selected} />
        </Grid>
      </Grid>
    </>
  );
}