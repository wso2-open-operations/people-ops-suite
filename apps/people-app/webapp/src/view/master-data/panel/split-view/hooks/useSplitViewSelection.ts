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
// under the License.
import { useState } from "react";

import {
  BusinessUnitState,
  OrganizationInfo,
  SubTeamState,
  TeamState,
  UnitState,
} from "@slices/organizationSlice/organizationStructure";

type UseSplitViewSelectionProps = {
  orgItems: OrganizationInfo;
};

export function useSplitViewSelection({ orgItems }: UseSplitViewSelectionProps) {
  const [selectedBusinessUnitId, setSelectedBusinessUnitId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSubTeamId, setSelectedSubTeamId] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);

  const selectedTeams =
    orgItems.businessUnits.find((bu) => bu.id === selectedBusinessUnitId)?.teams ?? null;

  const selectedSubTeams =
    selectedTeams?.find((team) => team.id === selectedTeamId)?.subTeams ?? null;

  const selectedUnits =
    selectedSubTeams?.find((subTeam) => subTeam.id === selectedSubTeamId)?.units ?? null;

  const selectedBusinessUnit =
    orgItems.businessUnits.find((bu) => bu.id === selectedBusinessUnitId) ?? null;

  const selectedTeam = selectedTeams?.find((team) => team.id === selectedTeamId) ?? null;

  const selectedSubTeam =
    selectedSubTeams?.find((subTeam) => subTeam.id === selectedSubTeamId) ?? null;

  // Click handlers
  const handleBusinessUnitClick = (bu: BusinessUnitState) => {
    if (selectedBusinessUnitId === bu.id) {
      setSelectedBusinessUnitId(null);
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
      setSelectedUnitId(null);
    } else {
      setSelectedBusinessUnitId(bu.id);
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
      setSelectedUnitId(null);
    }
  };

  const handleTeamClick = (team: TeamState) => {
    if (selectedTeamId === team.id) {
      setSelectedTeamId(null);
      setSelectedSubTeamId(null);
      setSelectedUnitId(null);
    } else {
      setSelectedTeamId(team.id);
      setSelectedSubTeamId(null);
      setSelectedUnitId(null);
    }
  };

  const handleSubTeamClick = (subTeam: SubTeamState) => {
    if (selectedSubTeamId === subTeam.id) {
      setSelectedSubTeamId(null);
      setSelectedUnitId(null);
    } else {
      setSelectedSubTeamId(subTeam.id);
      setSelectedUnitId(null);
    }
  };

  const handleUnitClick = (unit: UnitState) => {
    if (selectedUnitId === unit.id) {
      setSelectedUnitId(null);
    } else {
      setSelectedUnitId(unit.id);
    }
  };

  return {
    selectedBusinessUnitId,
    setSelectedBusinessUnitId,
    selectedTeamId,
    setSelectedTeamId,
    selectedSubTeamId,
    setSelectedSubTeamId,
    selectedUnitId,
    setSelectedUnitId,
    selectedTeams,
    selectedSubTeams,
    selectedUnits,
    selectedBusinessUnit,
    selectedTeam,
    selectedSubTeam,
    handleBusinessUnitClick,
    handleTeamClick,
    handleSubTeamClick,
    handleUnitClick,
  };
}
