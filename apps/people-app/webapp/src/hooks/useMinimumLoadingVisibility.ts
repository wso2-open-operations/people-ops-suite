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
import { useEffect, useRef, useState } from "react";

/**
 * Keeps a loading UI visible for at least `minVisibleMs` after `isLoading` becomes true.
 * If loading lasts longer, visibility follows `isLoading` until it turns false, then
 * any remaining minimum time is applied before hiding.
 */
export function useMinimumLoadingVisibility(
  isLoading: boolean,
  minVisibleMs: number,
): boolean {
  const [visible, setVisible] = useState(false);
  const becameTrueAtRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      becameTrueAtRef.current = Date.now();
      setVisible(true);
      return;
    }

    const started = becameTrueAtRef.current;
    if (started == null) {
      setVisible(false);
      return;
    }

    const elapsed = Date.now() - started;
    const remaining = Math.max(0, minVisibleMs - elapsed);

    hideTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      becameTrueAtRef.current = null;
      hideTimeoutRef.current = null;
    }, remaining);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [isLoading, minVisibleMs]);

  return visible;
}
