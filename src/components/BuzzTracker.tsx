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
  const isHot = score > 80;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Gradient track */}
      <span 
        className="relative w-[80px] h-[3px] rounded-full"
        style={{ 
          background: 'linear-gradient(to right, #3b82f6, #eab308, #ef4444)' 
        }}
      >
        {/* White ring indicator */}
        <span
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white bg-transparent shadow-sm transition-all duration-300"
          style={{ 
            left: `calc(${Math.min(100, Math.max(0, score))}% - 5px)`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}
        />
      </span>
      {/* Buzz score text */}
      <span className="text-[10px] text-gray-500">
        Buzz {Math.round(score)}
      </span>
      {/* Fire emoji only for hot events */}
      {isHot && <span className="text-xs">🔥</span>}
    </span>
  );
};

export default BuzzTracker;
