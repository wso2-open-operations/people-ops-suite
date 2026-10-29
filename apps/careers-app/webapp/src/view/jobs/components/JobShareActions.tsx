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

import { Box, Stack, Tooltip } from "@wso2/oxygen-ui";
import { Bookmark, BookmarkCheck, Facebook } from "@wso2/oxygen-ui-icons-react";

import { heroColorsOf, useIsDark } from "@config/brand";
import { jobShareLinks } from "@utils/jobFilterUtils";
import type { VacancyDetail } from "@utils/vacancyService";

interface JobShareActionsProps {
  job: Pick<VacancyDetail, "id" | "title" | "country">;
  isSignedIn: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
}

// The icon library has no X or LinkedIn logos, so they are drawn here from their official shapes.
const XLogo = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const LinkedinLogo = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
  </svg>
);

const NETWORK_ICONS = {
  facebook: <Facebook size={15} />,
  x: <XLogo size={15} />,
  linkedin: <LinkedinLogo size={15} />,
};

const circleSx = (hero: ReturnType<typeof heroColorsOf>) =>
  ({
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: `1px solid ${hero.circleBorder}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: hero.circleIcon,
  }) as const;

// Share links for the job page, plus a save button that only a signed-in candidate sees.
const JobShareActions = ({ job, isSignedIn, isSaved, onToggleSave }: JobShareActionsProps) => {
  const hero = heroColorsOf(useIsDark() ? "dark" : "light");
  const links = jobShareLinks(job, window.location.origin);

  return (
    <Stack direction="row" gap={1.5} mt={3}>
      {links.map((link) => (
        <Tooltip key={link.href} title={link.label}>
          <Box
            component="a"
            href={link.href}
            aria-label={`${link.label} (opens in a new tab)`}
            target="_blank"
            rel="noopener noreferrer"
            sx={circleSx(hero)}
          >
            {NETWORK_ICONS[link.network]}
          </Box>
        </Tooltip>
      ))}
      {isSignedIn && (
        <Box
          component="button"
          aria-label="Save job"
          aria-pressed={isSaved}
          onClick={onToggleSave}
          sx={{
            ...circleSx(hero),
            color: isSaved ? "primary.main" : hero.circleIcon,
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
