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
import { useMemo } from "react";

/**
 * Deep-clones a Lottie animation JSON and replaces all fill/stroke colors
 * with the given hex color, enabling theme-aware coloring.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recolorLottie(anim: any, hex: string): any {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const n = parseInt(full, 16);
  const color = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);

  const data = JSON.parse(JSON.stringify(anim));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (items: any[]) => {
    items.forEach((it) => {
      if ((it.ty === "fl" || it.ty === "st") && it.c?.k) {
        it.c.k = [...color, 1];
      }
      if (it.it) walk(it.it);
    });
  };

  (data.layers || []).forEach((layer: any) => layer.shapes && walk(layer.shapes));
  return data;
}

/**
 * Returns a memoized, recolored copy of the given Lottie animation JSON,
 * with all fill and stroke colors replaced by the provided hex color.
 * Re-computes only when the animation data or hex color changes.
 *
 * @param anim - The original Lottie animation JSON object
 * @param hex  - Target hex color string (e.g. "#1a2b3c")
 * @returns Recolored Lottie animation JSON
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRecolorLottie(anim: any, hex: string): any {
  return useMemo(() => recolorLottie(anim, hex), [anim, hex]);
}
