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
import { AnimatePresence, motion, type Transition, useReducedMotion } from "framer-motion";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, TextField } from "@mui/material";

import { useEffect, useMemo, useRef, useState } from "react";

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

interface SearchableNode {
  nodeKey: string;
  name: string;
  type: NodeType;
  pathNames: string[];
}

const NODE_WIDTH = 350;
const NODE_HEIGHT = 180;
const NODE_VERTICAL_SPACING = NODE_HEIGHT + 56;
const HORIZONTAL_GAP = 460;
const PADDING = 48;
const MIN_ZOOM_SCALE = 0.2;
const MAX_ZOOM_SCALE = 2.5;
const MIN_ZOOM_PERCENT = Math.round(MIN_ZOOM_SCALE * 100);
const MAX_ZOOM_PERCENT = Math.round(MAX_ZOOM_SCALE * 100);
const NODE_MOTION_TRANSITION: Transition = {
  duration: 0.26,
  ease: [0.22, 1, 0.36, 1],
};

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

const collectSearchableNodes = (
  node: ChartNode,
  pathNames: string[] = [],
  collector: SearchableNode[] = [],
): SearchableNode[] => {
  const nextPathNames = [...pathNames, node.name];

  if (node.type !== NodeType.Company) {
    collector.push({
      nodeKey: node.nodeKey,
      name: node.name,
      type: node.type,
      pathNames: nextPathNames,
    });
  }

  node.children.forEach((child) => collectSearchableNodes(child, nextPathNames, collector));

  return collector;
};

const getAncestorKeys = (nodeKey: string): string[] => {
  const segments = nodeKey.split("/");
  const ancestors: string[] = [];
  let key = "";

  for (let index = 0; index < segments.length - 1; index += 1) {
    key = index === 0 ? segments[index] : `${key}/${segments[index]}`;
    ancestors.push(key);
  }

  return ancestors;
};

const matchesSearchQuery = (node: SearchableNode, tokens: string[]): boolean => {
  if (tokens.length === 0) return false;

  const normalizedPathNames = node.pathNames.map((name) => name.toLowerCase());
  const nodeName = node.name.toLowerCase();

  if (tokens.length === 1) {
    return nodeName.includes(tokens[0]);
  }

  const lastToken = tokens[tokens.length - 1];
  if (!nodeName.includes(lastToken)) return false;

  let searchStartIndex = 0;
  for (const token of tokens.slice(0, -1)) {
    let matchedIndex = -1;

    for (let index = searchStartIndex; index < normalizedPathNames.length; index += 1) {
      if (normalizedPathNames[index].includes(token)) {
        matchedIndex = index;
        break;
      }
    }

    if (matchedIndex < 0) return false;
    searchStartIndex = matchedIndex;
  }

  return true;
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
  const zoomBehaviorRef = useRef<ReturnType<typeof zoom<HTMLDivElement, unknown>> | null>(null);
  const reduceMotion = useReducedMotion();
  const [zoomPercentage, setZoomPercentage] = useState(100);
  const zoomPercentageRef = useRef(100);
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);
  const [hasSearchAttempted, setHasSearchAttempted] = useState(false);
  const [highlightedNodeKey, setHighlightedNodeKey] = useState<string | null>(null);
  const [pendingCenterNodeKey, setPendingCenterNodeKey] = useState<string | null>(null);

  const treeData = useMemo(() => buildCompanyNode(company), [company]);
  const searchableNodes = useMemo(() => collectSearchableNodes(treeData), [treeData]);

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

  const nodeTransition: Transition = reduceMotion
    ? {
        duration: 0,
      }
    : NODE_MOTION_TRANSITION;

  const centerNodeInViewport = (node: D3Node) => {
    if (!viewportRef.current || !zoomBehaviorRef.current) return;

    const viewportElement = viewportRef.current;
    const currentTransform = zoomTransform(viewportElement);
    const scale = currentTransform.k;
    const nodeCenterX = node.y + NODE_WIDTH / 2;
    const nodeCenterY = node.x + NODE_HEIGHT / 2;

    const targetTransform = zoomIdentity
      .translate(
        viewportElement.clientWidth / 2 - nodeCenterX * scale,
        viewportElement.clientHeight / 2 - nodeCenterY * scale,
      )
      .scale(scale);

    select(viewportElement).call(zoomBehaviorRef.current.transform, targetTransform);
  };

  const revealAndFocusNode = (nodeKey: string) => {
    const ancestorKeys = getAncestorKeys(nodeKey);
    ancestorKeys.forEach((ancestorKey) => {
      if (!expandedNodes.has(ancestorKey)) {
        onToggle(ancestorKey);
      }
    });

    setHighlightedNodeKey(nodeKey);
    setPendingCenterNodeKey(nodeKey);
  };

  const executeSearch = () => {
    const normalizedQuery = searchInput.trim().toLowerCase();
    if (!normalizedQuery) {
      setHasSearchAttempted(false);
      setSearchResults([]);
      setActiveSearchIndex(0);
      setHighlightedNodeKey(null);
      setPendingCenterNodeKey(null);
      return;
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const matchedNodeKeys = searchableNodes
      .filter((node) => matchesSearchQuery(node, queryTokens))
      .map((node) => node.nodeKey);

    setHasSearchAttempted(true);
    setSearchResults(matchedNodeKeys);
    setActiveSearchIndex(0);

    if (matchedNodeKeys.length > 0) {
      revealAndFocusNode(matchedNodeKeys[0]);
      return;
    }

    setHighlightedNodeKey(null);
    setPendingCenterNodeKey(null);
  };

  const navigateSearchResults = (direction: 1 | -1) => {
    if (searchResults.length === 0) return;

    const nextIndex =
      (activeSearchIndex + direction + searchResults.length) % searchResults.length;
    setActiveSearchIndex(nextIndex);
    revealAndFocusNode(searchResults[nextIndex]);
  };

  useEffect(() => {
    if (!viewportRef.current || !zoomLayerRef.current) return;

    const viewportElement = viewportRef.current;
    const zoomLayerElement = zoomLayerRef.current;
    const viewportSelection = select(viewportElement);
    const updateZoomPercentage = (scale: number) => {
      const nextZoomPercentage = Math.round(scale * 100);
      if (zoomPercentageRef.current === nextZoomPercentage) return;

      zoomPercentageRef.current = nextZoomPercentage;
      setZoomPercentage(nextZoomPercentage);
    };

    const zoomBehavior = zoom<HTMLDivElement, unknown>()
      .filter((event) => {
        const allowEvent = (!event.ctrlKey || event.type === "wheel") && !event.button;
        if (!allowEvent) return false;

        if (event.type !== "mousedown") return true;

        const eventTarget = event.target as Element | null;
        return !eventTarget?.closest("[data-org-node='true'], [data-org-search='true']");
      })
      .scaleExtent([MIN_ZOOM_SCALE, MAX_ZOOM_SCALE])
      .on("zoom", (event) => {
        const { x, y, k } = event.transform;
        zoomLayerElement.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
        updateZoomPercentage(k);
      });
    zoomBehaviorRef.current = zoomBehavior;

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
      updateZoomPercentage(fitScale);
      hasAppliedInitialTransformRef.current = true;
    } else {
      const currentTransform = zoomTransform(viewportElement);
      zoomLayerElement.style.transform = `translate(${currentTransform.x}px, ${currentTransform.y}px) scale(${currentTransform.k})`;
      updateZoomPercentage(currentTransform.k);
    }

    return () => {
      viewportSelection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [layout]);

  useEffect(() => {
    if (!pendingCenterNodeKey) return;

    const targetNode = layout.nodes.find((node) => node.data.nodeKey === pendingCenterNodeKey);
    if (!targetNode) return;

    centerNodeInViewport(targetNode);
    setPendingCenterNodeKey(null);
  }, [layout, pendingCenterNodeKey]);

  useEffect(() => {
    setSearchInput("");
    setSearchResults([]);
    setActiveSearchIndex(0);
    setHasSearchAttempted(false);
    setHighlightedNodeKey(null);
    setPendingCenterNodeKey(null);
  }, [company.id]);

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
          data-org-search="true"
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            zIndex: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              px: 0.75,
              py: 0.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "8px",
              bgcolor: "background.paper",
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
            <TextField
              variant="standard"
              placeholder="Search org nodes"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                executeSearch();
              }}
              slotProps={{
                input: {
                  disableUnderline: true,
                  sx: {
                    width: 220,
                    fontSize: 13,
                    lineHeight: "18px",
                  },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={() => navigateSearchResults(-1)}
              disabled={searchResults.length <= 1}
              sx={{ p: 0.25 }}
            >
              <KeyboardArrowLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => navigateSearchResults(1)}
              disabled={searchResults.length <= 1}
              sx={{ p: 0.25 }}
            >
              <KeyboardArrowRightIcon fontSize="small" />
            </IconButton>
          </Box>

          {searchResults.length > 0 && (
            <Typography variant="caption" sx={{ color: "text.secondary", px: 0.5 }}>
              {activeSearchIndex + 1} / {searchResults.length}
            </Typography>
          )}

          {hasSearchAttempted && searchResults.length === 0 && (
            <Typography variant="caption" sx={{ color: "error.main", px: 0.5 }}>
              No results found
            </Typography>
          )}
        </Box>

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

          <AnimatePresence initial={false}>
            {layout.nodes.map((node) => (
              <motion.div
                key={node.data.nodeKey}
                data-org-node="true"
                initial={
                  reduceMotion
                    ? { x: node.y, y: node.x, opacity: 0 }
                    : { x: node.y, y: node.x, opacity: 0, scale: 0.96 }
                }
                animate={{
                  x: node.y,
                  y: node.x,
                  opacity: 1,
                  scale: 1,
                }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                transition={nodeTransition}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: `${NODE_WIDTH}px`,
                  zIndex: 1,
                  willChange: "transform, opacity",
                  borderRadius: "8px",
                  outline:
                    highlightedNodeKey === node.data.nodeKey ? "2px solid #0284c7" : "none",
                  outlineOffset: 2,
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
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Zoom: {zoomPercentage}% (range: {MIN_ZOOM_PERCENT}% to {MAX_ZOOM_PERCENT}%)
      </Typography>
    </Box>
  );
};

export default OrgStructureTree;
