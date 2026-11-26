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
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@wso2/oxygen-ui";
import { ClipboardList } from "@wso2/oxygen-ui-icons-react";

import { useRef, useState } from "react";

import type { OfferLetter } from "@/types/types";
import CenteredSpinner from "@component/common/CenteredSpinner";
import { useAppAuthContext } from "@context/AuthContext";
import { fetchOfferLetter } from "@utils/profileService";
import { pillButtonSx } from "@utils/styles";

// The frame settings that keep scripts in the letter from running.
const LETTER_FRAME_SANDBOX = "allow-same-origin";

// The width the letter is laid out at when it is saved, about an A4 page at 96 dpi.
const PDF_PAGE_WIDTH = 794;

// Renders the letter in a hidden frame and saves it as a PDF file in the browser's downloads folder.
const downloadPdf = async (html: string, jobTitle: string): Promise<void> => {
  const name = `Offer-Letter-${jobTitle.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Choreo-Labs"}.pdf`;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.setAttribute("sandbox", LETTER_FRAME_SANDBOX);
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${PDF_PAGE_WIDTH}px;height:1200px;border:0`;
  try {
    await new Promise<void>((resolve) => {
      frame.onload = () => resolve();
      frame.srcdoc = html;
      document.body.appendChild(frame);
    });
    const letterBody = frame.contentDocument?.body;
    if (!letterBody) throw new Error("The offer letter could not be rendered.");
    const { default: html2pdf } = await import("html2pdf.js");
    const options = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: name,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: PDF_PAGE_WIDTH },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
      pagebreak: { mode: ["css", "legacy"], avoid: ["tr", "p", "li"] },
    };
    await html2pdf().set(options).from(letterBody).save();
  } finally {
    frame.remove();
  }
};

interface OfferLetterButtonProps {
  applicationId: string;
  jobTitle: string;
}

// A button that opens the offer letter that was sent to the candidate, which can also be saved as a PDF.
export const OfferLetterButton = ({ applicationId, jobTitle }: OfferLetterButtonProps) => {
  const { getToken } = useAppAuthContext();
  const [open, setOpen] = useState(false);
  // Undefined while loading, null when there is no letter, "failed" when it could not be loaded.
  const [letter, setLetter] = useState<OfferLetter | null | undefined | "failed">(undefined);
  const attempt = useRef(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);

  const show = () => {
    setDownloadFailed(false);
    const current = ++attempt.current;
    setLetter(undefined);
    setOpen(true);
    getToken()
      .then((token) => fetchOfferLetter(token, applicationId))
      .then((loaded) => {
        if (attempt.current === current) setLetter(loaded);
      })
      .catch(() => {
        if (attempt.current === current) setLetter("failed");
      });
  };

  const close = () => {
    attempt.current += 1;
    setOpen(false);
    setLetter(undefined);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<ClipboardList size={16} />}
        onClick={show}
        sx={{ ...pillButtonSx, px: 3 }}
      >
        View offer letter
      </Button>
      <Dialog
        open={open}
        onClose={close}
        aria-labelledby="offer-letter-title"
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <DialogTitle
          id="offer-letter-title"
          sx={{ fontWeight: 800, fontSize: "1.3rem", pt: 3, pb: 0 }}
        >
          Your offer letter
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography fontSize="0.9rem" color="text.secondary" mb={2}>
            {jobTitle}
          </Typography>
          {letter === undefined ? (
            <CenteredSpinner py={4} />
          ) : letter === "failed" ? (
            <Typography fontSize="0.95rem" color="text.primary">
              We could not load your offer letter. Please try again.
            </Typography>
          ) : letter === null ? (
            <Typography fontSize="0.95rem" color="text.primary">
              Your offer letter is not available here. Please use the letter sent to your email.
            </Typography>
          ) : (
            <Box
              component="iframe"
              title="Offer letter"
              sandbox={LETTER_FRAME_SANDBOX}
              srcDoc={letter.html}
              sx={{
                width: "100%",
                height: "65vh",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: "8px",
              }}
            />
          )}
          {downloadFailed && (
            <Typography fontSize="0.85rem" color="error" mt={1.5}>
              We could not create the PDF. Please try again.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", gap: 1, pb: 2, px: 3 }}>
          <Button onClick={close} sx={{ fontWeight: 600 }}>
            Close
          </Button>
          {letter === "failed" && (
            <Button variant="contained" onClick={show} sx={{ ...pillButtonSx, px: 3 }}>
              Retry
            </Button>
          )}
          {letter && letter !== "failed" && (
            <Button
              variant="contained"
              disabled={downloading}
              onClick={() => {
                setDownloading(true);
                setDownloadFailed(false);
                downloadPdf(letter.html, jobTitle)
                  .catch(() => setDownloadFailed(true))
                  .finally(() => setDownloading(false));
              }}
              sx={{ ...pillButtonSx, px: 3 }}
            >
              {downloading ? "Preparing…" : "Download PDF"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

interface OfferActionsProps {
  applicationId: string;
  jobTitle: string;
  onAccept: () => void;
  onDecline: () => void;
}

// The buttons that answer an offer.
const OfferActions = ({ applicationId, jobTitle, onAccept, onDecline }: OfferActionsProps) => (
  <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
    <OfferLetterButton applicationId={applicationId} jobTitle={jobTitle} />
    <Button variant="contained" onClick={onAccept} sx={{ ...pillButtonSx, px: 3 }}>
      Accept offer
    </Button>
    <Button variant="outlined" onClick={onDecline} sx={{ ...pillButtonSx, px: 3 }}>
      Decline offer
    </Button>
  </Stack>
);

export default OfferActions;
