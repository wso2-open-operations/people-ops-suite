import { cn } from "@root/src/utils/utils";
import { type VariantProps, cva } from "class-variance-authority";

import * as React from "react";

type HeadingVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type HeadingElementTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const headingVariants = cva("", {
  variants: {
    variant: {
      h1: "h1 text-st-100",
      h2: "h2 text-st-100",
      h3: "h3 text-st-200",
      h4: "h4 text-st-200",
      h5: "h5 text-st-200",
      h6: "h6 text-st-200",
    },
  },
  defaultVariants: { variant: "h6" },
});

const variantToTag: Record<HeadingVariant, HeadingElementTag> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "color">,
    // Strip out cva's possibly-null/undefined variant and re-add our own union
    Omit<VariantProps<typeof headingVariants>, "variant"> {
  variant?: HeadingVariant;
}

export function H({ variant = "h3", className, ...props }: HeadingProps) {
  // Non-nullable fallback + **narrowed tag type**
  const Tag: HeadingElementTag = variantToTag[variant ?? "h3"];

  return React.createElement(Tag, {
    className: cn(headingVariants({ variant }), className),
    ...props,
  });
}
