import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Premium Buzz Thermometer - Gray to Red gradient with position indicator
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  const score = buzzScore ?? 20;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const isHot = score >= 80;

  // Muted, sophisticated color palette - gray to warm terracotta
  const getBarColor = () => {
    if (score < 40) return '#d1d5db'; // gray-300 (soft gray)
    if (score < 60) return '#d4a574'; // muted tan/caramel
    if (score < 80) return '#c2703e'; // muted terracotta
    return '#b45454'; // muted sophisticated red
  };

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Thermometer capsule container */}
      <span className="relative w-[100px] h-1.5 bg-neutral-200/50 rounded-full overflow-hidden">
        {/* Active bar */}
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ 
            width: `${normalizedScore}%`,
            backgroundColor: getBarColor()
          }}
        />
        {/* Position indicator dot */}
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-sm transition-all duration-300",
            isHot ? "border-red-500 animate-pulse" : "border-neutral-500"
          )}
          style={{ left: `calc(${normalizedScore}% - 5px)` }}
        />
      </span>
      {/* Buzz score text + flame for hot */}
      <span className="text-[10px] font-medium text-neutral-600 tracking-tight uppercase">
        BUZZ {Math.round(score)}{isHot && ' 🔥'}
      </span>
    </span>
  );
};

export default BuzzTracker;
