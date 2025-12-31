import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Temperature-style buzz barometer with gradient
 * Blue -> Yellow -> Red gradient with floating white ring indicator
 * Shows 🔥 only when buzz > 80
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  // Default to 20 if no score (seed buzz)
  const score = buzzScore ?? 20;
  const isHot = score >= 80;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Gradient track - Blue -> Yellow -> Red */}
      <span 
        className="relative w-20 h-[3px] rounded-full"
        style={{ 
          background: 'linear-gradient(to right, #3b82f6, #facc15, #ef4444)' 
        }}
      >
        {/* White circle indicator with dark border */}
        <span
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-neutral-400 shadow-sm transition-all duration-300"
          style={{ 
            left: `calc(${Math.min(100, Math.max(0, score))}% - 5px)`
          }}
        />
      </span>
      {/* Buzz score text - uppercase, bold */}
      <span className="text-[10px] font-bold text-neutral-500 tracking-wide">
        BUZZ {Math.round(score)}
      </span>
      {/* Fire emoji only for hot events (>=80) */}
      {isHot && <span className="text-xs">🔥</span>}
    </span>
  );
};

export default BuzzTracker;
