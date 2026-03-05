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
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CallIcon from "@mui/icons-material/Call";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FunctionsIcon from "@mui/icons-material/Functions";
import Groups2Icon from "@mui/icons-material/Groups2";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StoreIcon from "@mui/icons-material/Store";
import WorkIcon from "@mui/icons-material/Work";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Grid,
  Grow,
  Stack,
  Typography,
} from "@mui/material";

import { useMemo, useState } from "react";

import CandidateInfoCard from "@component/ui/common-card/components/CandidateInfoCard";
import CandidateMainInfoCard from "@component/ui/common-card/components/CandidateMainInfoCard";
import { CollectionCardProps } from "@utils/types";

const CollectionCard = ({ collection, actions, dataCardIndex }: CollectionCardProps) => {
  const [expand, setExpand] = useState(false);

  const avatarInitials = useMemo(() => {
    const normalizedName = (collection.name ?? "").trim();
    if (!normalizedName) {
      return "?";
    }

    const parts = normalizedName.split(/\s+/).filter(Boolean);
    const firstInitial = parts[0]?.charAt(0) ?? "";
    const secondInitial = parts.length > 1 ? (parts[1]?.charAt(0) ?? "") : "";
    return `${firstInitial}${secondInitial}`.toUpperCase() || "?";
  }, [collection.name]);

  const collectionMeta = collection as typeof collection & {
    type?: string;
    iconName?: string;
    description?: string;
    itemCount?: number;
    department?: string;
    branch?: string;
    team?: string;
    coordinator?: string;
  };

  const resolveCollectionIcon = (
    key: "name" | "description" | "itemCount" | "contact",
  ) => {
    const dynamicIconName = (collectionMeta.iconName ?? collectionMeta.type ?? "").toLowerCase();

    if (dynamicIconName.includes("work") || dynamicIconName.includes("job")) {
      return <WorkIcon />;
    }
    if (dynamicIconName.includes("badge") || dynamicIconName.includes("id")) {
      return <BadgeIcon />;
    }
    if (dynamicIconName.includes("user") || dynamicIconName.includes("profile")) {
      return <AccountCircleIcon />;
    }
    if (dynamicIconName.includes("calendar") || dynamicIconName.includes("date")) {
      return <CalendarMonthIcon />;
    }

    switch (key) {
      case "name":
        return <WorkIcon />;
      case "description":
        return <BadgeIcon />;
      case "itemCount":
        return <AccountCircleIcon />;
      case "contact":
      default:
        return <CalendarMonthIcon />;
    }
  };

  const mainInfoCards = [
    {
      key: "name" as const,
      title: collection.name,
      subTitle: collectionMeta.description ?? `Created by ${collection.createdBy}`,
    },
    {
      key: "description" as const,
      title: collectionMeta.description ?? "No description available",
      subTitle: collection.location ?? "Location not available",
    },
    {
      key: "itemCount" as const,
      title: collectionMeta.itemCount !== undefined ? String(collectionMeta.itemCount) : "N/A",
      subTitle: "Items",
    },
    {
      key: "contact" as const,
      title: collection.email ?? collection.phone ?? "Contact not available",
      subTitle: collection.email ? "Email" : collection.phone ? "Phone" : "No contact details",
    },
  ];

  const formatDate = (value?: string): string => {
    if (!value) {
      return "N/A";
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return parsedDate.toLocaleDateString();
  };

  const detailCards = [
    {
      title: "Overview",
      items: [
        {
          title: "Collection ID",
          subTitle: String(collection.id),
          icon: <AccountCircleIcon />,
        },
        {
          title: "Name",
          subTitle: collection.name,
          icon: <BadgeIcon />,
        },
        {
          title: "Description",
          subTitle: collectionMeta.description ?? "N/A",
          icon: <WorkIcon />,
        },
        {
          title: "Items",
          subTitle: collectionMeta.itemCount !== undefined ? String(collectionMeta.itemCount) : "N/A",
          icon: <CalendarMonthIcon />,
        },
        {
          title: "Type",
          subTitle: collectionMeta.type ?? "N/A",
          icon: <EventIcon />,
        },
      ],
    },
    {
      title: "Contact & Location",
      items: [
        {
          title: "Email",
          subTitle: collection.email ?? "N/A",
          icon: <EmailIcon />,
        },
        {
          title: "Phone",
          subTitle: collection.phone ?? "N/A",
          icon: <CallIcon />,
        },
        {
          title: "Location",
          subTitle: collection.location ?? "N/A",
          icon: <LocationOnIcon />,
        },
        {
          title: "Created By",
          subTitle: collection.createdBy,
          icon: <BadgeIcon />,
        },
        {
          title: "Updated By",
          subTitle: collection.updatedBy,
          icon: <FunctionsIcon />,
        },
      ],
    },
    {
      title: "Audit",
      items: [
        {
          title: "Created On",
          subTitle: formatDate(collection.createdOn),
          icon: <CalendarMonthIcon />,
        },
        {
          title: "Updated On",
          subTitle: formatDate(collection.updatedOn),
          icon: <EventIcon />,
        },
        {
          title: "Department",
          subTitle: collectionMeta.department ?? "N/A",
          icon: <BusinessIcon />,
        },
        {
          title: "Branch",
          subTitle: collectionMeta.branch ?? "N/A",
          icon: <StoreIcon />,
        },
        {
          title: "Team",
          subTitle: collectionMeta.team ?? "N/A",
          icon: <Groups2Icon />,
        },
        {
          title: "Coordinator",
          subTitle: collectionMeta.coordinator ?? "N/A",
          icon: <Diversity3Icon />,
        },
      ],
    },
  ];

  return (
    <Grow
      in={true}
      style={{ transformOrigin: "0 0 0" }}
      {...(dataCardIndex ? { timeout: Math.min(dataCardIndex * 200, 1500) } : {})}
    >
      <Stack>
        <Accordion
          variant="outlined"
          square
          expanded={expand}
          onChange={(_, isExpanded) => setExpand(isExpanded)}
          sx={{
            borderRadius: 3,
            "&.MuiAccordion-root:before": {
              backgroundColor: "transparent",
            },
            borderLeft: 8,
            borderLeftColor: "divider",
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ width: "100%" }}>
            <Stack flexDirection={"column"} sx={{ width: "100%" }}>
              <Stack flexDirection={"row"} sx={{ m: 0, width: "100%", alignItems: "center" }}>
                <Stack flexDirection={"row"} sx={{ alignItems: "center" }}>
                  <Avatar sx={{ width: 70, height: 70 }} color="primary.main">
                    {avatarInitials}
                  </Avatar>
                  <Stack sx={{ ml: 3, alignItems: "left" }} gap={0.3}>
                    <Typography variant="h5" sx={{ fontWeight: 650 }}>
                      {collection.name}
                    </Typography>

                    <Stack flexDirection={"row"} gap={0.5}>
                      <EmailIcon
                        sx={{
                          color: "primary.dark",
                          fontSize: 13,
                        }}
                      />
                      <Typography variant="body2" color="primary.dark">
                        {collection?.email ?? ""}
                      </Typography>
                    </Stack>
                    <Stack flexDirection={"row"} gap={0.5}>
                      <CallIcon
                        sx={{
                          color: "secondary.dark",
                          fontSize: 13,
                        }}
                      />
                      <Typography variant="body2" color="secondary.dark">
                        {collection?.phone ?? ""}
                      </Typography>
                    </Stack>
                    <Stack flexDirection={"row"} gap={0.5}>
                      <LocationOnIcon
                        sx={{
                          color: "secondary.dark",
                          fontSize: 13,
                        }}
                      />
                      <Typography variant="body2" color="secondary.dark">
                        {collection?.location ?? ""}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>
                <Stack sx={{ ml: "auto" }}>
                  <Stack
                    flexDirection={"row"}
                    gap={2}
                    sx={{ ml: "auto", mb: 1.5 }}
                    alignItems={"center"}
                  >
                    {actions}
                  </Stack>
                  <Grid
                    container
                    flexDirection={"row"}
                    sx={{ width: "auto", ml: "auto", mr: 1 }}
                    gap={2}
                  >
                    {mainInfoCards.map(({ key, title, subTitle }) => (
                      <CandidateMainInfoCard
                        key={`${collection.id}-${key}`}
                        title={title}
                        subTitle={subTitle}
                        icon={resolveCollectionIcon(key)}
                      />
                    ))}
                  </Grid>
                </Stack>
              </Stack>
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container flexDirection={"row"} columns={{ xs: 4 }} gap={4}>
              {detailCards.map((card, cardIndex) => (
                <CandidateInfoCard
                  key={`${collection.id}-detail-${cardIndex}`}
                  title={card.title}
                  items={card.items}
                />
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Grow>
  );
};

export default CollectionCard;
