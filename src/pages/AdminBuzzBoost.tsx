import { useState, useEffect, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Search, Loader2, Flame, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import { BuzzTracker } from "@/components/BuzzTracker";

interface EventWithBoost {
  id: string;
  external_id: string;
  title: string;
  image_url?: string;
  buzz_score?: number | null;
  source?: string;
  currentBoost?: number;
}

// Admin emails allowed to access admin pages
const ADMIN_EMAILS = ["eventbuzzer1@gmail.com", "j.straton111@gmail.com"];

export default function AdminBuzzBoost() {
  const { user } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  const [events, setEvents] = useState<EventWithBoost[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithBoost[]>([]);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }
  const [saving, setSaving] = useState<string | null>(null);

  // Lade Events und bestehende Overrides
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Lade Events von externer DB
        const { data: eventsData, error: eventsError } = await (externalSupabase as any)
          .from("events")
          .select("id, external_id, title, image_url, buzz_score, source")
          .order("buzz_score", { ascending: false, nullsFirst: false })
          .limit(200);

        if (eventsError) throw eventsError;

        // Lade bestehende Overrides von Cloud DB
        const { data: overridesData, error: overridesError } = await supabase
          .from("event_vibe_overrides")
          .select("external_id, buzz_boost");

        if (overridesError) throw overridesError;

        // Map overrides by external_id
        const overrideMap: Record<string, number> = {};
        overridesData?.forEach((o: any) => {
          if (o.buzz_boost && o.buzz_boost !== 1) {
            overrideMap[o.external_id] = o.buzz_boost;
          }
        });

        const eventsWithBoost = (eventsData || []).map((e: any) => ({
          ...e,
          id: String(e.id),
          external_id: e.external_id || String(e.id),
          currentBoost: overrideMap[e.external_id || String(e.id)] || 1,
        }));

        setEvents(eventsWithBoost);
        setFilteredEvents(eventsWithBoost);
        setOverrides(overrideMap);
      } catch (error) {
        console.error("Fehler beim Laden:", error);
        toast.error("Fehler beim Laden der Events");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter Events bei Suche
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEvents(events);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredEvents(
        events.filter(
          (e) =>
            e.title.toLowerCase().includes(term) ||
            e.external_id.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, events]);

  const handleBoostChange = useCallback((externalId: string, value: number) => {
    setOverrides((prev) => ({ ...prev, [externalId]: value }));
    setEvents((prev) =>
      prev.map((e) =>
        e.external_id === externalId ? { ...e, currentBoost: value } : e
      )
    );
  }, []);

  const saveBoost = async (event: EventWithBoost) => {
    const boostValue = overrides[event.external_id] ?? event.currentBoost ?? 1;
    setSaving(event.external_id);

    try {
      // Upsert in Cloud DB
      const { error } = await supabase
        .from("event_vibe_overrides")
        .upsert(
          {
            external_id: event.external_id,
            buzz_boost: boostValue,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "external_id" }
        );

      if (error) throw error;
      toast.success(`Buzz-Boost für "${event.title}" gespeichert`);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error("Fehler beim Speichern");
    } finally {
      setSaving(null);
    }
  };

  const resetBoost = async (event: EventWithBoost) => {
    setSaving(event.external_id);

    try {
      // Setze auf 1.0 zurück
      const { error } = await supabase
        .from("event_vibe_overrides")
        .upsert(
          {
            external_id: event.external_id,
            buzz_boost: 1.0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "external_id" }
        );

      if (error) throw error;

      setOverrides((prev) => {
        const updated = { ...prev };
        delete updated[event.external_id];
        return updated;
      });
      setEvents((prev) =>
        prev.map((e) =>
          e.external_id === event.external_id ? { ...e, currentBoost: 1 } : e
        )
      );
      toast.success("Boost zurückgesetzt");
    } catch (error) {
      console.error("Fehler beim Zurücksetzen:", error);
      toast.error("Fehler beim Zurücksetzen");
    } finally {
      setSaving(null);
    }
  };

  const calculateBoostedScore = (baseScore: number | null | undefined, boost: number) => {
    const base = baseScore ?? 20;
    return Math.min(100, Math.round(base * boost));
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/admin-upload"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              Buzz-Boost Admin
            </h1>
            <p className="text-muted-foreground text-sm">
              Multipliziere den Buzz-Score von Events manuell (1.0 = keine Änderung, 1.5 = +50%, 2.0 = verdoppelt)
            </p>
          </div>
        </div>

        {/* Suche */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Event suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Events Liste */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Keine Events gefunden
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const currentBoost = overrides[event.external_id] ?? event.currentBoost ?? 1;
              const boostedScore = calculateBoostedScore(event.buzz_score, currentBoost);
              const hasBoost = currentBoost !== 1;

              return (
                <div
                  key={event.external_id}
                  className={`flex items-center gap-4 p-4 bg-card border rounded-xl transition-colors ${
                    hasBoost ? "border-orange-300 bg-orange-50/50" : "border-border"
                  }`}
                >
                  {/* Bild */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {event.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        Kein Bild
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Original: {event.buzz_score ?? 20}
                      </span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <BuzzTracker buzzScore={boostedScore} />
                    </div>
                  </div>

                  {/* Boost Slider */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">Boost</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0.5"
                          max="3"
                          step="0.1"
                          value={currentBoost}
                          onChange={(e) =>
                            handleBoostChange(event.external_id, parseFloat(e.target.value))
                          }
                          className="w-24 h-2 accent-orange-500"
                        />
                        <span
                          className={`text-sm font-mono w-10 text-center ${
                            hasBoost ? "text-orange-600 font-bold" : "text-muted-foreground"
                          }`}
                        >
                          {currentBoost.toFixed(1)}x
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant={hasBoost ? "default" : "outline"}
                        onClick={() => saveBoost(event)}
                        disabled={saving === event.external_id}
                        className={hasBoost ? "bg-orange-500 hover:bg-orange-600" : ""}
                      >
                        {saving === event.external_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                      </Button>
                      {hasBoost && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resetBoost(event)}
                          disabled={saving === event.external_id}
                          className="text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats */}
        {!loading && (
          <div className="mt-6 text-sm text-muted-foreground text-center">
            {filteredEvents.length} Events ·{" "}
            {Object.keys(overrides).filter((k) => overrides[k] !== 1).length} mit Boost
          </div>
        )}
      </main>
    </div>
  );
}
