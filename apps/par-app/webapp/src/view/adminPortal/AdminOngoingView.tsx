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

import ShieldIcon from "@mui/icons-material/Shield";
import { Box, Button, Fade, Stack, Typography } from "@mui/material";

import { useEffect, useState } from "react";

import { FormContainer } from "@component/common/FormContainer";
import Title from "@component/common/Title";
import { LoadingEffect } from "@component/ui/Loading";
import { SnackMessage, uiMessages } from "@config/constant";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { fetchConfigurations, selectConfigStatus } from "@slices/metaSlice/meta";
import {
  fetchOpenParCycle,
  fetchPendingParCycle,
  fetchQuotaPendingParCycle,
  resetOngoingParCycleState,
  selectIsParCycleOngoing,
  selectIsQuotaPending,
  selectParCycleState,
} from "@slices/parCycleSlice/parCycle";
import { useAppDispatch, useAppSelector } from "@slices/store";
import { ParCycleStatus, RequestState } from "@utils/types";
import { AssignQuota } from "@view/adminPortal/components/AssignQuota";
import { OrgSummary } from "@view/adminPortal/components/OrgSummary";
import { ParCreationForm } from "@view/adminPortal/components/ParCreationForm";

export default function AdminOngoingView() {
  const isParCycleOngoing = useAppSelector(selectIsParCycleOngoing);
  const globalConfigStatus = useAppSelector(selectConfigStatus);
  const parCyclesLoadingState = useAppSelector(selectParCycleState);
  const isQuotaPending = useAppSelector(selectIsQuotaPending);

  const [isParCyclePending, setIsParCyclePending] = useState(false);
  const [isParCycleCreationFormOpen, setIsParCycleCreationFormOpen] = useState(false);

  const dispatch = useAppDispatch();

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
        if (isQuotaPending !== ParCycleStatus.PENDING_QUOTA && isQuotaPending !== "") {
          await dispatch(fetchOpenParCycle());
        }
      } catch (error) {
        dispatch(
          enqueueSnackbarMessage({
            message: SnackMessage.error.common,
            type: "error",
          }),
        );
      }
    };

    fetchData();

    return () => {
      dispatch(resetOngoingParCycleState());
    };
  }, [dispatch, isQuotaPending]);

  return (
    <Fade in={true}>
      <Stack sx={{ height: "100%" }}>
        <FormContainer>
          <Title
            firstWord="Admin"
            secondWord="Portal - Ongoing"
            icon={<ShieldIcon fontSize="medium" />}
          />

          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {(parCyclesLoadingState === RequestState.LOADING || isParCyclePending) && (
              <LoadingEffect message={uiMessages.loading.pageLoading} />
            )}

            {parCyclesLoadingState === RequestState.SUCCEEDED && (
              <Stack height="100%">
                {isParCycleOngoing && <OrgSummary isAdminAuditViewOn={true} />}

                {isQuotaPending === ParCycleStatus.PENDING_QUOTA &&
                  !isParCycleOngoing &&
                  !isParCyclePending && <AssignQuota />}

                {isParCycleCreationFormOpen && (
                  <Stack height="100%">
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
                      sx={{ height: "100%", textAlign: "center" }}
                    >
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        No ongoing PAR cycles found.
                      </Typography>
                      <Button variant="contained" onClick={handleFormOpen}>
                        Create Cycle
                      </Button>
                    </Box>
                  )}
              </Stack>
            )}
          </Box>
        </FormContainer>
      </Stack>
    </Fade>
  );
}
