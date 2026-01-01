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

  // Smooth interpolation from gray → yellow → orange → red
  const getBarColor = () => {
    if (score <= 20) return '#d4d4d4'; // neutral-300 (light gray)
    if (score <= 35) return '#e5e5e5'; // neutral-200 (lighter gray transitioning)
    if (score <= 45) return '#fde68a'; // amber-200 (pale yellow)
    if (score <= 55) return '#fcd34d'; // amber-300 (yellow)
    if (score <= 65) return '#fbbf24'; // amber-400 (warm yellow)
    if (score <= 75) return '#f59e0b'; // amber-500 (orange-yellow)
    if (score <= 85) return '#f97316'; // orange-500
    if (score <= 92) return '#ea580c'; // orange-600
    return '#ef4444'; // red-500
  };

  // Text color matches the bar color for cohesion
  const getTextColor = () => {
    if (score <= 35) return '#737373'; // neutral-500 for low scores
    if (score <= 55) return '#d97706'; // amber-600
    if (score <= 75) return '#ea580c'; // orange-600
    return '#dc2626'; // red-600
  };

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Thermometer capsule container - extended width */}
      <span className="relative w-[140px] h-1.5 bg-neutral-200/50 rounded-full overflow-hidden">
        {/* Active bar */}
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${normalizedScore}%`,
            backgroundColor: getBarColor()
          }}
        />
        {/* Position indicator dot */}
        <span
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-sm transition-all duration-500 ease-out",
            isHot ? "border-red-500 animate-pulse" : "border-neutral-400"
          )}
          style={{ 
            left: `calc(${normalizedScore}% - 5px)`,
            borderColor: getBarColor()
          }}
        />
      </span>
      {/* Buzz score text - color matches bar */}
      <span 
        className="text-[10px] font-semibold tracking-tight uppercase transition-colors duration-300"
        style={{ color: getTextColor() }}
      >
        BUZZ {Math.round(score)}{isHot && ' 🔥'}
      </span>
    </span>
  );
};

export default BuzzTracker;
