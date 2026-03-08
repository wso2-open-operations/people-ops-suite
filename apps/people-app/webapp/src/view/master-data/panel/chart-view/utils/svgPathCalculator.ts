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

/**
 * Calculate SVG path for connecting two elements with an arrow
 * Creates a path with right angles: down from parent -> right -> to child
 *
 * @param parentEl - The parent HTML element
 * @param childEl - The child HTML element
 * @param container - The container HTML element for relative positioning
 * @returns SVG path string or null if elements are not found
 */
export const calculateArrowPath = (
  parentEl: HTMLElement | null | undefined,
  childEl: HTMLElement | null | undefined,
  container: HTMLElement | null | undefined,
): string | null => {
  if (!parentEl || !childEl || !container) return null;

  const containerRect = container.getBoundingClientRect();
  const parentRect = parentEl.getBoundingClientRect();
  const childRect = childEl.getBoundingClientRect();

  // Calculate positions relative to container
  // Start from the center-bottom of the parent element
  const x1 = parentRect.left - containerRect.left + parentRect.width / 2;
  const y1 = parentRect.bottom - containerRect.top;

  // End at the left-center of the child element
  const x2 = childRect.left - containerRect.left;
  const y2 = childRect.top - containerRect.top + childRect.height / 2;

  // Create path with straight lines and right angles
  // Format: M (move to start) -> L (line to vertical position) -> L (line to end)
  return `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2}`;
};

/**
 * Calculate multiple arrow paths for connections
 *
 * @param connections - Array of parent-child ID pairs
 * @param cardRefs - Map of element IDs to HTML elements
 * @param container - The container HTML element
 * @returns Array of path objects with keys and path strings
 */
export const calculateMultipleArrowPaths = (
  connections: Array<{ parentId: string; childId: string }>,
  cardRefs: Map<string, HTMLElement>,
  container: HTMLElement | null,
): Array<{ key: string; path: string }> => {
  if (!container) return [];

  return connections
    .map(({ parentId, childId }) => {
      const parentEl = cardRefs.get(parentId);
      const childEl = cardRefs.get(childId);
      const path = calculateArrowPath(parentEl, childEl, container);

      if (!path) return null;

      return {
        key: `${parentId}-${childId}`,
        path,
      };
    })
    .filter((item): item is { key: string; path: string } => item !== null);
};
