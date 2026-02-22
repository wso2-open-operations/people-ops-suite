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
import { Box } from "@mui/material";

import { useLayoutEffect, useRef, useState } from "react";

import { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";
import { NodeType } from "@utils/types";
import { UnitType } from "@utils/utils"

import ConnectionArrows from "./ConnectionArrows";
import OrgStructureCard from "./OrgStructureCard";

interface OrgStructureTreeProps {
  company: Company;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (id: string, type: UnitType) => void;
  onAdd: (id: string, type: UnitType) => void;
}

interface Connection {
  parentId: string;
  childId: string;
}

const OrgStructureTree = ({
  company,
  expandedNodes,
  onToggle,
  onEdit,
  onAdd,
}: OrgStructureTreeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connections, setConnections] = useState<Connection[]>([]);

  // Register card ref
  const registerCardRef = (id: string, element: HTMLDivElement | null) => {
    if (element) {
      cardRefs.current.set(id, element);
    } else {
      cardRefs.current.delete(id);
    }
  };

  // Build connections based on expanded nodes
  useLayoutEffect(() => {
    const newConnections: Connection[] = [];

    // Company -> Business Units
    if (expandedNodes.has(company.id)) {
      company.businessUnits?.forEach((bu) => {
        newConnections.push({ parentId: company.id, childId: bu.id });
      });

      // Business Units -> Teams
      company.businessUnits?.forEach((bu) => {
        if (expandedNodes.has(bu.id)) {
          bu.teams?.forEach((team) => {
            newConnections.push({ parentId: bu.id, childId: team.id });
          });

          // Teams -> Sub Teams
          bu.teams?.forEach((team) => {
            if (expandedNodes.has(team.id)) {
              team.subTeams?.forEach((subTeam) => {
                newConnections.push({ parentId: team.id, childId: subTeam.id });
              });

              // Sub Teams -> Units
              team.subTeams?.forEach((subTeam) => {
                if (expandedNodes.has(subTeam.id)) {
                  subTeam.units?.forEach((unit) => {
                    newConnections.push({ parentId: subTeam.id, childId: unit.id });
                  });
                }
              });
            }
          });
        }
      });
    }

    setConnections(newConnections);
  }, [company, expandedNodes]);

  // Render Units
  const renderUnit = (unit: Unit) => (
    <Box
      key={unit.id}
      sx={{
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
        position: "relative",
        // animation: "fadeInSlide 0.3s ease-out",
        // "@keyframes fadeInSlide": {
        //   from: {
        //     opacity: 0,
        //     transform: "translateX(-20px)",
        //   },
        //   to: {
        //     opacity: 1,
        //     transform: "translateX(0)",
        //   },
        // },
      }}
    >
      <Box
        ref={(el) => registerCardRef(unit.id, el as HTMLDivElement | null)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "0px",
        }}
      >
        <OrgStructureCard
          name={unit.name}
          type={NodeType.Unit}
          headCount={unit.headCount}
          teamHead={unit.head}
          functionLead={unit.functionalLead}
          hasChildren={false}
          isExpanded={false}
          onCollapse={() => { }}
          onEdit={() => onEdit(unit.id, UnitType.Unit)}
          onAdd={() => onAdd(unit.id, UnitType.Unit)}
        />
      </Box>
    </Box>
  );

  // Render sub teams
  const renderSubTeam = (subTeam: SubTeam) => {
    const hasUnits = subTeam.units?.length > 0;
    const isExpanded = expandedNodes.has(subTeam.id);

    return (
      <Box
        key={subTeam.id}
        sx={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          position: "relative",
          // animation: "fadeInSlide 0.3s ease-out",
          // "@keyframes fadeInSlide": {
          //   from: {
          //     opacity: 0,
          //     transform: "translateX(-20px)",
          //   },
          //   to: {
          //     opacity: 1,
          //     transform: "translateX(0)",
          //   },
          // },
        }}
      >
        <Box
          ref={(el) => registerCardRef(subTeam.id, el as HTMLDivElement | null)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
        >
          <OrgStructureCard
            name={subTeam.name}
            type={NodeType.SubTeam}
            headCount={subTeam.headCount}
            teamHead={subTeam.head}
            functionLead={subTeam.functionalLead}
            hasChildren={hasUnits}
            isExpanded={isExpanded}
            onCollapse={() => onToggle(subTeam.id)}
            onEdit={() => onEdit(subTeam.id, UnitType.SubTeam)}
            onAdd={() => onAdd(subTeam.id, UnitType.SubTeam)}
          />
        </Box>

        {hasUnits && isExpanded && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "64px",
              alignItems: "flex-start",
              position: "relative",
              mt: "200px",
              animation: "expandWidth 0.4s ease-out",
              "@keyframes expandWidth": {
                from: {
                  opacity: 0,
                  maxWidth: 0,
                },
                to: {
                  opacity: 1,
                  maxWidth: "2000px",
                },
              },
            }}
          >
            {subTeam.units.map(renderUnit)}
          </Box>
        )}
      </Box>
    );
  };

  // Render Teams
  const renderTeam = (team: Team) => {
    const hasSubTeams = team.subTeams?.length > 0;
    const isExpanded = expandedNodes.has(team.id);

    return (
      <Box
        key={team.id}
        sx={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          position: "relative",
          // animation: "fadeInSlide 0.3s ease-out",
          // "@keyframes fadeInSlide": {
          //   from: {
          //     opacity: 0,
          //     transform: "translateX(-20px)",
          //   },
          //   to: {
          //     opacity: 1,
          //     transform: "translateX(0)",
          //   },
          // },
        }}
      >
        <Box
          ref={(el) => registerCardRef(team.id, el as HTMLDivElement | null)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
        >
          <OrgStructureCard
            name={team.name}
            type={NodeType.Team}
            headCount={team.headCount}
            teamHead={team.head}
            functionLead={team.functionalLead}
            hasChildren={hasSubTeams}
            isExpanded={isExpanded}
            onCollapse={() => onToggle(team.id)}
            onEdit={() => onEdit(team.id, UnitType.Team)}
            onAdd={() => onAdd(team.id, UnitType.Team)}
          />
        </Box>

        {hasSubTeams && isExpanded && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "64px",
              alignItems: "flex-start",
              position: "relative",
              mt: "200px",
              animation: "expandWidth 0.4s ease-out",
              "@keyframes expandWidth": {
                from: {
                  opacity: 0,
                  maxWidth: 0,
                },
                to: {
                  opacity: 1,
                  maxWidth: "2000px",
                },
              },
            }}
          >
            {team.subTeams.map(renderSubTeam)}
          </Box>
        )}
      </Box>
    );
  };

  // Render Business Units
  const renderBusinessUnit = (bu: BusinessUnit) => {
    const hasTeams = bu.teams?.length > 0;
    const isExpanded = expandedNodes.has(bu.id);

    return (
      <Box
        key={bu.id}
        sx={{
          display: "flex",
          gap: "16px",
          alignItems: "flex-start",
          position: "relative",
          // animation: "fadeInSlide 0.3s ease-out",
          // "@keyframes fadeInSlide": {
          //   from: {
          //     opacity: 0,
          //     transform: "translateX(-20px)",
          //   },
          //   to: {
          //     opacity: 1,
          //     transform: "translateX(0)",
          //   },
          // },
        }}
      >
        <Box
          ref={(el) => registerCardRef(bu.id, el as HTMLDivElement | null)}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
        >
          <OrgStructureCard
            name={bu.name}
            type={NodeType.BusinessUnit}
            headCount={bu.headCount}
            teamHead={bu.head}
            functionLead={bu.functionalLead}
            hasChildren={hasTeams}
            isExpanded={isExpanded}
            onCollapse={() => onToggle(bu.id)}
            onEdit={() => onEdit(bu.id, UnitType.BusinessUnit)}
            onAdd={() => onAdd(bu.id, UnitType.BusinessUnit)}
          />
        </Box>

        {hasTeams && isExpanded && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "64px",
              alignItems: "flex-start",
              position: "relative",
              mt: "200px",
              animation: "expandWidth 0.4s ease-out",
              "@keyframes expandWidth": {
                from: {
                  opacity: 0,
                  maxWidth: 0,
                },
                to: {
                  opacity: 1,
                  maxWidth: "2000px",
                },
              },
            }}
          >
            {bu.teams.map(renderTeam)}
          </Box>
        )}
      </Box>
    );
  };

  const hasBusinessUnits = company.businessUnits?.length > 0;
  const isCompanyExpanded = expandedNodes.has(company.id);

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
        position: "relative",
      }}
    >
      {/* SVG Overlay for Arrows */}
      <ConnectionArrows
        connections={connections}
        cardRefs={cardRefs.current}
        containerRef={containerRef.current}
      />

      {/* Company Card */}
      <Box
        ref={(el) => registerCardRef(company.id, el as HTMLDivElement | null)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "0px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <OrgStructureCard
          name={company.name}
          type={NodeType.Company}
          headCount={company.headCount}
          teamHead={company.head}
          functionLead={company.functionalLead}
          hasChildren={hasBusinessUnits}
          isExpanded={isCompanyExpanded}
          onCollapse={() => onToggle(company.id)}
          onEdit={() => onEdit(company.id, UnitType.Company)}
          onAdd={() => onAdd(company.id, UnitType.Company)}
        />
      </Box>

      {/* Business Units */}
      {hasBusinessUnits && isCompanyExpanded && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "64px",
            alignItems: "flex-start",
            position: "relative",
            mt: "200px",
            zIndex: 1,
            animation: "expandWidth 0.4s ease-out",
            "@keyframes expandWidth": {
              from: {
                opacity: 0,
                maxWidth: 0,
              },
              to: {
                opacity: 1,
                maxWidth: "2000px",
              },
            },
          }}
        >
          {company.businessUnits.map(renderBusinessUnit)}
        </Box>
      )}
    </Box>
  );
};

export default OrgStructureTree;
