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

import { MatchSearch } from "../utils/globalSearch";
  
export function useSplitViewSearch() {
  const [searchMatches, setSearchMatches] = useState<MatchSearch[]>([]);
  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(-1);

  const [searchTerm, setSearchTerm] = useState<string | null>();
  const [teamSearchTerm, setTeamSearchTerm] = useState<string | null>();
  const [subTeamSearchTerm, setSubTeamSearchTerm] = useState<string | null>();
  const [unitSearchTerm, setUnitSearchTerm] = useState<string | null>();

  const currentMatch = activeMatchIndex >= 0 ? searchMatches[activeMatchIndex] : null;

  const clearGlobalSearchState = () => {
    setSearchMatches([]);
    setActiveMatchIndex(-1);
  };

  const handleBusinessUnitSearchChange = (value: string) => {
    setSearchTerm(value);
    clearGlobalSearchState();
  };

  const handleTeamSearchChange = (value: string) => {
    setTeamSearchTerm(value);
    clearGlobalSearchState();
  };

  const handleSubTeamSearchChange = (value: string) => {
    setSubTeamSearchTerm(value);
    clearGlobalSearchState();
  };

  const handleUnitSearchChange = (value: string) => {
    setUnitSearchTerm(value);
    clearGlobalSearchState();
  };

  const isGlobalSearchDisabled =
    Boolean(searchTerm?.trim()) ||
    Boolean(teamSearchTerm?.trim()) ||
    Boolean(subTeamSearchTerm?.trim()) ||
    Boolean(unitSearchTerm?.trim());

  return {
    searchMatches,
    setSearchMatches,
    activeMatchIndex,
    setActiveMatchIndex,
    searchTerm,
    setSearchTerm,
    teamSearchTerm,
    setTeamSearchTerm,
    subTeamSearchTerm,
    setSubTeamSearchTerm,
    unitSearchTerm,
    setUnitSearchTerm,
    currentMatch,
    handleBusinessUnitSearchChange,
    handleTeamSearchChange,
    handleSubTeamSearchChange,
    handleUnitSearchChange,
    clearGlobalSearchState,
    isGlobalSearchDisabled,
  };
}
