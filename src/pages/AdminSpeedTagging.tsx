import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// Direkter Client für dein externes Supabase (nicht Lovable Cloud!)
const EXTERNAL_SUPABASE_URL = "https://tfkiyvhfhvkejpljsnrk.supabase.co";
const EXTERNAL_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs";

const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

// Typen
interface Event {
  id: number;
  title: string;
  description: string;
  image_url: string;
  category_main_id: number | null;
  category_sub_id: number | null;
  tags: string[];
  admin_verified: boolean;
}

interface TaxonomyItem {
  id: number;
  name: string;
  slug: string;
  icon: string;
  type: "main" | "sub";
  parent_id: number | null;
}

interface TagItem {
  name: string;
  icon: string | null;
}

export default function SpeedTagging() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Auswahl-States
  const [selectedMainCat, setSelectedMainCat] = useState<number | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const currentEvent = events[currentIndex];

  useEffect(() => {
    loadData();
  }, []);

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        saveAndNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skipEvent();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentEvent, selectedMainCat, selectedSubCat, selectedTags]);

  // Reset Selection bei neuem Event
  useEffect(() => {
    if (currentEvent) {
      setSelectedMainCat(currentEvent.category_main_id);
      setSelectedSubCat(currentEvent.category_sub_id);
      setSelectedTags(new Set(currentEvent.tags || []));
    }
  }, [currentEvent]);

  async function loadData() {
    setLoading(true);
    try {
      console.log("Starte Daten-Ladeprozess...");

      const [eventsRes, taxonomyRes, tagsRes] = await Promise.all([
        externalSupabase.from("events").select("*").order("created_at", { ascending: false }).limit(50),
        externalSupabase.from("taxonomy").select("*"),
        externalSupabase.from("tags").select("name, icon").order("name"),
      ]);

      console.log("Events geladen:", eventsRes.data?.length);
      console.log("Tags geladen:", tagsRes.data?.length);

      if (eventsRes.data) setEvents(eventsRes.data);
      if (taxonomyRes.data) setTaxonomy(taxonomyRes.data);
      if (tagsRes.data) {
        setAvailableTags(tagsRes.data.map((t: any) => ({ name: t.name, icon: t.icon })));
      }
    } catch (error) {
      console.error("CRITICAL ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveAndNext() {
    if (!currentEvent) return;

    // Wir speichern trotzdem, dass es verifiziert wurde
    const { error } = await externalSupabase
      .from("events")
      .update({
        category_main_id: selectedMainCat,
        category_sub_id: selectedSubCat,
        tags: Array.from(selectedTags),
        admin_verified: true,
      })
      .eq("id", currentEvent.id);

    if (error) {
      alert("Fehler: " + error.message);
      return;
    }

    const newEvents = events.filter((e) => e.id !== currentEvent.id);
    setEvents(newEvents);
    if (newEvents.length > 0) setCurrentIndex(Math.min(currentIndex, newEvents.length - 1));
  }

  function skipEvent() {
    if (currentIndex < events.length - 1) setCurrentIndex(currentIndex + 1);
  }

  function toggleTag(tagName: string) {
    const newTags = new Set(selectedTags);
    if (newTags.has(tagName)) newTags.delete(tagName);
    else newTags.add(tagName);
    setSelectedTags(newTags);
  }

  const mainCategories = taxonomy.filter((t) => t.type === "main");
  const subCategories = taxonomy.filter((t) => t.type === "sub" && t.parent_id === selectedMainCat);

  if (loading) return <div className="p-10 text-center">Lade Daten... (Check Console)</div>;

  if (events.length === 0) {
    return (
      <div className="p-10 text-center bg-red-50">
        <h2 className="text-xl font-bold text-red-600">Immer noch keine Events?</h2>
        <p>Dann ist die Verbindung zur DB blockiert (Row Level Security).</p>
        <button onClick={() => window.location.reload()} className="mt-4 p-2 bg-red-200 rounded">
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Header */}
        <div className="lg:col-span-12 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between">
          <h1 className="font-bold">⚡ Speed Tagging (Debug Mode)</h1>
          <span className="text-slate-500">{events.length} Events geladen</span>
        </div>

        {/* Links: Event */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200">
            <div className="h-64 bg-slate-200 relative">
              {currentEvent.image_url && <img src={currentEvent.image_url} className="w-full h-full object-cover" />}
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 rounded">ID: {currentEvent.id}</div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{currentEvent.title}</h2>
              {/* Hier ist deine gewünschte Scrollbox für viel Text */}
              <div className="prose prose-sm text-slate-600 max-h-64 overflow-y-auto pr-2 bg-slate-50 p-2 rounded">
                <p>{currentEvent.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rechts: Tags */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Hauptkategorie</h3>
              <div className="flex flex-wrap gap-2">
                {mainCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedMainCat(cat.id);
                      setSelectedSubCat(null);
                    }}
                    className={`px-4 py-2 rounded-lg border ${selectedMainCat === cat.id ? "bg-blue-600 text-white" : "bg-white"}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">Unterkategorie</h3>
              {selectedMainCat ? (
                <div className="flex flex-wrap gap-2">
                  {subCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedSubCat(cat.id)}
                      className={`px-3 py-1 rounded border text-sm ${selectedSubCat === cat.id ? "bg-indigo-600 text-white" : "bg-white"}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 italic text-sm">Bitte Hauptkategorie wählen</div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-xs uppercase text-slate-400 mb-2 flex justify-between">
                <span>Tags</span> <span className="text-blue-600">{selectedTags.size}</span>
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    className={`px-3 py-1 rounded-full border text-sm flex gap-1 ${selectedTags.has(tag.name) ? "bg-emerald-100 border-emerald-400 text-emerald-800" : "bg-white"}`}
                  >
                    {tag.icon} {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 border-t pt-4">
              <button
                onClick={skipEvent}
                className="flex-1 py-3 border rounded-xl font-bold text-slate-600 hover:bg-slate-50"
              >
                Überspringen
              </button>
              <button
                onClick={saveAndNext}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg"
              >
                Speichern & Weiter
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
