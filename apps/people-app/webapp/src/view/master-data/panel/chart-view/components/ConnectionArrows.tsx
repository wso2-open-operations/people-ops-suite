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
import { memo, useMemo } from "react";

import { calculateArrowPath } from "../utils/svgPathCalculator";

export interface Connection {
  parentId: string;
  childId: string;
}

interface ConnectionArrowsProps {
  connections: Connection[];
  cardRefs: Map<string, HTMLDivElement>;
  containerRef: HTMLDivElement | null;
}

const ARROW_STYLES = {
  STROKE_COLOR: "#FF6B2C",
  STROKE_WIDTH: "2",
  MARKER_ID: "arrowhead",
  MARKER_WIDTH: "10",
  MARKER_HEIGHT: "10",
  MARKER_REF_X: "9",
  MARKER_REF_Y: "3",
} as const;

/**
 * Component for rendering SVG connection arrows between organizational nodes
 * Uses memoization to optimize path calculations
 */
const ConnectionArrows = memo<ConnectionArrowsProps>(({ connections, cardRefs, containerRef }) => {
  // Calculate all paths with memoization
  const paths = useMemo(() => {
    if (!containerRef) return [];

    return connections
      .map(({ parentId, childId }) => {
        const parentEl = cardRefs.get(parentId);
        const childEl = cardRefs.get(childId);
        const path = calculateArrowPath(parentEl, childEl, containerRef);

        if (!path) return null;

        return {
          key: `${parentId}-${childId}`,
          path,
        };
      })
      .filter((item): item is { key: string; path: string } => item !== null);
  }, [connections, cardRefs, containerRef]);

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        overflow: "visible",
      }}
    >
      {/* Render connection paths */}
      {paths.map(({ key, path }) => (
        <path
          key={key}
          d={path}
          stroke={ARROW_STYLES.STROKE_COLOR}
          strokeWidth={ARROW_STYLES.STROKE_WIDTH}
          fill="none"
          markerEnd={`url(#${ARROW_STYLES.MARKER_ID})`}
        />
      ))}
    </svg>
  );
});

ConnectionArrows.displayName = "ConnectionArrows";

export default ConnectionArrows;
