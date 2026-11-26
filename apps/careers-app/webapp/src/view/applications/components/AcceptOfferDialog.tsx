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
import { Button, Typography } from "@wso2/oxygen-ui";
import { ArrowRight } from "@wso2/oxygen-ui-icons-react";

import StatusDialog from "@component/common/StatusDialog";
import { dialogCancelButtonSx, dialogConfirmButtonSx } from "@utils/styles";

interface AcceptOfferDialogProps {
  jobTitle: string;
  sending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// An envelope with a tick, drawn in the brand's oranges so it suits both the dark and the light card.
const OfferEnvelope = () => (
  <svg
    width="210"
    height="130"
    viewBox="0 0 240 150"
    role="img"
    aria-label="An offer letter with a tick"
  >
    <ellipse cx="118" cy="132" rx="74" ry="9" fill="rgba(0,0,0,0.28)" />
    <rect x="68" y="46" width="104" height="72" rx="9" fill="#E2762A" />
    <rect x="80" y="30" width="80" height="58" rx="5" fill="#FFF3E6" />
    <rect x="90" y="42" width="40" height="5" rx="2.5" fill="#F3C9A0" />
    <rect x="90" y="54" width="58" height="5" rx="2.5" fill="#F3C9A0" />
    <path
      d="M68 60 L120 98 L172 60 L172 108 Q172 118 162 118 L78 118 Q68 118 68 108 Z"
      fill="#F59A4A"
    />
    <path d="M68 55 Q68 46 78 46 L162 46 Q172 46 172 55 L120 92 Z" fill="#FFB877" />
    <circle cx="164" cy="92" r="21" fill="#F57C1F" stroke="#FFE3C9" strokeWidth="3.5" />
    <path
      d="M154 92 L161 99 L175 83"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M50 44 L60 54" stroke="#FF7A1A" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 62 L55 66" stroke="#FF7A1A" strokeWidth="4" strokeLinecap="round" />
    <path d="M58 28 L64 41" stroke="#FF7A1A" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// Asks the candidate to confirm accepting an offer.
const AcceptOfferDialog = ({ jobTitle, sending, onConfirm, onClose }: AcceptOfferDialogProps) => (
  <StatusDialog
    open
    onClose={sending ? () => undefined : onClose}
    tone="brand"
    illustration={<OfferEnvelope />}
    title="Accept this offer?"
    actions={
      <>
        <Button variant="outlined" onClick={onClose} disabled={sending} sx={dialogCancelButtonSx}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={sending}
          endIcon={<ArrowRight size={18} />}
          sx={dialogConfirmButtonSx}
        >
          {sending ? "Accepting..." : "Yes, Accept"}
        </Button>
      </>
    }
  >
    <Typography fontSize="1rem" lineHeight={1.7} color="text.secondary">
      You&apos;re about to accept our offer for the {jobTitle} position.
    </Typography>
  </StatusDialog>
);

export default AcceptOfferDialog;
