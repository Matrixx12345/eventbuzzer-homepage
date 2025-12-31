import { cn } from "@/lib/utils";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
}

/**
 * Premium Buzz Barometer - Luxury Gauge Design
 * Monochrome base with color accent only for high buzz (>85)
 */
export const BuzzTracker = ({ buzzScore, className }: BuzzTrackerProps) => {
  // Default to 20 if no score (seed buzz)
  const score = buzzScore ?? 20;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const isHot = score > 85;

  // Active bar color: anthracite by default, electric blue/gold when hot
  const activeColor = isHot ? '#2563eb' : '#404040';

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* Barometer container */}
      <span className="relative w-[100px] h-1 bg-neutral-200 rounded-full overflow-hidden">
        {/* Filled portion - clean end, no indicator dot */}
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
          style={{ 
            width: `${normalizedScore}%`,
            backgroundColor: activeColor
          }}
        />
      </span>
      {/* Buzz score text - premium typography */}
      <span className="text-[10px] font-medium text-neutral-600 tracking-tight uppercase">
        BUZZ {Math.round(score)}
      </span>
    </span>
  );
};

export default BuzzTracker;
