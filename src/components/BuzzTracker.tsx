import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Elegant Buzz Thermometer - Clean minimal design
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  const score = buzzScore ?? 20;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const isHot = score >= 80;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Thermometer track */}
      <span className="relative w-24 h-1 bg-neutral-200 rounded-full">
        {/* Active bar with gradient */}
        <span
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-300",
            isHot 
              ? "bg-gradient-to-r from-neutral-400 via-rose-400 to-rose-500" 
              : "bg-gradient-to-r from-neutral-300 to-neutral-500"
          )}
          style={{ width: `${normalizedScore}%` }}
        />
        {/* Indicator dot */}
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border shadow-sm transition-all duration-300",
            isHot ? "border-rose-400" : "border-neutral-400"
          )}
          style={{ left: `calc(${normalizedScore}% - 4px)` }}
        />
      </span>
      {/* Score label */}
      <span className={cn(
        "text-[10px] font-medium tracking-wide uppercase",
        isHot ? "text-rose-500" : "text-neutral-500"
      )}>
        {Math.round(score)}{isHot && ' 🔥'}
      </span>
    </span>
  );
};

export default BuzzTracker;
