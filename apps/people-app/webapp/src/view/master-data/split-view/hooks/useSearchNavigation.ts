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

import { GlobalSearchResult } from "../utils/searchUtils";

export const useSearchNavigation = (searchResults: GlobalSearchResult[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalResults = useMemo(() => searchResults.length, [searchResults]);

  const currentResult = useMemo(() => {
    if (searchResults.length === 0) return null;
    return searchResults[currentIndex] || null;
  }, [searchResults, currentIndex]);

  const goToNext = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % searchResults.length);
  }, [searchResults.length]);

  const goToPrevious = useCallback(() => {
    if (searchResults.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
  }, [searchResults.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  return {
    currentIndex: totalResults > 0 ? currentIndex + 1 : 0,
    totalResults,
    currentResult,
    goToNext,
    goToPrevious,
    reset,
    hasResults: totalResults > 0,
  };
};
