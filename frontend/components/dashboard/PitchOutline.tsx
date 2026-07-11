import { cn } from "@/lib/utils";

// A minimal event-data pitch, drawn to scale (120x80), used as the
// backdrop for heatmaps, passing networks, and the 3D scene placeholder.
export function PitchOutline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="118" height="78" rx="1" fill="none" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
      <line x1="60" y1="1" x2="60" y2="79" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
      <circle cx="60" cy="40" r="9" fill="none" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
      <circle cx="60" cy="40" r="0.6" fill="rgba(78,168,222,0.35)" />
      <rect x="1" y="20" width="16" height="40" fill="none" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
      <rect x="1" y="30" width="6" height="20" fill="none" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
      <rect x="103" y="20" width="16" height="40" fill="none" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
      <rect x="113" y="30" width="6" height="20" fill="none" stroke="rgba(78,168,222,0.35)" strokeWidth="0.5" />
    </svg>
  );
}
