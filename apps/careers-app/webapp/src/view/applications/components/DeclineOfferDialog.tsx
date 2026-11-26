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
import { Box, Button, Typography } from "@wso2/oxygen-ui";
import { HeartHandshake } from "@wso2/oxygen-ui-icons-react";

import { useState } from "react";

import type { OfferAnswer } from "@/types/types";
import StatusDialog from "@component/common/StatusDialog";
import { dialogCancelButtonSx, dialogConfirmButtonSx } from "@utils/styles";
import { SelectInput, TextInput } from "@view/documents/FormInputs";

const MAX_COMMENT_LENGTH = 1000;

// The reasons offered in the dialog. The backend only requires a non-empty reason, so this list is not enforced there.
const DECLINE_REASONS = [
  "Accepted another offer",
  "Compensation",
  "Location or relocation",
  "Personal reasons",
  "Other",
];

interface DeclineOfferDialogProps {
  jobTitle: string;
  sending: boolean;
  onDecline: (answer: OfferAnswer) => void;
  onClose: () => void;
}

// Asks the candidate why they are declining an offer, in the same pop-up as the one that confirms accepting it.
const DeclineOfferDialog = ({ jobTitle, sending, onDecline, onClose }: DeclineOfferDialogProps) => {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  return (
    <StatusDialog
      open
      onClose={sending ? () => undefined : onClose}
      tone="brand"
      icon={<HeartHandshake size={32} />}
      title="We're sorry to hear that!"
      maxWidth="sm"
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={sending} sx={dialogCancelButtonSx}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={reason === "" || sending}
            onClick={() => onDecline({ response: "declined", reason, comment: comment.trim() })}
            sx={dialogConfirmButtonSx}
          >
            {sending ? "Declining..." : "Decline offer"}
          </Button>
        </>
      }
    >
      <Typography fontWeight={600} color="text.primary" mb={1}>
        {jobTitle}
      </Typography>
      <Typography color="text.secondary" mb={2}>
        Thank you for considering Choreo Labs as your next career opportunity. We&apos;d appreciate
        it if you could share why you&apos;ve decided to decline our offer. Your feedback will help
        us improve our candidate experience.
      </Typography>
      {/* The same inputs as the profile and documents forms, so the labels sit in the middle of the boxes. */}
      <Box sx={{ display: "grid", gap: 2, pt: 0.5, textAlign: "left" }}>
        <SelectInput
          label="What is the primary reason for declining the offer?"
          value={reason}
          onChange={setReason}
          options={DECLINE_REASONS}
          disabled={sending}
          required
          span={12}
        />
        <TextInput
          label="Anything else you would like to tell us? (optional)"
          value={comment}
          onChange={(value) => setComment(value.slice(0, MAX_COMMENT_LENGTH))}
          helper={`${comment.length}/${MAX_COMMENT_LENGTH}`}
          disabled={sending}
          multiline
          span={12}
        />
      </Box>
    </StatusDialog>
  );
};

export default DeclineOfferDialog;
