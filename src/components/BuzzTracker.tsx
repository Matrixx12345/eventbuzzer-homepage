import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Minimalist horizontal buzz barometer
 * Shows a thin line (80px) with a positioned indicator dot
 * Gold + 🔥 when buzz >= 80
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  // Default to 20 if no score (seed buzz)
  const score = buzzScore ?? 20;
  const isHot = score >= 80;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {/* Track container */}
      <span className="relative w-[80px] h-[2px] bg-gray-200 rounded-full">
        {/* Indicator dot */}
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full transition-all duration-300",
            isHot 
              ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" 
              : "bg-gray-400"
          )}
          style={{ left: `calc(${Math.min(100, Math.max(0, score))}% - 4px)` }}
        />
      </span>
      {/* Fire emoji for hot events */}
      {isHot && <span className="text-xs">🔥</span>}
    </span>
  );
};

export default BuzzTracker;
