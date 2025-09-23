import { cn } from "@root/src/utils/utils";
import { VariantProps, cva } from "class-variance-authority";

const textVariants = cva("", {
  variants: {
    variant: {
      regularPrimary: "p-r text-st-primary-200",
      mediumPrimary: "p-m text-st-primary-200",
      largePrimary: "p-l text-st-primary-200",
      smallPrimary: "p-s text-st-primary-200",
      xsmallPrimary: "p-xs text-st-primary-200",
      regularOne: "p-r text-st-100",
      mediumOne: "p-m text-st-100",
      largeOne: "p-l text-st-100",
      smallOne: "p-s text-st-100",
      xsmallOne: "p-xs text-st-100",
      regularTwo: "p-r text-st-200",
      mediumTwo: "p-m text-st-200",
      largeTwo: "p-l text-st-200",
      smallTwo: "p-s text-st-200",
      xsmallTwo: "p-xs text-st-200",
      regularThree: "p-r text-st-300",
      mediumThree: "p-m text-st-300",
      largeThree: "p-l text-st-300",
      smallThree: "p-s text-st-300",
      xsmallThree: "p-xs text-st-300",
    },
  },
  defaultVariants: {
    variant: "regularTwo",
  },
});

// Props type
export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

// Component
export function P({ className, variant, ...props }: TextProps) {
  return <p className={cn(textVariants({ variant }), className)} {...props} />;
}
