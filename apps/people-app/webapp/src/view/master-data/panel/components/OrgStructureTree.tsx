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
import { Box, Typography } from "@mui/material";
import { HierarchyPointNode, hierarchy, select, tree, zoom, zoomIdentity, zoomTransform } from "d3";

import { useEffect, useMemo, useRef } from "react";

import { BusinessUnit, Company, SubTeam, Team, Unit } from "@services/organization";
import { NodeType } from "@utils/types";
import { UnitType } from "@utils/utils";

import OrgStructureCard from "./OrgStructureCard";

interface OrgStructureTreeProps {
  company: Company;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (id: string, type: UnitType) => void;
  onAdd: (id: string, type: UnitType) => void;
}

interface ChartNode {
  nodeKey: string;
  id: string;
  name: string;
  type: NodeType;
  headCount: number;
  teamHead?: Company["head"];
  functionLead?: Company["functionalLead"];
  children: ChartNode[];
}

interface D3Node {
  data: ChartNode;
  x: number;
  y: number;
  descendants: () => D3Node[];
  links: () => Array<{ source: D3Node; target: D3Node }>;
}

interface LayoutResult {
  nodes: D3Node[];
  links: Array<{ source: D3Node; target: D3Node }>;
  width: number;
  height: number;
}

const NODE_WIDTH = 350;
const NODE_HEIGHT = 180;
const NODE_VERTICAL_SPACING = NODE_HEIGHT + 56;
const HORIZONTAL_GAP = 460;
const PADDING = 48;

const getNodeKey = (type: NodeType, id: string, parentNodeKey?: string) => {
  const selfKey = `${type}:${id}`;
  return parentNodeKey ? `${parentNodeKey}/${selfKey}` : selfKey;
};

const findNodeByKey = (node: ChartNode, nodeKey: string): ChartNode | null => {
  if (node.nodeKey === nodeKey) return node;

  for (const child of node.children) {
    const match = findNodeByKey(child, nodeKey);
    if (match) return match;
  }

  return null;
};

const collectDescendantKeys = (node: ChartNode, collector: string[] = []): string[] => {
  node.children.forEach((child) => {
    collector.push(child.nodeKey);
    collectDescendantKeys(child, collector);
  });
  return collector;
};

const buildUnitNode = (unit: Unit, parentNodeKey: string): ChartNode => ({
  nodeKey: getNodeKey(NodeType.Unit, unit.id, parentNodeKey),
  id: unit.id,
  name: unit.name,
  type: NodeType.Unit,
  headCount: unit.headCount,
  teamHead: unit.head,
  functionLead: unit.functionalLead,
  children: [],
});

const buildSubTeamNode = (subTeam: SubTeam, parentNodeKey: string): ChartNode => {
  const nodeKey = getNodeKey(NodeType.SubTeam, subTeam.id, parentNodeKey);
  return {
    nodeKey,
    id: subTeam.id,
    name: subTeam.name,
    type: NodeType.SubTeam,
    headCount: subTeam.headCount,
    teamHead: subTeam.head,
    functionLead: subTeam.functionalLead,
    children: subTeam.units.map((unit) => buildUnitNode(unit, nodeKey)),
  };
};

const buildTeamNode = (team: Team, parentNodeKey: string): ChartNode => {
  const nodeKey = getNodeKey(NodeType.Team, team.id, parentNodeKey);
  return {
    nodeKey,
    id: team.id,
    name: team.name,
    type: NodeType.Team,
    headCount: team.headCount,
    teamHead: team.head,
    functionLead: team.functionalLead,
    children: team.subTeams.map((subTeam) => buildSubTeamNode(subTeam, nodeKey)),
  };
};

const buildBusinessUnitNode = (businessUnit: BusinessUnit, parentNodeKey: string): ChartNode => {
  const nodeKey = getNodeKey(NodeType.BusinessUnit, businessUnit.id, parentNodeKey);
  return {
    nodeKey,
    id: businessUnit.id,
    name: businessUnit.name,
    type: NodeType.BusinessUnit,
    headCount: businessUnit.headCount,
    teamHead: businessUnit.head,
    functionLead: businessUnit.functionalLead,
    children: businessUnit.teams.map((team) => buildTeamNode(team, nodeKey)),
  };
};

const buildCompanyNode = (company: Company): ChartNode => {
  const nodeKey = getNodeKey(NodeType.Company, company.id);
  return {
    nodeKey,
    id: company.id,
    name: company.name,
    type: NodeType.Company,
    headCount: company.headCount,
    teamHead: company.head,
    functionLead: company.functionalLead,
    children: company.businessUnits.map((businessUnit) =>
      buildBusinessUnitNode(businessUnit, nodeKey),
    ),
  };
};

const createLinkPath = (source: D3Node, target: D3Node) => {
  const sourceX = source.y + NODE_WIDTH;
  const sourceY = source.x + NODE_HEIGHT / 2;
  const targetX = target.y;
  const targetY = target.x + NODE_HEIGHT / 2;
  const middleX = sourceX + (targetX - sourceX) / 2;

  return `M ${sourceX} ${sourceY} C ${middleX} ${sourceY}, ${middleX} ${targetY}, ${targetX} ${targetY}`;
};

const OrgStructureTree = ({
  company,
  expandedNodes,
  onToggle,
  onEdit,
  onAdd,
}: OrgStructureTreeProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const zoomLayerRef = useRef<HTMLDivElement>(null);
  const hasAppliedInitialTransformRef = useRef(false);
  const previousCompanyIdRef = useRef(company.id);

  const treeData = useMemo(() => buildCompanyNode(company), [company]);

  useEffect(() => {
    if (previousCompanyIdRef.current === company.id) return;
    hasAppliedInitialTransformRef.current = false;
    previousCompanyIdRef.current = company.id;
  }, [company.id]);

  const handleToggle = (nodeKey: string) => {
    const node = findNodeByKey(treeData, nodeKey);

    if (!node) {
      onToggle(nodeKey);
      return;
    }

    if (!expandedNodes.has(nodeKey)) {
      onToggle(nodeKey);
      return;
    }

    onToggle(nodeKey);
    const descendantKeys = collectDescendantKeys(node);
    descendantKeys.forEach((key) => {
      if (expandedNodes.has(key)) {
        onToggle(key);
      }
    });
  };

  const layout = useMemo<LayoutResult>(() => {
    const root = hierarchy(treeData, (node) => {
      if (node.children.length === 0) return null;
      if (!expandedNodes.has(node.nodeKey)) return null;
      return node.children;
    });
    const treeLayout = tree<ChartNode>().nodeSize([NODE_VERTICAL_SPACING, HORIZONTAL_GAP]);
    treeLayout(root);

    const nodes = root.descendants() as HierarchyPointNode<ChartNode>[] as D3Node[];
    const links = root.links() as Array<{ source: D3Node; target: D3Node }>;

    const minX = Math.min(...nodes.map((node) => node.x));
    const maxX = Math.max(...nodes.map((node) => node.x));
    const minY = Math.min(...nodes.map((node) => node.y));
    const maxY = Math.max(...nodes.map((node) => node.y));

    nodes.forEach((node) => {
      node.x = node.x - minX + PADDING;
      node.y = node.y - minY + PADDING;
    });

    return {
      nodes,
      links,
      width: maxY - minY + NODE_WIDTH + PADDING * 2,
      height: maxX - minX + NODE_HEIGHT + PADDING * 2,
    };
  }, [expandedNodes, treeData]);

  useEffect(() => {
    if (!viewportRef.current || !zoomLayerRef.current) return;

    const viewportElement = viewportRef.current;
    const zoomLayerElement = zoomLayerRef.current;
    const viewportSelection = select(viewportElement);

    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .filter((event) => {
        const allowEvent = (!event.ctrlKey || event.type === "wheel") && !event.button;
        if (!allowEvent) return false;

        if (event.type !== "mousedown") return true;

        const eventTarget = event.target as Element | null;
        return !eventTarget?.closest("[data-org-node='true']");
      })
      .scaleExtent([0.2, 2.5])
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;
        zoomLayerElement.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
      });

    viewportSelection.call(zoomBehavior);
    viewportSelection.on("dblclick.zoom", null);

    if (!hasAppliedInitialTransformRef.current) {
      const viewportWidth = viewportElement.clientWidth || 1;
      const viewportHeight = viewportElement.clientHeight || 1;
      const viewportPadding = 24;
      const fitScale = Math.min(
        (viewportWidth - viewportPadding * 2) / layout.width,
        (viewportHeight - viewportPadding * 2) / layout.height,
        1,
      );
      const initialTransform = zoomIdentity
        .translate(viewportPadding, viewportPadding)
        .scale(fitScale);

      viewportSelection.call(zoomBehavior.transform, initialTransform);
      hasAppliedInitialTransformRef.current = true;
    } else {
      const currentTransform = zoomTransform(viewportElement);
      zoomLayerElement.style.transform = `translate(${currentTransform.x}px, ${currentTransform.y}px) scale(${currentTransform.k})`;
    }

    return () => {
      viewportSelection.on(".zoom", null);
    };
  }, [layout]);

  return (
    <Box
      sx={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        overflow: "hidden",
      }}
    >
      <Box
        ref={viewportRef}
        sx={{
          position: "relative",
          flex: 1,
          minHeight: "550px",
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "8px",
          background:
            "radial-gradient(circle at 1px 1px, rgba(113, 113, 122, 0.16) 1px, transparent 0)",
          backgroundSize: "18px 18px",
          cursor: "grab",
          "&:active": {
            cursor: "grabbing",
          },
        }}
      >
        <Box
          ref={zoomLayerRef}
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${layout.width}px`,
            height: `${layout.height}px`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            width={layout.width}
            height={layout.height}
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            {layout.links.map((link) => (
              <path
                key={`${link.source.data.nodeKey}-${link.target.data.nodeKey}`}
                d={createLinkPath(link.source, link.target)}
                stroke="#d4d4d8"
                strokeWidth={2}
                fill="none"
              />
            ))}
          </svg>

          {layout.nodes.map((node) => (
            <Box
              key={node.data.nodeKey}
              data-org-node="true"
              sx={{
                position: "absolute",
                left: `${node.y}px`,
                top: `${node.x}px`,
                width: `${NODE_WIDTH}px`,
                zIndex: 1,
              }}
            >
              <OrgStructureCard
                name={node.data.name}
                type={node.data.type}
                headCount={node.data.headCount}
                teamHead={node.data.teamHead}
                functionLead={node.data.functionLead}
                hasChildren={node.data.children.length > 0}
                isExpanded={expandedNodes.has(node.data.nodeKey)}
                onCollapse={() => handleToggle(node.data.nodeKey)}
                onEdit={() => onEdit(node.data.id, node.data.type as UnitType)}
                onAdd={() => onAdd(node.data.id, node.data.type as UnitType)}
              />
            </Box>
          ))}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Zoom range: 20% to 250%
      </Typography>
    </Box>
  );
};

export default OrgStructureTree;
