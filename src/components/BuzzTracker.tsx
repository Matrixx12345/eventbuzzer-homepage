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

  // Smooth interpolation from gray → yellow → orange → red (darker grays for visibility)
  const getBarColor = () => {
    if (score <= 20) return '#9ca3af'; // gray-400 (visible gray)
    if (score <= 35) return '#a8a29e'; // stone-400 (warm gray)
    if (score <= 45) return '#facc15'; // yellow-400 (vibrant)
    if (score <= 55) return '#fbbf24'; // amber-400
    if (score <= 65) return '#f59e0b'; // amber-500
    if (score <= 75) return '#f97316'; // orange-500
    if (score <= 85) return '#ea580c'; // orange-600
    if (score <= 92) return '#dc2626'; // red-600
    return '#ef4444'; // red-500
  };

  // Text color matches the bar color exactly
  const getTextColor = () => getBarColor();

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Thermometer capsule container - extended width with visible background */}
      <span className="relative w-[140px] h-1.5 bg-stone-300/60 rounded-full overflow-hidden">
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
