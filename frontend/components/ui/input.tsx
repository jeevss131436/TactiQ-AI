import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md border border-navy-700 bg-navy-900/60 px-4 py-2 text-sm text-white",
          "placeholder:text-slate-500 transition-colors",
          "focus-visible:outline-none focus-visible:border-cyan-400/60 focus-visible:ring-2 focus-visible:ring-cyan-400/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
