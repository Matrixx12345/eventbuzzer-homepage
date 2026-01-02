import { useState } from "react";
import { Flame, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BuzzSliderProps {
  eventId: string;
  externalId?: string;
  title: string;
  initialBuzzScore?: number | null;
  onBuzzUpdated?: (newScore: number) => void;
}

export function BuzzSlider({ 
  eventId, 
  externalId, 
  title, 
  initialBuzzScore,
  onBuzzUpdated 
}: BuzzSliderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [boost, setBoost] = useState(1.0);
  const [saving, setSaving] = useState(false);
  
  const baseScore = initialBuzzScore ?? 20;
  const boostedScore = Math.min(100, Math.round(baseScore * boost));
  const hasChange = boost !== 1.0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const extId = externalId || eventId;
      
      const { error } = await supabase
        .from("event_vibe_overrides")
        .upsert(
          {
            external_id: extId,
            buzz_boost: boost,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "external_id" }
        );

      if (error) throw error;
      
      toast.success(`Buzz auf ${boostedScore} gesetzt`);
      onBuzzUpdated?.(boostedScore);
      setIsOpen(false);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="p-1.5 rounded-full bg-orange-500/20 hover:bg-orange-500/40 transition-colors"
        title="Buzz anpassen"
      >
        <Flame size={12} className="text-orange-500" />
      </button>
    );
  }

  return (
    <div 
      className="absolute inset-0 bg-black/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 rounded-xl"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <p className="text-white text-sm font-medium mb-1 text-center line-clamp-1">{title}</p>
      <p className="text-white/60 text-xs mb-4">
        Buzz: {baseScore} → <span className="text-orange-400 font-bold">{boostedScore}</span>
      </p>
      
      <div className="flex items-center gap-3 w-full max-w-xs">
        <span className="text-white/50 text-xs">0.5x</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={boost}
          onChange={(e) => setBoost(parseFloat(e.target.value))}
          className="flex-1 h-2 accent-orange-500 cursor-pointer"
        />
        <span className="text-white/50 text-xs">3x</span>
      </div>
      
      <p className="text-orange-400 font-mono text-lg mt-2">{boost.toFixed(1)}x</p>
      
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setIsOpen(false)}
          className="px-3 py-1.5 text-xs text-white/70 hover:text-white transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-4 py-1.5 text-xs rounded-lg flex items-center gap-1.5 transition-colors ${
            hasChange 
              ? "bg-orange-500 text-white hover:bg-orange-600" 
              : "bg-white/20 text-white/50"
          }`}
        >
          {saving ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Save size={12} />
          )}
          Speichern
        </button>
      </div>
    </div>
  );
}
