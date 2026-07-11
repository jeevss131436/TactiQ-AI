import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  className?: string;
  align?: "left" | "right" | "center";
}

export function Stat({ label, value, className, align = "left" }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        align === "right" && "items-end text-right",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <span className="font-mono text-2xl font-semibold text-white tabular-nums">
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-slate-400">{label}</span>
    </div>
  );
}
