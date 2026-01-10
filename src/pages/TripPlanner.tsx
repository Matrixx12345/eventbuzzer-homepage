import { useState, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import { Button } from "@/components/ui/button";
import { MapEvent } from "@/types/map";
import { 
  Home, Car, Train, Footprints, Sparkles, Mountain, Building2, 
  Heart, UtensilsCrossed, TreePine, Loader2, ChevronRight, ChevronLeft,
  GripVertical, Trash2, Map as MapIcon, List
} from "lucide-react";
import { cn } from "@/lib/utils";

// Lazy load map component
const EventsMap = lazy(() => import("@/components/EventsMap"));

// Types
interface TripSetup {
  type: "homebase" | "roadtrip" | null;
  duration: string | null;
  mobility: "public" | "car" | "walk" | null;
  vibes: string[];
  startLocation: string | null;
}

interface TripStop {
  id: string;
  eventId: string;
  title: string;
  image: string;
  duration: number; // hours
  travelTime: number; // minutes to next
  reason: string;
}

type WizardStep = 1 | 2 | 3 | 4;
type BuilderMode = "explore" | "plan";

// Wizard Options
const TRIP_TYPES = [
  { id: "homebase", label: "Homebase", icon: Home, description: "Tagesausflüge von einem festen Ort" },
  { id: "roadtrip", label: "Roadtrip", icon: Car, description: "Von Ort zu Ort weiterziehen" },
];

const DURATION_OPTIONS = [
  { id: "1", label: "1 Tag" },
  { id: "2-3", label: "2-3 Tage" },
  { id: "4-7", label: "4-7 Tage" },
  { id: "7-14", label: "1-2 Wochen" },
];

const MOBILITY_OPTIONS = [
  { id: "public", label: "Öffentliche Verkehrsmittel", icon: Train },
  { id: "car", label: "Auto", icon: Car },
  { id: "walk", label: "Zu Fuß / City", icon: Footprints },
];

const VIBE_OPTIONS = [
  { id: "nature", label: "Natur", icon: TreePine },
  { id: "mountains", label: "Berge & Aussicht", icon: Mountain },
  { id: "culture", label: "Kultur & Städte", icon: Building2 },
  { id: "wellness", label: "Wellness & Erholung", icon: Heart },
  { id: "food", label: "Food & Kulinarik", icon: UtensilsCrossed },
  { id: "hidden", label: "Hidden Gems", icon: Sparkles },
];

// Mock proposals for demo
const MOCK_PROPOSALS = [
  {
    id: "1",
    eventId: "123",
    title: "Rheinfall bei Schaffhausen",
    image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400",
    duration: 2,
    travelTime: 45,
    reason: "⭐ Must-see Naturwunder, nur 45 Min. von Zürich",
    elite: true,
  },
  {
    id: "2",
    eventId: "124",
    title: "Technorama Winterthur",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400",
    duration: 3,
    travelTime: 30,
    reason: "Perfekt für Familien, interaktives Science-Museum",
    elite: false,
  },
  {
    id: "3",
    eventId: "125",
    title: "Lindt Home of Chocolate",
    image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400",
    duration: 2,
    travelTime: 20,
    reason: "Schokoladen-Erlebnis mit Verkostung",
    elite: true,
  },
  {
    id: "4",
    eventId: "126",
    title: "Altstadt Zürich",
    image: "https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=400",
    duration: 3,
    travelTime: 15,
    reason: "✨ Hidden Gem: Verwinkelte Gassen und Cafés",
    elite: false,
  },
  {
    id: "5",
    eventId: "127",
    title: "Uetliberg Aussichtspunkt",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400",
    duration: 2,
    travelTime: 25,
    reason: "🏔️ Top-Aussicht über Zürich und die Alpen",
    elite: true,
  },
];

const TripPlanner = () => {
  const navigate = useNavigate();
  
  // Wizard State
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [tripSetup, setTripSetup] = useState<TripSetup>({
    type: null,
    duration: null,
    mobility: null,
    vibes: [],
    startLocation: null,
  });
  const [wizardComplete, setWizardComplete] = useState(false);
  
  // Builder State
  const [builderMode, setBuilderMode] = useState<BuilderMode>("explore");
  const [currentDay, setCurrentDay] = useState(1);
  const [proposals, setProposals] = useState(MOCK_PROPOSALS);
  const [tripStops, setTripStops] = useState<Record<number, TripStop[]>>({ 1: [] });
  const [mapEvents, setMapEvents] = useState<MapEvent[]>([]);
  
  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);

  // Wizard Handlers
  const handleTypeSelect = (type: "homebase" | "roadtrip") => {
    setTripSetup(prev => ({ ...prev, type }));
    setWizardStep(2);
  };

  const handleDurationSelect = (duration: string) => {
    setTripSetup(prev => ({ ...prev, duration }));
    setWizardStep(3);
  };

  const handleMobilitySelect = (mobility: "public" | "car" | "walk") => {
    setTripSetup(prev => ({ ...prev, mobility }));
    setWizardStep(4);
  };

  const handleVibeToggle = (vibe: string) => {
    setTripSetup(prev => ({
      ...prev,
      vibes: prev.vibes.includes(vibe)
        ? prev.vibes.filter(v => v !== vibe)
        : [...prev.vibes, vibe]
    }));
  };

  const handleCreatePlan = () => {
    setWizardComplete(true);
  };

  // Builder Handlers
  const handleAcceptProposal = (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    const newStop: TripStop = {
      id: proposal.id,
      eventId: proposal.eventId,
      title: proposal.title,
      image: proposal.image,
      duration: proposal.duration,
      travelTime: proposal.travelTime,
      reason: proposal.reason,
    };

    setTripStops(prev => ({
      ...prev,
      [currentDay]: [...(prev[currentDay] || []), newStop]
    }));
    setProposals(prev => prev.filter(p => p.id !== proposalId));
  };

  const handleRejectProposal = (proposalId: string) => {
    setProposals(prev => prev.filter(p => p.id !== proposalId));
  };

  const handleRemoveStop = (stopId: string) => {
    setTripStops(prev => ({
      ...prev,
      [currentDay]: prev[currentDay].filter(s => s.id !== stopId)
    }));
  };

  const handleEventsChange = useCallback((events: MapEvent[]) => {
    setMapEvents(events);
  }, []);

  const handleEventClick = useCallback((eventId: string) => {
    console.log("Event clicked:", eventId);
  }, []);

  const selectedCount = tripStops[currentDay]?.length || 0;

  // Render Wizard
  if (!wizardComplete) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <Navbar />
        
        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Schritt {wizardStep}/4</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gray-900 transition-all duration-300"
                style={{ width: `${(wizardStep / 4) * 100}%` }}
              />
            </div>
          </div>

          {/* Step 1: Trip Type */}
          {wizardStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
                  🗺️ Plane deine perfekte Schweiz-Tour
                </h1>
                <p className="text-gray-600">Wie möchtest du reisen?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {TRIP_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id as "homebase" | "roadtrip")}
                    className={cn(
                      "p-6 rounded-2xl border-2 text-left transition-all hover:shadow-lg hover:-translate-y-1",
                      tripSetup.type === type.id
                        ? "border-gray-900 bg-white shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <type.icon className="w-8 h-8 mb-3 text-gray-700" />
                    <h3 className="font-semibold text-lg text-gray-900">{type.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Duration */}
          {wizardStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  Wie lange soll dein Trip dauern?
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleDurationSelect(option.id)}
                    className={cn(
                      "py-4 px-6 rounded-xl border-2 font-medium transition-all",
                      tripSetup.duration === option.id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setWizardStep(1)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            </div>
          )}

          {/* Step 3: Mobility */}
          {wizardStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  Wie bist du unterwegs?
                </h2>
              </div>

              <div className="space-y-3">
                {MOBILITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleMobilitySelect(option.id as "public" | "car" | "walk")}
                    className={cn(
                      "w-full py-4 px-6 rounded-xl border-2 font-medium transition-all flex items-center gap-4",
                      tripSetup.mobility === option.id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-300"
                    )}
                  >
                    <option.icon className="w-5 h-5" />
                    {option.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setWizardStep(2)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mt-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Zurück
              </button>
            </div>
          )}

          {/* Step 4: Vibes */}
          {wizardStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
                  Worauf hast du Lust?
                </h2>
                <p className="text-gray-500 text-sm">Mehrfachauswahl möglich</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VIBE_OPTIONS.map((vibe) => (
                  <button
                    key={vibe.id}
                    onClick={() => handleVibeToggle(vibe.id)}
                    className={cn(
                      "py-4 px-4 rounded-xl border-2 font-medium transition-all flex flex-col items-center gap-2 text-center",
                      tripSetup.vibes.includes(vibe.id)
                        ? "border-gray-900 bg-[#FDFBF7] text-gray-900 shadow-sm"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    )}
                  >
                    <vibe.icon className="w-6 h-6" />
                    <span className="text-sm">{vibe.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setWizardStep(3)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Zurück
                </button>

                <Button
                  onClick={handleCreatePlan}
                  disabled={tripSetup.vibes.length === 0}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-semibold"
                >
                  ✨ Plan erstellen
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Builder
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <Navbar />
      
      {/* Trip Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-serif font-bold text-gray-900">
                🗺️ Mein Trip: "Schweiz Weekend"
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {tripSetup.type === "homebase" ? "🏠 Homebase" : "🚗 Roadtrip"} · 
                {tripSetup.duration} Tage · 
                {tripSetup.mobility === "car" ? "🚗 Auto" : tripSetup.mobility === "public" ? "🚆 ÖV" : "🚶 Zu Fuß"} · 
                {tripSetup.vibes.map(v => VIBE_OPTIONS.find(o => o.id === v)?.label).join(" + ")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setWizardComplete(false)}>
              Bearbeiten
            </Button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-0 border-2 border-gray-300 rounded-lg overflow-hidden mt-4 w-fit">
            <button
              onClick={() => setBuilderMode("explore")}
              className={cn(
                "px-6 py-2.5 font-medium text-sm transition-all flex items-center gap-2",
                builderMode === "explore"
                  ? "bg-[#FDFBF7] text-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Explore
            </button>
            <button
              onClick={() => setBuilderMode("plan")}
              className={cn(
                "px-6 py-2.5 font-medium text-sm transition-all flex items-center gap-2",
                builderMode === "plan"
                  ? "bg-[#FDFBF7] text-gray-900"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              <List className="w-4 h-4" />
              Plan
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6">
          
          {/* Left: Map */}
          <div className="relative">
            <Suspense fallback={
              <div className="w-full h-[600px] rounded-xl bg-gray-100 flex flex-col items-center justify-center border border-gray-200">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Karte wird geladen...</p>
              </div>
            }>
              <EventsMap 
                onEventsChange={handleEventsChange}
                onEventClick={handleEventClick}
                isVisible={true}
              />
            </Suspense>
            
            {/* Route overlay for plan mode */}
            {builderMode === "plan" && tripStops[currentDay]?.length >= 2 && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium text-gray-700 shadow-sm">
                Route: {tripStops[currentDay].length} Stops
              </div>
            )}
          </div>

          {/* Right: Trip Drawer */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  📅 Tag {currentDay} - {builderMode === "explore" ? "Vorschläge" : "Dein Plan"}
                </h2>
                <span className="text-sm text-gray-500">
                  {selectedCount}/5 ausgewählt
                </span>
              </div>
            </div>

            <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {builderMode === "explore" ? (
                // Explore Mode: Proposals
                <>
                  {proposals.map((proposal) => (
                    <div 
                      key={proposal.id}
                      className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden"
                    >
                      <img 
                        src={proposal.image} 
                        alt={proposal.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{proposal.title}</h3>
                          {proposal.elite && (
                            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                              ⭐ Must-see
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">
                          <strong>Warum:</strong> {proposal.reason}
                        </p>
                        
                        <div className="flex gap-2 text-sm text-gray-500 mb-4">
                          <span>🕐 {proposal.duration}h</span>
                          <span>🚗 {proposal.travelTime} Min. Fahrt</span>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptProposal(proposal.id)}
                            className="flex-1 py-2.5 bg-[#FDFBF7] hover:bg-[#F5F0E8] border-2 border-gray-900 font-semibold rounded-lg transition-all text-sm"
                          >
                            ✅ In Tag {currentDay} aufnehmen
                          </button>
                          <button
                            onClick={() => handleRejectProposal(proposal.id)}
                            className="px-4 py-2.5 border-2 border-gray-300 hover:bg-gray-50 rounded-lg transition-all"
                          >
                            ❌
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {proposals.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>Keine weiteren Vorschläge</p>
                      <Button
                        onClick={() => setBuilderMode("plan")}
                        className="mt-4"
                      >
                        Zum Plan wechseln
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                // Plan Mode: Itinerary
                <>
                  {tripStops[currentDay]?.length > 0 ? (
                    <div className="space-y-3">
                      {tripStops[currentDay].map((stop, index) => (
                        <div
                          key={stop.id}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow flex items-center gap-3"
                        >
                          <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                          <span className="w-8 h-8 rounded-full bg-[#FDFBF7] border-2 border-gray-900 flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <img 
                            src={stop.image} 
                            alt={stop.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{stop.title}</h4>
                            <p className="text-xs text-gray-500">
                              🕐 {stop.duration}h · 🚗 {stop.travelTime} Min. zum nächsten
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveStop(stop.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Noch keine Stops geplant</p>
                      <Button
                        onClick={() => setBuilderMode("explore")}
                        variant="outline"
                        className="mt-4"
                      >
                        Vorschläge ansehen
                      </Button>
                    </div>
                  )}

                  {tripStops[currentDay]?.length >= 2 && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <Button className="w-full bg-gray-900 text-white">
                        ✨ Plan optimieren (mit KI)
                      </Button>
                      <Button variant="outline" className="w-full">
                        📤 Exportieren (PDF/iCal)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Day Actions */}
            {selectedCount >= 3 && builderMode === "explore" && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <Button
                  onClick={() => setBuilderMode("plan")}
                  className="w-full bg-gray-900 text-white"
                >
                  Tag {currentDay} speichern
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chatbot */}
      <Chatbot 
        context="trip-planner" 
        variant="bubble"
        isOpen={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
};

export default TripPlanner;
