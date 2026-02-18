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

function hexToLottieColor(hex: string): number[] {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255);
}

function colorsMatch(a: number[], b: number[], tolerance = 0.01): boolean {
  return (
    a.length >= 3 &&
    b.length >= 3 &&
    Math.abs(a[0] - b[0]) < tolerance &&
    Math.abs(a[1] - b[1]) < tolerance &&
    Math.abs(a[2] - b[2]) < tolerance
  );
}

/**
 * Deep-clones a Lottie animation JSON and replaces only the fill/stroke
 * colors that match the given target hex color with the replacement hex color.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recolorLottieSelective(anim: any, targetHex: string, replacementHex: string): any {
  const target = hexToLottieColor(targetHex);
  const replacement = hexToLottieColor(replacementHex);
  const data = JSON.parse(JSON.stringify(anim));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (items: any[]) => {
    items.forEach((it) => {
      if ((it.ty === "fl" || it.ty === "st") && Array.isArray(it.c?.k)) {
        if (colorsMatch(it.c.k, target)) {
          it.c.k = [...replacement, 1];
        }
      }
      if (it.it) walk(it.it);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (data.layers || []).forEach((layer: any) => layer.shapes && walk(layer.shapes));
  return data;
}

/**
 * Returns a memoized, recolored copy of the Lottie animation JSON,
 * replacing only the specified target color with the replacement color.
 * Re-computes only when the animation data or either hex color changes.
 *
 * @param anim           - The original Lottie animation JSON object
 * @param targetHex      - The color to replace (e.g. "#020F30" for navy blue)
 * @param replacementHex - The new color to use (e.g. "#4A0080")
 * @returns Recolored Lottie animation JSON
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRecolorLottieSelective(
  anim: any,
  targetHex: string,
  replacementHex: string,
): any {
  return useMemo(
    () => recolorLottieSelective(anim, targetHex, replacementHex),
    [anim, targetHex, replacementHex],
  );
}
