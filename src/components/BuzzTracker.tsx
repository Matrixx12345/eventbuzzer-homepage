import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Premium Buzz Barometer - Luxury Gauge Design
 * Anthracite base, red-orange when hot (>=80), flame emoji for hot events
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  const score = buzzScore ?? 20;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const isHot = score >= 80;

  // Active bar color: anthracite by default, red-orange when hot
  const activeColor = isHot ? '#ef4444' : '#404040';

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Barometer container */}
      <span className="relative w-[100px] h-1 bg-neutral-200 rounded-full overflow-hidden">
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ 
            width: `${normalizedScore}%`,
            backgroundColor: activeColor
          }}
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
