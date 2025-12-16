import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export default function SpeedTagging() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMainCat, setSelectedMainCat] = useState<number | null>(null);
  const [selectedSubCat, setSelectedSubCat] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const currentEvent = events[currentIndex];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Load selections when event changes
  useEffect(() => {
    if (currentEvent) {
      setSelectedMainCat(currentEvent.category_main_id);
      setSelectedSubCat(currentEvent.category_sub_id);
      setSelectedTags(new Set(currentEvent.tags || []));
    }
  }, [currentEvent]);

  async function loadData() {
    setLoading(true);

    const [eventsRes, taxonomyRes, tagsRes] = await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("admin_verified", false)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("taxonomy").select("*"),
      supabase.from("tags").select("name"),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data);
    if (taxonomyRes.data) setTaxonomy(taxonomyRes.data);

    // Enhanced tag loading with debugging
    if (tagsRes.data && tagsRes.data.length > 0) {
      const tagNames = tagsRes.data.map((t: any) => t.name).filter(Boolean);
      console.log("✅ Loaded tags from DB:", tagNames);
      setAvailableTags(tagNames);
    } else {
      console.warn("⚠️ No tags found in database, using fallback tags");
      // Fallback: Use common tags if DB is empty
      setAvailableTags([
        "mistwetter",
        "natur",
        "romantik",
        "nightlife",
        "wellness",
        "foto-spots",
        "geburtstag",
        "kind-klein",
        "kind-schulkind",
        "kind-teen",
      ]);
    }

    setLoading(false);
  }

  async function saveAndNext() {
    if (!currentEvent) return;

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

    // Remove from list
    const newEvents = events.filter((e) => e.id !== currentEvent.id);
    setEvents(newEvents);

    // Move to next (or stay at same index if it's the last one)
    if (newEvents.length > 0) {
      setCurrentIndex(Math.min(currentIndex, newEvents.length - 1));
    }
  }

  function skipEvent() {
    if (currentIndex < events.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function toggleTag(tag: string) {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  }

  const mainCategories = taxonomy.filter((t) => t.type === "main");
  const subCategories = taxonomy.filter((t) => t.type === "sub" && t.parent_id === selectedMainCat);

  const progress = events.length > 0 ? (currentIndex / events.length) * 100 : 0;
  const remaining = events.length - currentIndex;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700">
        <div className="bg-white rounded-2xl p-12 text-center max-w-md shadow-2xl">
          <h2 className="text-3xl font-bold mb-3">🎉 Alles erledigt!</h2>
          <p className="text-gray-600">Alle Events wurden überprüft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-3">🚀 Admin Speed-Tagging Cockpit</h1>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-700 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm text-gray-600">
            <span>
              <strong className="text-gray-900">{remaining}</strong> Events offen
            </span>
            <span>
              <strong className="text-gray-900">{currentIndex}</strong> verarbeitet
            </span>
            <span>
              <strong className="text-gray-900">{Math.round(progress)}%</strong> fertig
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl p-10 shadow-2xl">
          {/* Event Image */}
          <img
            src={currentEvent.image_url || "https://via.placeholder.com/1200x400"}
            alt={currentEvent.title}
            className="w-full h-80 object-cover rounded-xl mb-8"
          />

          {/* Event Title & Description */}
          <h2 className="text-4xl font-bold mb-4 text-gray-900">{currentEvent.title}</h2>
          {/* ✅ FIX: Mehr Platz für Description (max-h-48 statt max-h-24) */}
          <p className="text-gray-600 mb-8 leading-relaxed max-h-48 overflow-y-auto">
            {currentEvent.description || "Keine Beschreibung"}
          </p>

          {/* Main Category */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Hauptkategorie</h3>
            <div className="flex flex-wrap gap-3">
              {mainCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedMainCat(cat.id);
                    setSelectedSubCat(null); // Reset subcategory
                  }}
                  className={`px-6 py-3 rounded-full border-2 font-medium transition-all ${
                    selectedMainCat === cat.id
                      ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-lg"
                      : "bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:-translate-y-0.5"
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Category */}
          <div className="mb-8">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">Unterkategorie</h3>
            {subCategories.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {subCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSubCat(cat.id)}
                    className={`px-6 py-3 rounded-full border-2 font-medium transition-all ${
                      selectedSubCat === cat.id
                        ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-lg"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:-translate-y-0.5"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">Wähle zuerst eine Hauptkategorie</p>
            )}
          </div>

          {/* Tags */}
          <div className="mb-10">
            <h3 className="text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
              Tags (Multi-Select) - {availableTags.length} verfügbar
            </h3>
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-5 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                      selectedTags.has(tag)
                        ? "bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-lg"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:-translate-y-0.5"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-red-500">⚠️ Keine Tags gefunden - bitte Tags-Tabelle befüllen</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={skipEvent}
              className="flex-1 px-8 py-4 rounded-xl border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 font-semibold text-gray-700 transition-all"
            >
              ⏭️ Überspringen
            </button>
            <button
              onClick={saveAndNext}
              className="flex-1 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:shadow-2xl hover:-translate-y-1 text-white font-semibold transition-all"
            >
              💾 Speichern & Weiter →
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="fixed bottom-6 right-6 bg-black bg-opacity-80 backdrop-blur-sm text-white px-5 py-3 rounded-lg text-sm">
        Tastatur: → Weiter | ← Zurück | Enter Speichern
      </div>
    </div>
  );
}
