import { useState, useCallback, lazy, Suspense, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { MapEvent } from "@/types/map";
import { 
  Home, Car, Train, Footprints, Sparkles, Mountain, Building2, 
  Heart, UtensilsCrossed, TreePine, Loader2, RefreshCw, Star, X,
  Minus, Check
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
  duration: number;
  travelTime: number;
  reason: string;
  category: string;
  price?: string;
  time?: string;
}

interface ChatMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  options?: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[];
  multiSelect?: boolean;
}

type ChatStep = "type" | "duration" | "mobility" | "vibes" | "complete";

// Options
const TRIP_TYPE_OPTIONS = [
  { id: "homebase", label: "🏠 Homebase - Tagesausflüge von einem Ort" },
  { id: "roadtrip", label: "🚗 Roadtrip - Von Ort zu Ort weiterziehen" },
];

const DURATION_OPTIONS = [
  { id: "1", label: "1 Tag" },
  { id: "2-3", label: "2-3 Tage" },
  { id: "4-7", label: "4-7 Tage" },
  { id: "7-14", label: "1-2 Wochen" },
];

const MOBILITY_OPTIONS = [
  { id: "public", label: "🚆 Öffentliche Verkehrsmittel" },
  { id: "car", label: "🚗 Auto" },
  { id: "walk", label: "🚶 Zu Fuß / City" },
];

const VIBE_OPTIONS = [
  { id: "nature", label: "🌲 Natur" },
  { id: "mountains", label: "🏔️ Berge & Aussicht" },
  { id: "culture", label: "🏛️ Kultur & Städte" },
  { id: "wellness", label: "💆 Wellness & Erholung" },
  { id: "food", label: "🍽️ Food & Kulinarik" },
  { id: "hidden", label: "✨ Hidden Gems" },
];

// Mock timeline stops
const MOCK_TIMELINE: TripStop[] = [
  {
    id: "t1",
    eventId: "123",
    title: "Frühstück",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    duration: 0.5,
    travelTime: 15,
    reason: "Gemütlich am Wasser",
    category: "Café Spitz",
    time: "09:00",
  },
  {
    id: "t2",
    eventId: "124",
    title: "Museum Tinguely",
    image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400",
    duration: 1.5,
    travelTime: 5,
    reason: "Moderne Kunst",
    category: "Kunst Museum",
    price: "€18",
    time: "10:00",
  },
  {
    id: "t3",
    eventId: "125",
    title: "Lunch Markthalle",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    duration: 1,
    travelTime: 15,
    reason: "Lokale Spezialitäten",
    category: "Restaurant",
    time: "12:30",
  },
  {
    id: "t4",
    eventId: "126",
    title: "Rheinschifffahrt",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400",
    duration: 1,
    travelTime: 15,
    reason: "Entspannte Bootsfahrt",
    category: "Aktivität",
    time: "14:00",
  },
  {
    id: "t5",
    eventId: "127",
    title: "Altstadtbummel",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    duration: 1,
    travelTime: 15,
    reason: "Historische Gassen",
    category: "Sightseeing",
    time: "16:00",
  },
  {
    id: "t6",
    eventId: "128",
    title: "Dinner Chez Donati",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
    duration: 2,
    travelTime: 0,
    reason: "Italienische Küche",
    category: "Restaurant",
    price: "€€€",
    time: "19:00",
  },
];

// Mock discoveries
const MOCK_DISCOVERIES = [
  {
    id: "d1",
    eventId: "201",
    title: "Kunstmuseum Basel",
    image: "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=400",
    category: "Kunst",
    price: "€25",
    rating: 4.8,
    isFavorite: true,
    isElite: true,
  },
  {
    id: "d2",
    eventId: "202",
    title: "Spalentor",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    category: "Wahrzeichen",
    price: "Kostenlos",
    rating: 4.5,
    isFavorite: false,
    isElite: false,
  },
  {
    id: "d3",
    eventId: "203",
    title: "Basler Münster",
    image: "https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400",
    category: "Kirche",
    price: "€5",
    rating: 4.7,
    isFavorite: false,
    isElite: false,
  },
  {
    id: "d4",
    eventId: "204",
    title: "Zoo Basel",
    image: "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=400",
    category: "Natur",
    price: "€20",
    rating: 4.6,
    isFavorite: true,
    isElite: false,
  },
  {
    id: "d5",
    eventId: "205",
    title: "Fondation Beyeler",
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400",
    category: "Kunst",
    price: "€30",
    rating: 4.9,
    isFavorite: false,
    isElite: true,
  },
  {
    id: "d6",
    eventId: "206",
    title: "Tinguely Museum",
    image: "https://images.unsplash.com/photo-1541367777708-7905fe3296c0?w=400",
    category: "Kunst",
    price: "€20",
    rating: 4.5,
    isFavorite: false,
    isElite: false,
  },
  {
    id: "d7",
    eventId: "207",
    title: "Vitra Design Museum",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    category: "Design",
    price: "€25",
    rating: 4.8,
    isFavorite: true,
    isElite: false,
  },
  {
    id: "d8",
    eventId: "208",
    title: "Roche Turm",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400",
    category: "Architektur",
    price: "Kostenlos",
    rating: 4.3,
    isFavorite: false,
    isElite: false,
  },
];

const TripPlanner = () => {
  const navigate = useNavigate();
  
  // Trip Setup State
  const [tripSetup, setTripSetup] = useState<TripSetup>({
    type: null,
    duration: null,
    mobility: null,
    vibes: [],
    startLocation: null,
  });
  const [setupComplete, setSetupComplete] = useState(false);
  
  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStep, setChatStep] = useState<ChatStep>("type");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  
  // Builder State
  const [timelineStops, setTimelineStops] = useState(MOCK_TIMELINE);
  const [discoveries, setDiscoveries] = useState(MOCK_DISCOVERIES);
  const [selectedEvent, setSelectedEvent] = useState<typeof MOCK_DISCOVERIES[0] | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapEvents, setMapEvents] = useState<MapEvent[]>([]);

  // Auto-open chatbot after 1 second
  useEffect(() => {
    if (!setupComplete) {
      const timer = setTimeout(() => {
        setChatOpen(true);
        // Add initial bot message
        setMessages([{
          id: "1",
          type: "bot",
          content: "Hey! 👋 Lass uns deinen perfekten Trip planen. Wie möchtest du reisen?",
          options: TRIP_TYPE_OPTIONS,
        }]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [setupComplete]);

  // Handle chat option selection
  const handleOptionSelect = (optionId: string, optionLabel: string) => {
    // Add user response
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: "user",
      content: optionLabel,
    }]);

    // Handle based on current step
    setTimeout(() => {
      switch (chatStep) {
        case "type":
          setTripSetup(prev => ({ ...prev, type: optionId as "homebase" | "roadtrip" }));
          setChatStep("duration");
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: "Super! Wie lange soll dein Trip dauern?",
            options: DURATION_OPTIONS,
          }]);
          break;

        case "duration":
          setTripSetup(prev => ({ ...prev, duration: optionId }));
          setChatStep("mobility");
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: "Wie bist du unterwegs?",
            options: MOBILITY_OPTIONS,
          }]);
          break;

        case "mobility":
          setTripSetup(prev => ({ ...prev, mobility: optionId as "public" | "car" | "walk" }));
          setChatStep("vibes");
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            type: "bot",
            content: "Worauf hast du Lust? Wähle alles aus, was dich interessiert:",
            options: VIBE_OPTIONS,
            multiSelect: true,
          }]);
          break;

        default:
          break;
      }
    }, 400);
  };

  // Handle vibe toggle (multi-select)
  const handleVibeToggle = (vibeId: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibeId)
        ? prev.filter(v => v !== vibeId)
        : [...prev, vibeId]
    );
  };

  // Handle vibes confirmation
  const handleVibesConfirm = () => {
    if (selectedVibes.length === 0) return;

    const vibeLabels = selectedVibes.map(id => 
      VIBE_OPTIONS.find(v => v.id === id)?.label || id
    ).join(", ");

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: "user",
      content: vibeLabels,
    }]);

    setTripSetup(prev => ({ ...prev, vibes: selectedVibes }));
    setChatStep("complete");

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: "Perfekt! 🎉 Ich habe deinen Trip basierend auf deinen Wünschen zusammengestellt. Schau dir die Vorschläge an!",
      }]);

      // Close chatbot after 2 seconds
      setTimeout(() => {
        setChatOpen(false);
        setSetupComplete(true);
      }, 2000);
    }, 400);
  };

  // Close chatbot
  const handleCloseChatbot = () => {
    setChatOpen(false);
    if (chatStep !== "complete") {
      // If closing early, mark as complete anyway
      setSetupComplete(true);
    }
  };

  // Minimize chatbot
  const handleMinimizeChatbot = () => {
    setChatOpen(false);
  };

  // Builder Handlers
  const handleEventsChange = useCallback((events: MapEvent[]) => {
    setMapEvents(events);
  }, []);

  const handleEventClick = useCallback((eventId: string) => {
    const discovery = discoveries.find(d => d.eventId === eventId);
    if (discovery) {
      setSelectedEvent(discovery);
    }
  }, [discoveries]);

  const handleToggleFavorite = (id: string) => {
    setDiscoveries(prev => prev.map(d => 
      d.id === id ? { ...d, isFavorite: !d.isFavorite } : d
    ));
  };

  const filteredDiscoveries = activeFilter === "all" 
    ? discoveries 
    : activeFilter === "elite"
      ? discoveries.filter(d => d.isElite)
      : discoveries.filter(d => d.category.toLowerCase().includes(activeFilter));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-[#F8F6F2]">
      <Helmet>
        <title>Trip Planer - Plane deine perfekte Schweiz-Reise | EventBuzzer</title>
        <meta name="description" content="Erstelle deine individuelle Reiseroute durch die Schweiz. Mit unserem intelligenten Trip Planer kombinierst du Events, Sehenswürdigkeiten und kulinarische Highlights." />
        <meta property="og:title" content="Trip Planer - Plane deine Schweiz-Reise | EventBuzzer" />
        <meta property="og:description" content="Erstelle deine individuelle Reiseroute durch die Schweiz mit Events und Sehenswürdigkeiten." />
        <meta property="og:url" content="https://eventbuzzer.ch/trip-planner" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://eventbuzzer.ch/og-image.jpg" />
        <link rel="canonical" href="https://eventbuzzer.ch/trip-planner" />
      </Helmet>
      <Navbar />
      
      {/* Chatbot Backdrop */}
      {chatOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] transition-opacity duration-300"
          onClick={handleMinimizeChatbot}
        />
      )}
      
      {/* Chatbot Window (centered at top) */}
      {chatOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[480px] max-h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col z-[10000] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 p-5 flex items-center justify-between text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="font-bold text-base">Trip Planer</h3>
                <p className="text-xs text-white/90">Lass uns planen</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleMinimizeChatbot}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={handleCloseChatbot}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto bg-gray-50 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.type === "bot" ? (
                  <div className="flex gap-3 animate-in fade-in duration-300">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-base">🤖</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-md border border-gray-100 max-w-[85%]">
                        <p className="text-sm text-gray-900 leading-relaxed">{message.content}</p>
                      </div>
                      
                      {/* Options (if any) */}
                      {message.options && !message.multiSelect && chatStep !== "complete" && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleOptionSelect(option.id, option.label)}
                              className="w-full text-left px-4 py-3 rounded-xl bg-white border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md text-sm font-medium text-gray-900"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Multi-Select Options (Vibes) */}
                      {message.multiSelect && chatStep === "vibes" && (
                        <div className="mt-3 space-y-2">
                          {message.options?.map((option) => (
                            <button
                              key={option.id}
                              onClick={() => handleVibeToggle(option.id)}
                              className={cn(
                                "w-full text-left px-4 py-3 rounded-xl border-2 transition-all shadow-sm hover:shadow-md text-sm font-medium flex items-center justify-between",
                                selectedVibes.includes(option.id)
                                  ? "border-blue-500 bg-blue-50 text-blue-900"
                                  : "bg-white border-gray-200 hover:border-blue-300 text-gray-900"
                              )}
                            >
                              <span>{option.label}</span>
                              {selectedVibes.includes(option.id) && (
                                <Check className="w-5 h-5 text-blue-600" />
                              )}
                            </button>
                          ))}
                          
                          {/* Confirm Button */}
                          <button
                            onClick={handleVibesConfirm}
                            disabled={selectedVibes.length === 0}
                            className={cn(
                              "w-full mt-3 px-5 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all duration-300",
                              selectedVibes.length > 0
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02]"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            )}
                          >
                            ✨ Los geht's! ({selectedVibes.length} ausgewählt)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end animate-in fade-in duration-300">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl rounded-tr-sm p-4 max-w-[75%] shadow-md">
                      <p className="text-sm text-white font-medium">{message.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Floating Chat Bubble (when minimized) */}
      {!chatOpen && !setupComplete && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-8 right-8 z-[10000] group"
        >
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-25" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
            <span className="text-2xl">💬</span>
          </div>
        </button>
      )}
      
      {/* Main 3-Column Layout - ALWAYS VISIBLE */}
      <div 
        className="h-[calc(100vh-64px)] p-6 gap-6"
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '25% 30% 45%'
        }}
      >
        {/* Column 1: Dein Tag (Timeline) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
              Dein Tag
            </h2>
            <p className="text-sm text-gray-500">Basel, Samstag 15. Jan</p>
          </div>
          
          {/* Timeline Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2">
            {/* Morgens Section */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold mb-5 shadow-md">
                ☀️ Morgens
              </div>
              
              {/* Timeline Items */}
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-orange-400 to-amber-300 rounded-full" />
                
                {timelineStops.slice(0, 2).map((stop, index) => (
                  <div key={stop.id} className="relative pl-14 mb-6 group">
                    {/* Icon Circle */}
                    <div className="absolute left-0 top-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-amber-400 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 z-10">
                      <span className="text-lg">
                        {index === 0 ? "☕" : "🏛️"}
                      </span>
                    </div>
                    
                    {/* Stop Card */}
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 tracking-wide">{stop.time}</span>
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          ⏱ {stop.duration * 60} min
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-base mb-3">{stop.title}</h3>
                      
                      <div className="relative overflow-hidden rounded-lg mb-3 aspect-[16/9] bg-gray-100 shadow-sm">
                        <img 
                          src={stop.image} 
                          alt={stop.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        {stop.price && (
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-md">
                              ⭐ Elite
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{stop.category}</p>
                          <p className="text-xs text-gray-500">{stop.reason}</p>
                        </div>
                        <button className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shadow-sm hover:shadow-md">
                          <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Travel Indicator */}
                <div className="pl-14 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                    <Car className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">15 min Fahrt</span>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-300 to-transparent rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mittags Section */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold mb-5 shadow-md">
                🌤 Mittags
              </div>
              
              <div className="relative">
                <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-cyan-400 to-blue-300 rounded-full" />
                
                {timelineStops.slice(2, 4).map((stop, index) => (
                  <div key={stop.id} className="relative pl-14 mb-6 group">
                    <div className="absolute left-0 top-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-blue-400 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 z-10">
                      <span className="text-lg">
                        {index === 0 ? "🍽️" : "⛵"}
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 tracking-wide">{stop.time}</span>
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          ⏱ {stop.duration * 60} min
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-base mb-3">{stop.title}</h3>
                      
                      <div className="relative overflow-hidden rounded-lg mb-3 aspect-[16/9] bg-gray-100 shadow-sm">
                        <img 
                          src={stop.image} 
                          alt={stop.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{stop.category}</p>
                          <p className="text-xs text-gray-500">{stop.reason}</p>
                        </div>
                        <button className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shadow-sm hover:shadow-md">
                          <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Travel Indicator */}
                <div className="pl-14 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">15 min Fahrt</span>
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-300 to-transparent rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Abends Section */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold mb-5 shadow-md">
                🌙 Abends
              </div>
              
              <div className="relative">
                <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-pink-400 to-purple-300 rounded-full" />
                
                {timelineStops.slice(4).map((stop, index) => (
                  <div key={stop.id} className="relative pl-14 mb-6 group">
                    <div className="absolute left-0 top-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-purple-400 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300 z-10">
                      <span className="text-lg">
                        {index === 0 ? "🚶" : "🍝"}
                      </span>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-500 tracking-wide">{stop.time}</span>
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                          ⏱ {stop.duration * 60} min
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-base mb-3">{stop.title}</h3>
                      
                      <div className="relative overflow-hidden rounded-lg mb-3 aspect-[16/9] bg-gray-100 shadow-sm">
                        <img 
                          src={stop.image} 
                          alt={stop.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{stop.category}</p>
                          <p className="text-xs text-gray-500">{stop.reason} {stop.price && `| ${stop.price}`}</p>
                        </div>
                        <button className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shadow-sm hover:shadow-md">
                          <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Column 2: Entdeckungen (Discoveries) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-1">
              Entdeckungen
            </h2>
            <p className="text-sm text-gray-500">Handverlesen für dich</p>
          </div>
          
          {/* Filter Pills */}
          <div className="px-6 py-4 flex gap-2 overflow-x-auto scrollbar-hide border-b border-gray-100">
            {[
              { id: "all", label: "Alle" },
              { id: "natur", label: "🌲 Natur" },
              { id: "kunst", label: "🏛️ Kultur" },
              { id: "elite", label: "⭐ Elite" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
                  activeFilter === filter.id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm hover:shadow-md"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Discovery Cards */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredDiscoveries.map((discovery) => (
              <div 
                key={discovery.id}
                onClick={() => setSelectedEvent(discovery)}
                className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                    <img 
                      src={discovery.image} 
                      alt={discovery.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
                    
                    {/* Elite Badge */}
                    {discovery.isElite && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold shadow-md flex items-center gap-1">
                          <Star className="w-3 h-3" />
                        </span>
                      </div>
                    )}
                    
                    {/* Favorite Heart */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(discovery.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Heart 
                        className={cn(
                          "w-4 h-4 transition-colors",
                          discovery.isFavorite ? "text-red-500 fill-red-500" : "text-gray-300"
                        )} 
                      />
                    </button>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-2 truncate group-hover:text-blue-600 transition-colors">
                        {discovery.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                          {discovery.category}
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{discovery.price}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400 text-sm">
                          {"⭐".repeat(Math.floor(discovery.rating))}
                        </div>
                        <span className="text-xs font-semibold text-gray-500">({discovery.rating})</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300">
                        + Zu Trip
                      </button>
                      <button className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all shadow-sm">
                        <RefreshCw className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Column 3: Map + Detail */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          {/* Map */}
          <Suspense fallback={
            <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
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
          
          {/* Detail Card (shown when event selected) */}
          {selectedEvent && (
            <div className="absolute bottom-8 right-8 w-[380px] bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-4 duration-300">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all z-10"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Image */}
              <div className="relative h-48 rounded-xl overflow-hidden mb-5 bg-gray-100 shadow-md -mx-2 -mt-2">
                <img 
                  src={selectedEvent.image} 
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="px-4 py-2 rounded-full bg-white text-gray-900 text-xs font-bold shadow-lg">
                    {selectedEvent.category}
                  </span>
                </div>
              </div>
              
              {/* Content */}
              <h3 className="font-bold text-xl text-gray-900 mb-3">{selectedEvent.title}</h3>
              
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                Ein wunderbares Erlebnis mit einzigartigem Charakter und besonderen Momenten.
              </p>
              
              {/* Rating */}
              <div className="flex items-center gap-5 mb-6">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold text-base shadow-md">
                    {selectedEvent.rating}
                  </div>
                  <div className="flex flex-col">
                    <div className="text-yellow-400 text-sm">{"⭐".repeat(Math.floor(selectedEvent.rating))}</div>
                    <span className="text-xs text-gray-500 font-semibold">256 Reviews</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 px-5 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-sm shadow-md hover:shadow-lg transition-all">
                  Details
                </button>
                <button className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                  Hinzufügen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
