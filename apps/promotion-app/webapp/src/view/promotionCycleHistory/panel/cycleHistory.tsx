// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
  Grid,
  Stack,
  useTheme,
} from "@mui/material";
import CachedIcon from "@mui/icons-material/Cached";
import { useAppSelector, RootState, useAppDispatch } from "@slices/store";
import { ApplicationState } from "../../../types/types";
import { PromotionRequest, Role } from "../../../utils/types";
import { capitalizedFLWords } from "@utils/utils";
import { ExpandMore } from "@mui/icons-material";
import { fetchPromotionCycles } from "@slices/promotionCycleSlice/promotionCycle";
import { fetchPromotions } from "@slices/promotionSlice/promotion";
import { Header } from "@root/src/component/common/stringFilter";
import { LoadingEffect } from "@root/src/component/ui/Loading";
import StateWithImage from "@root/src/component/ui/StateWithImage";

export default function CycleHistory() {

  const dispatch = useAppDispatch();
  const auth = useAppSelector((state: RootState) => state.auth);
  const promotionCycle = useAppSelector( (state: RootState) => state.promotionCycle);
  const promotons = useAppSelector((state: RootState) => state.promotion);
  const employeeEmail = auth.userInfo?.email;
  const userRole = auth.roles;
  const theme = useTheme();
  const [selectedCycleID, setSelectedCycleID] = useState<number|null>(null);

  const fetchRequest = () => {
    if (!employeeEmail) return;
    dispatch(fetchPromotionCycles({
        statusArray: ["END"]
    }));
  };

  useEffect(() => {
    fetchRequest();
  }, []);

  const getAllRequests = async (cycleId: number) => {
    try {
        if (userRole.includes(Role.HR_ADMIN)) {
            dispatch(fetchPromotions({
                cycleId: cycleId
            }))
        } else if (userRole.includes(Role.FUNCTIONAL_LEAD)) {
            dispatch(fetchPromotions({
                enableBuFilter: true,
                cycleId: cycleId
            }))
        }
    } catch (error) {
        console.error("Failed to fetch promotion requests:", error);
    }
  };

  const handleSelectChange = (event: any) => {
    const cycleId = event.target.value;
    setSelectedCycleID(cycleId);
    if (cycleId) {
      getAllRequests(cycleId); 
    }
  };

  const handleRefresh = () => {
    fetchRequest();
  };

  const selectedCycle = promotionCycle.promotionCycles?.find((c) => c.id === selectedCycleID);

  const headers: Header[] = [
      {
        id: "employeeEmail",
        label: "Employee Email",
        sortable: true,
        type: "string",
        width: 1.4,
        align: "left",
      },
      {
        id: "promotionType",
        label: "Promotion Type",
        type: "string",
        sortable: true,
        width: 0.8,
        align: "left",
      },
      {
        id: "location",
        label: "Location",
        sortable: true,
        type: "string",
        width: 0.9,
        align: "left",
      },
      {
        id: "currentJobRole",
        label: "Current Designation",
        sortable: true,
        type: "string",
        width: 1,
        align: "center",
      },
      {
        id: "joinDate",
        label: "Joined Date",
        sortable: true,
        type: "date",
        width: 1,
        align: "center",
      },
      {
        id: "lastPromotedDate",
        label: "Last Promoted Date",
        sortable: true,
        type: "date",
        width: 1,
        align: "center",
      },
      {
        id: "businessUnit",
        label: "Business Unit",
        sortable: true,
        type: "string",
        width: 1,
        align: "center",
        formatter: capitalizedFLWords,
      },
      {
        id: "department",
        label: "Department",
        sortable: true,
        type: "string",
        width: 1,
        align: "center",
        formatter: capitalizedFLWords,
      },
      {
        id: "team",
        label: "Team",
        type: "string",
        sortable: true,
        width: 1,
        align: "center",
        formatter: capitalizedFLWords,
      },
  
      {
        id: "currentJobBand",
        label: "Current Job Band",
        sortable: true,
        type: "number",
        width: 0.6,
        align: "center",
      },
      {
        id: "nextJobBand",
        label: "Applied Job Band",
        sortable: true,
        type: "number",
        width: 0.6,
        align: "center",
      },
      {
        id: "status",
        label: "Promotion Board Approval Status",
        sortable: true,
        type: "string",
        width: 1,
        align: "center",
      },
      {
        id: "action",
        label: "",
        type: "action",
        width: 0.2,
        align: "right",
  
        render: (data: PromotionRequest, setExpand?: (id: any) => void) => {
          return (
            <Stack direction="row" spacing={2} sx={{ height: "40px" }}>
              <IconButton
                onClick={() => {
                  setExpand && setExpand(data.id);
                }}
              >
                <ExpandMore />
              </IconButton>
            </Stack>
          );
        },
      },
    ];

    const setRowColor = (data: PromotionRequest) => {
        if (data.status === ApplicationState.APPROVED) {
          return theme.palette.mode === "light" ? "#e6f9f0" : "#00875A";
        } else if (data.status === ApplicationState.FL_APPROVED) {
          return theme.palette.background.default;
        } else {
          return theme.palette.background.default;
        }
    };

  return (
    <>
      {promotionCycle.state === "loading" && (
          <LoadingEffect message={"Loading Cycles.."} />
      )}

      {promotionCycle.state === "success" && auth.userInfo && (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              px: 5,
              pt: 5
            }}
          >
            <IconButton color="primary" onClick={handleRefresh}>
              <CachedIcon />
            </IconButton>

            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Promotion Cycle</InputLabel>
              <Select
                label="Promotion Cycle"
                value={selectedCycleID}
                onChange={handleSelectChange}
              >
                {promotionCycle.promotionCycles && 
                  promotionCycle.promotionCycles?.length > 0 ? (
                    promotionCycle.promotionCycles.map((cycle) => (
                    <MenuItem key={cycle.id} value={cycle.id}>
                        {cycle.name}
                    </MenuItem>
                    ))
                ) : (
                    <MenuItem value="" disabled >
                        no past promotion cycles
                    </MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          <Box
            className="panel-con"
            sx={{
              height: "calc(100vh - 304px)",
              minHeight: "404px",
              overflowY: "auto",
              px: 1,
            }}
          >
            {promotons.state === "loading" && (
                <LoadingEffect message={"Loading " + selectedCycle?.name + " Cycle History"} />
            )}

            {promotons.state ==="success" &&
             selectedCycle && (
              <>
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    mb: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 4,
                  }}
                >
                  <Grid container spacing={3} sx={{ flexGrow: 1 }}>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Cycle Name:
                      </Typography>
                      <Typography>{selectedCycle.name}</Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Start Date:
                      </Typography>
                      <Typography>
                        {new Date(selectedCycle.startDate).toDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        End Date:
                      </Typography>
                      <Typography>
                        {new Date(selectedCycle.endDate).toDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Lead Deadline:
                      </Typography>
                      <Typography>
                        {new Date(selectedCycle.leadDeadline).toDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Functional Lead Deadline:
                      </Typography>
                      <Typography>
                        {new Date(selectedCycle.functionalLeadDeadline).toDateString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        Promotion Board Deadline:
                      </Typography>
                      <Typography>
                        {new Date(selectedCycle.promotionBoardDeadline).toDateString()}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Typography
                    sx={{ fontWeight: 600, color: "primary.main" }}
                  >
                    Status: {selectedCycle.status}
                  </Typography>
                </Paper>

                {promotons.promotions &&
                 promotons.promotions.length > 0 && (
                    <>

                        {/* 
                        TODO: add a table for the data
                        <CustomTable
                            hideSelection={true}
                            requests={cycle_history.promotionRequests}
                            headers={headers}
                            setRowColor={setRowColor}
                            fileName="functional-leader-approved-promotion-requests"
                        /> */}


                    </>
                )}

                {promotons.promotions && 
                 promotons.promotions.length == 0 &&(
                    <>
                        <Box
                          sx={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              height: "70vh",
                              "& img": {
                                  width: 360,
                                  height: "auto",
                              },
                          }}
                      >
                          <StateWithImage
                          imageUrl={require("@assets/images/not-found.svg").default}
                          message="No Promotions Found!"
                          />
                      </Box>
                    </>
                )}
              </>
            )} 
            
            {promotionCycle.state === "success" &&
             !selectedCycle &&(
              <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "60vh",
                    px: 5,
                    "& img": {
                        width: 360,
                        height: "auto",
                    },
                }}
              >
                  <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "70vh",
                        "& img": {
                            width: 360,
                            height: "auto",
                        },
                    }}
                >
                    <StateWithImage
                    imageUrl={require("@assets/images/not-found.svg").default}
                    message="Select a promotion cycle to view details."
                    />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {promotionCycle.state === "failed" && (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "70vh",
                "& img": {
                    width: 360,
                    height: "auto",
                },
            }}
        >
            <StateWithImage
              imageUrl={require("@assets/images/not-found.svg").default}
              message="Unable to promotion cycles"
            />
        </Box>
      )}
    </>
  );
}


