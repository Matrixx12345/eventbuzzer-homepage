import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Premium Buzz Thermometer - Capsule Design with Gradient
 * Blue to Orange to Red gradient, pulse effect when hot (>=80)
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  const score = buzzScore ?? 20;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const isHot = score >= 80;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Thermometer capsule container */}
      <span className="relative w-[100px] h-1.5 bg-neutral-200/50 rounded-full overflow-hidden">
        {/* Active gradient bar */}
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
            "bg-gradient-to-r from-blue-500 via-orange-500 to-red-500"
          )}
          style={{ width: `${normalizedScore}%` }}
        />
        {/* Pulse dot at the end when hot */}
        {isHot && (
          <span
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_2px_rgba(239,68,68,0.5)]"
            style={{ left: `calc(${normalizedScore}% - 4px)` }}
          />
        )}
      </span>
      {/* Buzz score text + flame for hot */}
      <span className="text-[10px] font-medium text-neutral-600 tracking-tight uppercase">
        BUZZ {Math.round(score)}{isHot && ' 🔥'}
      </span>
    </span>
  );
};

export default BuzzTracker;
