import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

// External Supabase client for user's database
const EXTERNAL_SUPABASE_URL = 'https://tfkiyvhfhvkejpljsnrk.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma2l5dmhmaHZrZWpwbGpzbnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDA4MDQsImV4cCI6MjA4MDY3NjgwNH0.bth3dTvG3fXSu4qILB514x1TRy0scRLo_KM9lDMMKDs';

const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY);

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
  type: 'main' | 'sub';
  parent_id: number | null;
}

export default function AdminSpeedTagging() {
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
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        saveAndNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipEvent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      externalSupabase
        .from('events')
        .select('*')
        .eq('admin_verified', false)
        .order('created_at', { ascending: false })
        .limit(100),
      externalSupabase.from('taxonomy').select('*'),
      externalSupabase.from('tags').select('name'),
    ]);

    if (eventsRes.data) setEvents(eventsRes.data as Event[]);
    if (taxonomyRes.data) setTaxonomy(taxonomyRes.data as TaxonomyItem[]);
    if (tagsRes.data) setAvailableTags(tagsRes.data.map((t: { name: string }) => t.name));

    setLoading(false);
  }

  async function saveAndNext() {
    if (!currentEvent) return;

    const { error } = await externalSupabase
      .from('events')
      .update({
        category_main_id: selectedMainCat,
        category_sub_id: selectedSubCat,
        tags: Array.from(selectedTags),
        admin_verified: true,
      })
      .eq('id', currentEvent.id);

    if (error) {
      alert('Fehler beim Speichern: ' + error.message);
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

  const mainCategories = taxonomy.filter((t) => t.type === 'main');
  const subCategories = taxonomy.filter(
    (t) => t.type === 'sub' && t.parent_id === selectedMainCat
  );

  const progress = events.length > 0 ? (currentIndex / events.length) * 100 : 0;
  const remaining = events.length - currentIndex;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-xl">Lade Events...</p>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🎉</p>
          <h1 className="text-3xl font-bold text-white mb-2">Alles erledigt!</h1>
          <p className="text-gray-300">Alle Events wurden überprüft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            🚀 Admin Speed-Tagging Cockpit
          </h1>

          {/* Progress Bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-3 bg-slate-700" />
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full">
              {remaining} Events offen
            </span>
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full">
              {currentIndex} verarbeitet
            </span>
            <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
              {Math.round(progress)}% fertig
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Event Image */}
          <img
            src={currentEvent.image_url || '/placeholder.svg'}
            alt={currentEvent.title}
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />

          {/* Event Title & Description */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentEvent.title}
          </h2>

          <p className="text-gray-300 mb-6 line-clamp-3">
            {currentEvent.description || 'Keine Beschreibung'}
          </p>

          {/* Main Category */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Hauptkategorie
            </h3>
            <div className="flex flex-wrap gap-3">
              {mainCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedMainCat(cat.id);
                    setSelectedSubCat(null);
                  }}
                  className={`px-6 py-3 rounded-full border-2 font-medium transition-all ${
                    selectedMainCat === cat.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-lg'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:-translate-y-0.5'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Category */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Unterkategorie
            </h3>
            {subCategories.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {subCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedSubCat(cat.id)}
                    className={`px-6 py-3 rounded-full border-2 font-medium transition-all ${
                      selectedSubCat === cat.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-lg'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:-translate-y-0.5'
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
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">
              Tags (Multi-Select)
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-5 py-2.5 rounded-full border-2 font-medium text-sm transition-all ${
                    selectedTags.has(tag)
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-lg'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-purple-500 hover:-translate-y-0.5'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={skipEvent}
              className="flex-1 py-4 rounded-xl bg-gray-600 hover:bg-gray-500 text-white font-semibold transition-all"
            >
              ⏭️ Überspringen
            </button>
            <button
              onClick={saveAndNext}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold transition-all shadow-lg"
            >
              💾 Speichern & Weiter →
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="text-center text-gray-400 mt-6 text-sm">
        Tastatur: → Weiter | ← Zurück | Enter Speichern
      </div>
    </div>
  );
}
