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

import { useCallback, useMemo, useState } from "react";

import { OrgSearchNode, runGlobalOrgSearch } from "../utils/globalOrgSearch";

export const useGlobalOrgSearch = (index: OrgSearchNode[]) => {
  const [inputValue, setInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  const results = useMemo(() => runGlobalOrgSearch(index, activeQuery), [index, activeQuery]);
  const hasResults = results.length > 0;
  const currentMatch = hasResults ? results[currentIndex] : null;

  const executeSearch = useCallback(() => {
    const nextQuery = inputValue.trim();
    setActiveQuery(nextQuery);
    setCurrentIndex(0);
  }, [inputValue]);

  const goToNext = useCallback(() => {
    if (!hasResults) return;
    setCurrentIndex((prev) => (prev + 1) % results.length);
  }, [hasResults, results.length]);

  const goToPrevious = useCallback(() => {
    if (!hasResults) return;
    setCurrentIndex((prev) => (prev - 1 + results.length) % results.length);
  }, [hasResults, results.length]);

  const clearSearch = useCallback(() => {
    setInputValue("");
    setActiveQuery("");
    setCurrentIndex(0);
  }, []);

  return {
    inputValue,
    setInputValue,
    activeQuery,
    results,
    hasResults,
    currentIndex: hasResults ? currentIndex + 1 : 0,
    totalResults: results.length,
    currentMatch,
    executeSearch,
    goToNext,
    goToPrevious,
    clearSearch,
  };
};

