import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------
// DIRECT CLIENT (Damit funktioniert es garantiert)
// ---------------------------------------------------------
const SUPABASE_URL = "https://tfkiyvhfhvkejpljsnrk.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MDM0NDQsImV4cCI6MjA1MDA3OTQ0NH0.Hm2cDbIZ8SczNF1iKAy5sME0xfqVYUc79vy0AqzBmcg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
// ---------------------------------------------------------

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
      // ------------------------------------------------------------------
      // FAIL-SAFE STRATEGIE:
      // 1. Wir laden ALLES (kein .eq Filter, der scheitern könnte)
      // 2. Wir sortieren nach 'admin_verified' ASC (False/Null kommt zuerst)
      // ------------------------------------------------------------------
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("admin_verified", { ascending: true }) // Unbearbeitete zuerst!
        .limit(50);

      const { data: taxData } = await supabase.from("taxonomy").select("*");
      const { data: tagsData } = await supabase.from("tags").select("name, icon").order("name");

      if (eventsError) throw eventsError;

      if (eventsData) {
        // Client-seitiger Filter: Wir nehmen alles, was NICHT true ist
        // Das fängt NULL und FALSE sicher ab.
        const unverifiedEvents = eventsData.filter((e) => e.admin_verified !== true);

        // Falls wir gar keine offenen haben, zeigen wir zur Not auch die fertigen (zum Testen)
        // Aber normal sollte der Filter oben greifen.
        if (unverifiedEvents.length > 0) {
          setEvents(unverifiedEvents);
        } else {
          // Fallback: Wenn wirklich alles erledigt ist, zeig trotzdem was an (damit du siehst, dass es geht)
          console.log("Alles erledigt? Zeige verifizierte Events als Fallback.");
          setEvents(eventsData);
        }
      }

      if (taxData) setTaxonomy(taxData);
      if (tagsData) {
        setAvailableTags(
          tagsData.map((t: any) => ({
            name: t.name,
            icon: t.icon,
          })),
        );
      }
    } catch (error: any) {
      console.error("Fehler:", error);
      alert("Fehler: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveAndNext() {
    if (!currentEvent) return;

    // Update mit Hardcoded Client
    const { error } = await supabase
      .from("events")
      .update({
        category_main_id: selectedMainCat,
        category_sub_id: selectedSubCat,
        tags: Array.from(selectedTags),
        admin_verified: true,
      })
      .eq("id", currentEvent.id);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

    // Entferne Event aus Liste
    const newEvents = events.filter((e) => e.id !== currentEvent.id);
    setEvents(newEvents);

    if (newEvents.length > 0) {
      setCurrentIndex(Math.min(currentIndex, newEvents.length - 1));
    }
  }

  function skipEvent() {
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function toggleTag(tagName: string) {
    const newTags = new Set(selectedTags);
    if (newTags.has(tagName)) newTags.delete(tagName);
    else newTags.add(tagName);
    setSelectedTags(newTags);
  }

  const mainCategories = taxonomy.filter((t) => t.type === "main");
  const subCategories = taxonomy.filter((t) => t.type === "sub" && t.parent_id === selectedMainCat);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin text-4xl mb-4">🌀</div>
      </div>
    );

  if (events.length === 0)
    return (
      <div className="p-10 text-center text-red-600 font-bold bg-white">
        WTF? Immer noch leer? Dann ist die Datenbank wirklich leer.
        <br />
        Checke SQL Editor: SELECT COUNT(*) FROM events;
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HEADER */}
        <div className="lg:col-span-12 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-800">⚡ Speed Tagging Cockpit</h1>
            <p className="text-sm text-slate-500">
              Noch <span className="font-bold text-blue-600">{events.length}</span> Events in dieser Liste
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">→ Speichern | ← Skip</div>
        </div>

        {/* BILD & INFO */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-200 sticky top-4">
            <div className="relative h-64 w-full bg-slate-200">
              {currentEvent.image_url ? (
                <img src={currentEvent.image_url} alt={currentEvent.title} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">Kein Bild</div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                ID: {currentEvent.id}
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{currentEvent.title}</h2>
              <div className="prose prose-sm text-slate-600 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                <p>{currentEvent.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KATEGORIEN & TAGS */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-200">
            {/* Hauptkategorie */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">1. Hauptkategorie</h3>
              <div className="flex flex-wrap gap-2">
                {mainCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedMainCat(cat.id);
                      setSelectedSubCat(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${selectedMainCat === cat.id ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105" : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"}`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Unterkategorie */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">2. Unterkategorie</h3>
              {selectedMainCat ? (
                <div className="flex flex-wrap gap-2">
                  {subCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedSubCat(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 text-sm ${selectedSubCat === cat.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300"}`}
                    >
                      {cat.icon && <span>{cat.icon}</span>}
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded text-center text-sm text-slate-400">
                  Wähle zuerst eine Hauptkategorie 👆
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex justify-between">
                <span>3. Tags</span>
                <span className="text-blue-600">{selectedTags.size} gewählt</span>
              </h3>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1">
                {availableTags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => toggleTag(tag.name)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${selectedTags.has(tag.name) ? "bg-emerald-100 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-200"}`}
                  >
                    {tag.icon && <span>{tag.icon}</span>}
                    <span>{tag.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <button
                onClick={skipEvent}
                className="px-6 py-4 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 flex-1"
              >
                Überspringen (←)
              </button>
              <button
                onClick={saveAndNext}
                className="px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-lg hover:shadow-xl flex-[2]"
              >
                Speichern & Weiter (→)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
