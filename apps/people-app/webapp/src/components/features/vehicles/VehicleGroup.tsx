// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
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

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  type ReactElement,
} from "react";
import type { VehicleRowProps } from "@/components/features/vehicles";
import { AnimatePresence, motion } from "motion/react";

export interface VehicleGroupProps
  extends Omit<React.HTMLProps<HTMLDivElement>, "onChange" | "selected"> {
  children?: ReactElement<VehicleRowProps> | ReactElement<VehicleRowProps>[];
  selected: number | undefined;
  onChange?: (index: number | undefined) => void;
}

export default function VehicleGroup({
  children,
  selected,
  onChange,
  ...props
}: VehicleGroupProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onChange?.(undefined);
      }
    };

    document.addEventListener("click", handleClickOutside);
  }, [selected]);

  const handleSelect = (e: number | undefined) => {
    onChange?.(e);
  };

  const animation = {
    default: {
      initial: { height: 0, opacity: 0 },
      animate: { height: "auto", opacity: 1 },
      exit: { height: 0, opacity: 0 },
      transition: { duration: 0.6 },
    },
    last: {
      container: {
        initial: { height: 0, opacity: 0 },
        animate: { height: "auto", opacity: 1 },
        exit: { height: 0, opacity: 0 },
        transition: { duration: 0.6 },
      },
      content: {
        initial: { y: "-100%", opacity: 0 },
        animate: { y: 0, opacity: 1 },
        exit: { y: "-100%", opacity: 0 },
        transition: {
          y: { duration: 0.6 },
          opacity: { duration: 0.6 },
        },
      },
    },
  };

  return (
    <div {...props} ref={ref}>
      <AnimatePresence initial={false}>
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          return (
            <motion.div
              className="relative overflow-hidden"
              {...(child.props.index === Children.toArray(children).length
                ? animation.last.container
                : {})}
            >
              <motion.div
                {...(child.props.index === Children.toArray(children).length
                  ? animation.last.content
                  : animation.default)}
                className="overflow-hidden bg-white"
                key={child.props.id}
              >
                {cloneElement(child, {
                  active: selected !== undefined,
                  selected: child.props.index === selected,
                  onSelect: handleSelect,
                })}
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
