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
import EditIcon from "@mui/icons-material/Edit";
import SendIcon from "@mui/icons-material/Send";
import { Button, IconButton, Stack } from "@mui/material";

import { ConfirmationType } from "@/types/types";
import { useConfirmationModalContext } from "@context/dialogState";
import { DashboardOverviewMessage } from "@config/messages";

interface CollectionActionsToolbarProps {
  onAccept: () => void;
  onSend: () => void;
  onUpdate: () => void;
}

const CollectionActionsToolbar = ({ onAccept, onSend, onUpdate }: CollectionActionsToolbarProps) => {
  const dialogContext = useConfirmationModalContext();

  return (
    <>
      <Stack flexDirection={"row"} gap={1.5}>
        <Button
          sx={{ borderRadius: 3 }}
          size="small"
          variant="outlined"
          onClick={() => {
            // User confirmation handler.
            dialogContext.showConfirmation(
              `${DashboardOverviewMessage.collectionActions.confirmTitlePrefix} ${DashboardOverviewMessage.collectionActions.actionOne}${DashboardOverviewMessage.collectionActions.confirmSuffix}`,
              DashboardOverviewMessage.collectionActions.confirmBody,
              ConfirmationType.accept,
              onAccept,
            );
          }}
        >
          {DashboardOverviewMessage.collectionActions.actionOne}
        </Button>
        <Button
          sx={{ borderRadius: 3, boxShadow: "none" }}
          variant="contained"
          size="small"
          color="success"
          startIcon={
            <SendIcon
              sx={{
                rotate: "-40deg",
                position: "relative",
                top: -2,
              }}
            />
          }
          onClick={() => {
            // User confirmation handler.
            dialogContext.showConfirmation(
              `${DashboardOverviewMessage.collectionActions.confirmTitlePrefix} ${DashboardOverviewMessage.collectionActions.actionTwo}${DashboardOverviewMessage.collectionActions.confirmSuffix}`,
              DashboardOverviewMessage.collectionActions.confirmBody,
              ConfirmationType.send,
              onSend,
            );
          }}
        >
          {DashboardOverviewMessage.collectionActions.actionTwo}
        </Button>
        <IconButton
          aria-label={DashboardOverviewMessage.collectionActions.actionThree}
          size="small"
          sx={{ border: 1, borderColor: "info", borderRadius: 2 }}
          onClick={() => {
            // User confirmation handler.
            dialogContext.showConfirmation(
              `${DashboardOverviewMessage.collectionActions.confirmTitlePrefix} ${DashboardOverviewMessage.collectionActions.actionThree}${DashboardOverviewMessage.collectionActions.confirmSuffix}`,
              DashboardOverviewMessage.collectionActions.confirmBody,
              ConfirmationType.update,
              onUpdate,
            );
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Stack>
    </>
  );
};
export default CollectionActionsToolbar;
