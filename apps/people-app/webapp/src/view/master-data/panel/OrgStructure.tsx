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
// KIND, either express or implied. See the License for the
// specific language governing permissions and limitations
// under the License
import { Box } from "@mui/material";

import { useEffect, useState } from "react";

import ErrorHandler from "@component/common/ErrorHandler";
import PreLoader from "@component/common/PreLoader";
import { EXPANDED_NODES_KEY } from "@config/constant";
import {
  BusinessUnit,
  Company,
  SubTeam,
  Team,
  Unit,
  useGetOrgStructureQuery,
} from "@services/organization";
import { UnitType } from "@utils/utils";

import { EditModal } from "./components/EditModal";
import OrgStructureTree from "./components/OrgStructureTree";

export default function OrgStructure() {
  const { data: orgStructure, isLoading, isError } = useGetOrgStructureQuery();
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: Company | BusinessUnit | Team | SubTeam | Unit | null;
    type: UnitType | null;
    parentNode: Company | BusinessUnit | Team | SubTeam | null;
  }>({
    open: false,
    data: null,
    type: null,
    parentNode: null,
  });

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem(EXPANDED_NODES_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    if (!orgStructure) return;

    const rootNodeKey = `${UnitType.Company}:${orgStructure.id}`;
    setExpandedNodes((previous) => {
      if (previous.has(rootNodeKey)) return previous;
      const next = new Set(previous);
      next.add(rootNodeKey);
      return next;
    });
  }, [orgStructure]);

  useEffect(() => {
    sessionStorage.setItem(EXPANDED_NODES_KEY, JSON.stringify(Array.from(expandedNodes)));
  }, [expandedNodes]);

  const findNodeById = (
    id: string,
    type: string,
  ): {
    node: Company | BusinessUnit | Team | SubTeam | Unit;
    parentNode: Company | BusinessUnit | Team | SubTeam | null;
  } | null => {
    if (!orgStructure) return null;

    if (type === "COMPANY" && orgStructure.id === id) {
      return { node: orgStructure, parentNode: null };
    }

    // Search in business units
    if (type === "BUSINESS_UNIT") {
      const bu = orgStructure.businessUnits?.find((bu) => bu.id === id);
      return bu ? { node: bu, parentNode: orgStructure } : null;
    }

    // Search in teams
    if (type === "TEAM") {
      for (const bu of orgStructure.businessUnits || []) {
        const team = bu.teams?.find((t) => t.id === id);
        if (team) return { node: team, parentNode: bu };
      }
    }

    // Search in sub teams
    if (type === "SUB_TEAM") {
      for (const bu of orgStructure.businessUnits || []) {
        for (const team of bu.teams || []) {
          const subTeam = team.subTeams?.find((st) => st.id === id);
          if (subTeam) return { node: subTeam, parentNode: team };
        }
      }
    }

    // Search in units
    if (type === "UNIT") {
      for (const bu of orgStructure.businessUnits || []) {
        for (const team of bu.teams || []) {
          for (const subTeam of team.subTeams || []) {
            const unit = subTeam.units?.find((u) => u.id === id);
            if (unit) return { node: unit, parentNode: subTeam };
          }
        }
      }
    }

    return null;
  };

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleEdit = (id: string, type: string) => {
    const result = findNodeById(id, type);
    if (result) {
      setEditModal({
        open: true,
        data: result.node,
        type: type as UnitType,
        parentNode: result.parentNode,
      });
    }
  };

  const handleClose = () => {
    setEditModal({
      open: false,
      data: null,
      type: null,
      parentNode: null,
    });
  };

  const handleAdd = (id: string, type: string) => {
    void id;
    void type;
    // Implement add functionality here
  };

  if (isLoading) {
    return <PreLoader isLoading message="Loading organization structure ..." />;
  }

  if (isError) {
    return <ErrorHandler message="Failed to load organization structure" />;
  }

  if (!orgStructure) {
    return <ErrorHandler message="No organization structure data available" />;
  }
  
  return (
    <Box
      sx={{
        p: 1,
        display: "flex",
        flexDirection: "column",
        gap: 3,
        overflowX: "auto",
        overflowY: "auto",
        height: "100%",
      }}
    >
      {/* Display organization structure as centered tree */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "64px",
          minWidth: "max-content",
        }}
      >
        <OrgStructureTree
          company={orgStructure}
          expandedNodes={expandedNodes}
          onToggle={toggleNode}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </Box>

      {editModal.open && editModal.data && editModal.type && (
        <EditModal
          open={editModal.open}
          data={editModal.data}
          type={editModal.type}
          parentNode={editModal.parentNode}
          onClose={handleClose}
        />
      )}
    </Box>
  );
}
