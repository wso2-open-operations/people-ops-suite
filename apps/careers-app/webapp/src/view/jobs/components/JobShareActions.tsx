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

import { Box, Stack } from "@mui/material";
import { Bookmark, BookmarkCheck, Facebook, Linkedin, Twitter } from "lucide-react";

interface JobShareActionsProps {
  title: string;
  isSignedIn: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
}

const circleSx = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.25)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "rgba(255,255,255,0.7)",
} as const;

// Share links for the job page, plus a save button that only a signed-in candidate sees.
const JobShareActions = ({ title, isSignedIn, isSaved, onToggleSave }: JobShareActionsProps) => {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const links = [
    { href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: <Facebook size={15} /> },
    {
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`,
      icon: <Twitter size={15} />,
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      icon: <Linkedin size={15} />,
    },
  ];

  return (
    <Stack direction="row" gap={1.5} mt={3}>
      {links.map((link) => (
        <Box
          key={link.href}
          component="a"
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          sx={circleSx}
        >
          {link.icon}
        </Box>
      ))}
      {isSignedIn && (
        <Box
          component="button"
          aria-label="Save job"
          aria-pressed={isSaved}
          onClick={onToggleSave}
          sx={{
            ...circleSx,
            color: isSaved ? "primary.main" : "rgba(255,255,255,0.7)",
            background: "none",
            cursor: "pointer",
          }}
        >
          {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </Box>
      )}
    </Stack>
  );
};

export default JobShareActions;
