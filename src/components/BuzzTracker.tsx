import { cn } from "@/lib/utils";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuzzTrackerProps {
  buzzScore?: number | null;
  className?: string;
  editable?: boolean;
  eventId?: string;
  externalId?: string;
  onBuzzChange?: (newScore: number) => void;
}

/**
 * Premium Buzz Thermometer - Gray to Red gradient with position indicator
 * When editable=true, the slider becomes interactive
 */
export const BuzzTracker = ({ 
  buzzScore, 
  className, 
  editable = false,
  eventId,
  externalId,
  onBuzzChange 
}: BuzzTrackerProps) => {
  const [localScore, setLocalScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  const score = localScore ?? buzzScore ?? 20;
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    setLocalScore(newValue);
  };

  const handleSliderRelease = async () => {
    if (localScore === null || !editable) return;
    
    const extId = externalId || eventId;
    if (!extId) return;

    setSaving(true);
    try {
      // Speichere den absoluten Score direkt als buzz_boost (nicht als Multiplikator)
      const { error } = await supabase
        .from("event_vibe_overrides")
        .upsert(
          {
            external_id: extId,
            buzz_boost: localScore, // Direkt den Score speichern
            updated_at: new Date().toISOString(),
          },
          { onConflict: "external_id" }
        );

      if (error) throw error;
      
      toast.success(`Buzz auf ${localScore} gesetzt`);
      onBuzzChange?.(localScore);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error("Fehler beim Speichern");
      setLocalScore(null); // Reset on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {/* Thermometer capsule container - extended width with visible background */}
      <span className="relative w-[140px] h-1.5 bg-stone-300/60 rounded-full overflow-visible">
        {editable ? (
          <>
            {/* Active bar background */}
            <span
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-100 ease-out pointer-events-none"
              style={{ 
                width: `${normalizedScore}%`,
                backgroundColor: getBarColor()
              }}
            />
            {/* Interactive range input - extended hit area, wider than container to catch edge clicks */}
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(score)}
              onChange={handleSliderChange}
              onMouseUp={handleSliderRelease}
              onTouchEnd={handleSliderRelease}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute opacity-0 cursor-pointer z-30"
              style={{ 
                margin: 0, 
                top: '-14px', 
                left: '-10px',
                width: 'calc(100% + 20px)',
                height: '34px',
                touchAction: 'none'
              }}
            />
            {/* Visual indicator dot */}
            <span
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 shadow-sm transition-all duration-100 ease-out pointer-events-none",
                saving ? "animate-pulse" : "",
                isHot ? "border-red-500" : "border-neutral-400"
              )}
              style={{ 
                left: `calc(${normalizedScore}% - 5px)`,
                borderColor: getBarColor()
              }}
            />
          </>
        ) : (
          <>
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
          </>
        )}
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
