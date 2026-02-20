// Copyright (c) 2024, WSO2 LLC. (https://www.wso2.com). All Rights Reserved.
//
// This software is the property of WSO2 LLC. and its suppliers, if any.
// Dissemination of any information or reproduction of any material contained
// herein in any form is strictly forbidden, unless permitted by WSO2 expressly.
// You may not alter or remove any copyright or other notice from copies of this content.

import { useState, useEffect } from "react";
import { Box, Button, Stack } from "@mui/material";
import {
  fetchQuotaPendingParCycle,
  fetchOpenParCycle,
  fetchPendingParCycle,
  resetOngoingParCycleState,
  selectIsParCycleOngoing,
  selectParCycleState,
  selectIsQuotaPending,
} from "@slices/parCycleSlice/parCycle";
import { ParCreationForm } from "../components/ParCreationForm";
import { OrgSummary } from "@view/adminPortal/components/OrgSummary";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { fetchConfigurations, selectConfigStatus } from "@slices/metaSlice/meta";
import { LoadingEffect } from "@component/ui/Loading";
import { SnackMessage, uiMessages } from "@config/constant";
import { RequestState } from "@utils/types";
import { ParCycleStatus } from "@slices/parCycleSlice/parCycle";
import { AssignQuota } from "@view/adminPortal/components/AssignQuota";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";

const OngoingPanel = () => {
  const isParCycleOngoing = useAppSelector(selectIsParCycleOngoing);
  const globalConfigStatus = useAppSelector(selectConfigStatus);
  const parCyclesLoadingState = useAppSelector(selectParCycleState);
  const [isParCyclePending, setIsParCyclePending] = useState(false);
  const isQuotaPending = useAppSelector(selectIsQuotaPending);

  const dispatch = useAppDispatch();

  const [isParCycleCreationFormOpen, setIsParCycleCreationFormOpen] =
    useState(false);

  const handleFormOpen = () => {
    dispatch(fetchConfigurations());
    setIsParCycleCreationFormOpen(true);
  };

  const handleFormClose = () => {
    setIsParCycleCreationFormOpen(false);

    setIsParCyclePending(true);
    const intervalId = setInterval(() => {
      dispatch(fetchPendingParCycle()).then((response) => {
        if (response.payload.length === 0) {
          clearInterval(intervalId);
          setIsParCyclePending(false);
          dispatch(fetchQuotaPendingParCycle());
          dispatch(fetchOpenParCycle());
        }
      });
    }, 10000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchQuotaPendingParCycle());
        if (
          isQuotaPending !== ParCycleStatus.PENDING_QUOTA &&
          isQuotaPending !== ""
        ) {
          await dispatch(fetchOpenParCycle());
        }
      } catch (error) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.error.common,
            type: "error",
          })
        );
      }
    };
    fetchData();
    return () => {
      dispatch(resetOngoingParCycleState());
    };
  }, [dispatch, isQuotaPending]);

  return (
    <>
      <Box
        sx={{
          height: "calc(100vh - 17rem)",
          overflowY: "auto",
        }}
      >
        {(parCyclesLoadingState === RequestState.LOADING ||
          isParCyclePending) && (
          <LoadingEffect message={uiMessages.loading.pageLoading} />
        )}

        {parCyclesLoadingState === RequestState.SUCCEEDED && (
          <Stack height={"100%"}>
            {isParCycleOngoing && <OrgSummary isAdminAuditViewOn={true} />}

            {isQuotaPending === ParCycleStatus.PENDING_QUOTA &&
              !isParCycleOngoing &&
              !isParCyclePending && <AssignQuota />}

            {isParCycleCreationFormOpen && (
              <Stack height={"100%"}>
                {globalConfigStatus === RequestState.LOADING && (
                  <LoadingEffect
                    message={uiMessages.loading.pageLoading}
                    isCircularLoading={true}
                  />
                )}

                {globalConfigStatus === RequestState.SUCCEEDED && (
                  <ParCreationForm handleFormClose={handleFormClose} />
                )}
              </Stack>
            )}

            {!isParCycleCreationFormOpen &&
              !isParCycleOngoing &&
              !isParCyclePending &&
              isQuotaPending !== ParCycleStatus.PENDING_QUOTA && (
                <Box
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  sx={{ minHeight: "calc(580px)" }}
                >
                  <Box paddingBottom={2}>PAR cycle not in progress.</Box>
                  <Box>
                    <Button variant="contained" onClick={handleFormOpen}>
                      Create Cycle
                    </Button>
                  </Box>
                </Box>
              )}
          </Stack>
        )}
      </Box>
    </>
  );
};

export default OngoingPanel;
