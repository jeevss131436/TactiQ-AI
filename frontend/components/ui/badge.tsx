import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
        outline: "border-navy-700 text-slate-400",
        up: "border-signal-up/30 bg-signal-up/10 text-signal-up",
        down: "border-signal-down/30 bg-signal-down/10 text-signal-down",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
