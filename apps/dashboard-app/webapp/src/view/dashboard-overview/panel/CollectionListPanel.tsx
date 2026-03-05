// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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
import AddIcon from "@mui/icons-material/Add";
import { Box, Fab, Fade, Stack, Typography } from "@mui/material";
import { green } from "@mui/material/colors";

import { useEffect, useState } from "react";

import ErrorSvg from "@assets/images/error.svg";
import NoDataSvg from "@assets/images/no-data.svg";
import { State } from "@/types/types";
import { DashboardOverviewMessage } from "@config/messages";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import SkeletonCard from "@component/ui/common-card/SkeletonCard";
import { fetchCollections } from "@slices/collections/collection";
import { useAppDispatch, useAppSelector } from "@slices/store";
import CollectionActionsToolbar from "@view/dashboard-overview/tool-bar/CollectionActionsToolbar";

import CollectionCard from "../component/card/CollectionCard";
import AddCollectionModal from "../component/modal/AddCollectionModal";

const CollectionListPanel = () => {
  const dispatch = useAppDispatch();
  const collection = useAppSelector((state) => state.collection);
  const [showAddCollectionPopUp, setShowAddCollectionPopUp] = useState(false);

  useEffect(() => {
    dispatch(fetchCollections());
  }, [dispatch]);

  const toggleClose = () => {
    setShowAddCollectionPopUp(false);
  };

  const count = collection.collections?.count ?? 0;

  return (
    <>
      {/* Loading component */}
      {collection.state === State.loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* Failed component */}
      {collection.state === State.failed && (
        <Fade in={collection.state === State.failed}>
          <Stack
            sx={{
              p: 2,
              width: "100%",
              height: "100%",
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
            }}
            flexDirection={"column"}
            justifyContent={"center"}
            alignItems={"center"}
            gap={2}
          >
            <Box>
              <img src={ErrorSvg} height={"120px"} alt="Error graphic" />
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography
                align="center"
                variant="h3"
                color={"secondary.dark"}
              >{DashboardOverviewMessage.panel.serverErrorTitle}</Typography>
              <Typography
                align="center"
                fontWeight={500}
                sx={{ mt: 2 }}
                variant="body1"
              >{DashboardOverviewMessage.panel.serverErrorDescription}</Typography>
            </Box>
          </Stack>
        </Fade>
      )}

      {/* Success component */}
      {collection.state === State.success && (
        <>
          {/* Add new section */}
          <Fab
            size="small"
            color="primary"
            aria-label="add"
            variant="extended"
            sx={{
              position: "absolute",
              bottom: "8%",
              right: "2%",
              color: "common.white",
              bgcolor: green[500],
              "&:hover": {
                bgcolor: green[600],
              },
            }}
            onClick={() => {
              setShowAddCollectionPopUp(true);
            }}
          >
            <AddIcon />
          </Fab>

          {/* No data component */}
          {count === 0 && (
            <Fade in={collection.state === State.success}>
              <Stack
                sx={{
                  p: 2,
                  width: "100%",
                  height: "100%",
                  borderRadius: 3,
                  border: 1,
                  borderColor: "divider",
                }}
                flexDirection={"column"}
                justifyContent={"center"}
                alignItems={"center"}
                gap={2}
              >
                <Box>
                  <img src={NoDataSvg} height={"120px"} alt="No data graphic" />
                </Box>
                <Box>
                  <Typography
                    align="center"
                    variant="h4"
                    color={"secondary.dark"}
                  >{DashboardOverviewMessage.panel.noDataTitle}</Typography>
                  <Typography
                    align="center"
                    fontWeight={500}
                    sx={{ mt: 2 }}
                    variant="body2"
                  >{DashboardOverviewMessage.panel.noDataDescription}</Typography>
                </Box>
              </Stack>
            </Fade>
          )}

          {/* Data component */}
          {count > 0 && collection.collections && (
            <Fade in={collection.state === State.success}>
              <Box
                sx={{
                  height: "100%",
                  overflowY: "auto",
                  display: "flex",
                  paddingX: 1,
                  gap: 2,
                  flexDirection: "column",
                }}
              >
                {collection.collections.collections.map((item, idx) => (
                  <CollectionCard
                    key={item.id}
                    collection={item}
                    actions={
                      <CollectionActionsToolbar
                        onAccept={() => {
                          dispatch(
                            enqueueSnackbarMessage({
                              message: `${DashboardOverviewMessage.collectionActions.actionOne} confirmed for ${item.name}`,
                              type: "success",
                            }),
                          );
                        }}
                        onSend={() => {
                          dispatch(
                            enqueueSnackbarMessage({
                              message: `${DashboardOverviewMessage.collectionActions.actionTwo} confirmed for ${item.name}`,
                              type: "success",
                            }),
                          );
                        }}
                        onUpdate={() => {
                          dispatch(
                            enqueueSnackbarMessage({
                              message: `${DashboardOverviewMessage.collectionActions.actionThree} confirmed for ${item.name}`,
                              type: "success",
                            }),
                          );
                        }}
                      />
                    }
                    dataCardIndex={idx}
                  />
                ))}
              </Box>
            </Fade>
          )}
        </>
      )}
      {/* Add new collection popup */}
      {showAddCollectionPopUp && <AddCollectionModal toggleClose={toggleClose} />}
    </>
  );
};

export default CollectionListPanel;
