import { useState, useEffect } from "react";
import { externalSupabase } from "@/integrations/supabase/externalClient";

// Typen definieren
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
  const [markedForDeletion, setMarkedForDeletion] = useState(false);

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
      setMarkedForDeletion(false);
    }
  }, [currentEvent]);

  async function loadData() {
    setLoading(true);

    try {
      // ------------------------------------------------------------------
      // FAIL-SAFE STRATEGIE:
      // 1. Wir nutzen (supabase as any) um TypeScript zu beruhigen
      // 2. Wir laden ALLES (ohne .eq Filter) und sortieren 'admin_verified' aufsteigend
      // ------------------------------------------------------------------
      const [eventsRes, taxonomyRes, tagsRes] = await Promise.all([
        (externalSupabase as any)
          .from("events")
          .select("*")
          .order("admin_verified", { ascending: true }) // Unbearbeitete (null/false) zuerst
          .limit(50),
        (externalSupabase as any).from("taxonomy").select("*"),
        (externalSupabase as any).from("tags").select("name, icon").order("name"),
      ]);

      if (eventsRes.data) {
        // FILTER IM BROWSER (Sicherste Methode)
        // Zeige alles an, was NICHT true ist (also false oder null)
        const openEvents = eventsRes.data.filter((e: any) => e.admin_verified !== true);

        if (openEvents.length > 0) {
          setEvents(openEvents);
        } else {
          // Fallback: Wenn wirklich alles erledigt ist, zeig trotzdem was an (zum Testen)
          console.log("Keine offenen Events gefunden. Zeige alle geladenen als Fallback.");
          if (eventsRes.data.length > 0) setEvents(eventsRes.data);
        }
      }

      if (taxonomyRes.data) setTaxonomy(taxonomyRes.data);
      if (tagsRes.data) {
        setAvailableTags(
          tagsRes.data.map((t: any) => ({
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

    const { error } = await (externalSupabase as any)
      .from("events")
      .update({
        category_main_id: selectedMainCat,
        category_sub_id: selectedSubCat,
        tags: Array.from(selectedTags),
        admin_verified: true,
        marked_for_deletion: markedForDeletion,
      })
      .eq("id", currentEvent.id);

    if (error) {
      alert("Fehler beim Speichern: " + error.message);
      return;
    }

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
      <div className="p-10 text-center bg-white rounded-xl shadow-lg m-10">
        <h2 className="text-2xl font-bold mb-2">Keine Events gefunden?</h2>
        <p className="text-slate-500 mb-6">
          Das liegt wahrscheinlich daran, dass Lovable auf die falsche Datenbank schaut.
        </p>
        <div className="bg-blue-50 p-4 rounded text-blue-800 text-sm font-mono">
          Tipp: Sag Lovable im Chat:
          <br />
          "Verbinde diesen Code bitte wieder mit meiner externen Supabase Datenbank."
        </div>
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

            {/* Zum Löschen markieren */}
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markedForDeletion}
                  onChange={(e) => setMarkedForDeletion(e.target.checked)}
                  className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-red-700 font-medium">🗑️ Zum Löschen markieren</span>
              </label>
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
                className={`px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl flex-[2] ${
                  markedForDeletion 
                    ? "bg-gradient-to-r from-red-600 to-red-700 text-white" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                }`}
              >
                {markedForDeletion ? "Markieren & Weiter (→)" : "Speichern & Weiter (→)"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
