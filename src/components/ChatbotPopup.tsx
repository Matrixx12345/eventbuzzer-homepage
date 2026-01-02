import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, Send, Sparkles, Loader2, MapPin, Calendar, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { streamChat } from "@/services/chatService";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getNearestPlace } from "@/utils/swissPlaces";

interface ChatMessage {
  role: "bot" | "user";
  content: string;
}

interface ChatbotPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  onFilterApply?: (filters: WizardFilters) => void;
}

export interface WizardFilters {
  mission: string | null;
  time: string | null;
  date?: Date;
  location: string;
  radius: string | null;
}

type WizardStep = "mission" | "time" | "location" | "complete";

const MISSION_OPTIONS = [
  { id: "solo", label: "Solo-Inspiration", emoji: "🧘" },
  { id: "family", label: "Familien-Erlebnisse", emoji: "👨‍👩‍👧" },
  { id: "friends", label: "Zeit mit Freunden", emoji: "🎉" },
  { id: "couple", label: "Erlebnisse zu zweit", emoji: "💕" },
];

const TIME_OPTIONS = [
  { id: "today", label: "Heute" },
  { id: "tomorrow", label: "Morgen" },
  { id: "weekend", label: "Wochenende" },
  { id: "pick", label: "📅 Kalender" },
];

const RADIUS_OPTIONS = [
  { id: "5", label: "< 5 km" },
  { id: "50", label: "5-50 km" },
  { id: "all", label: "Gesamte Schweiz" },
];

const CITY_OPTIONS = [
  { id: "zurich", label: "Zürich" },
  { id: "basel", label: "Basel" },
  { id: "bern", label: "Bern" },
  { id: "genf", label: "Genf" },
  { id: "luzern", label: "Luzern" },
  { id: "lausanne", label: "Lausanne" },
];

// Time keywords for hybrid input matching
const TIME_KEYWORDS = [
  { keywords: ["heute", "today"], id: "today" },
  { keywords: ["morgen", "tomorrow"], id: "tomorrow" },
  { keywords: ["wochenende", "samstag", "sonntag", "weekend"], id: "weekend" },
  { keywords: ["nächsten", "nächste", "kommenden", "kommende"], id: "weekend" },
];

// Bot responses for empathetic conversation
const BOT_RESPONSES = {
  mission: {
    solo: "Schön, Zeit für dich! 🧘 Wann soll es losgehen?",
    family: "Toll! Familienzeit ist wertvoll. 👨‍👩‍👧 Wann soll es losgehen?",
    friends: "Super! Mit Freunden macht alles mehr Spass. 🎉 Wann soll es losgehen?",
    couple: "Wie schön! ✨ Zeit zu zweit ist kostbar. Wann soll es losgehen?",
  },
  time: {
    today: "Perfekt, heute ist ein guter Tag! 📍 Wo magst du suchen?",
    tomorrow: "Super, morgen passt prima. 📍 Wo magst du suchen?",
    weekend: "Das Wochenende ruft! 📍 Wo magst du suchen?",
    pick: "Notiert! 📍 Wo magst du suchen?",
  },
};

// Mission to quickFilter mapping
const MISSION_TO_FILTER: Record<string, string> = {
  couple: "romantik",
  family: "mit-kind",
  friends: "nightlife",
  solo: "",
};

const ChatbotPopup = ({ isOpen, onClose, onOpen, onFilterApply }: ChatbotPopupProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>("mission");
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [selectedRadius, setSelectedRadius] = useState<string | null>(null);
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      content: "Hi! 👋 Verrate mir deinen Wunsch oder lass uns das Richtige über mein Quiz finden! ✨",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, { role: "bot", content }]);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { role: "user", content }]);
  };

  const sendMessageToAI = async (userContent: string) => {
    setIsLoading(true);
    
    // Include wizard context in prompt - limited to 50 results
    const context = `[System-Hinweis: Maximal 50 Ergebnisse anzeigen. User sucht: Mission=${selectedMission || 'offen'}, Zeit=${selectedTime || 'flexibel'}, Ort=${locationInput || 'Schweiz'}, Radius=${selectedRadius || 'flexibel'}]`;
    const fullPrompt = `${context}\n\nUser: ${userContent}`;
    
    const apiMessages = messages.map(m => ({
      role: m.role === "bot" ? "assistant" as const : "user" as const,
      content: m.content
    }));
    apiMessages.push({ role: "user" as const, content: fullPrompt });

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "bot" && assistantContent.startsWith(chunk.slice(0, 10) || chunk)) {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        if (last?.role === "bot" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "bot", content: assistantContent }];
      });
    };

    await streamChat({
      messages: apiMessages,
      onDelta: updateAssistantMessage,
      onDone: () => setIsLoading(false),
      onError: (error) => {
        setIsLoading(false);
        toast.error(error);
        setMessages(prev => [...prev, { 
          role: "bot", 
          content: "Entschuldigung, da ist etwas schiefgelaufen. Bitte versuche es nochmal! 🙏" 
        }]);
      }
    });
  };

  const handleMissionSelect = (missionId: string) => {
    const mission = MISSION_OPTIONS.find(m => m.id === missionId);
    setSelectedMission(missionId);
    addUserMessage(mission?.label || missionId);
    
    // Bot responds empathetically
    setTimeout(() => {
      const response = BOT_RESPONSES.mission[missionId as keyof typeof BOT_RESPONSES.mission] 
        || "Toll! Wann soll es losgehen?";
      addBotMessage(response);
      setStep("time");
    }, 300);
  };

  const handleTimeSelect = (timeId: string) => {
    if (timeId === "pick") {
      setShowCalendar(true);
      return;
    }
    const time = TIME_OPTIONS.find(t => t.id === timeId);
    setSelectedTime(timeId);
    addUserMessage(time?.label || timeId);
    
    // Bot responds empathetically
    setTimeout(() => {
      const response = BOT_RESPONSES.time[timeId as keyof typeof BOT_RESPONSES.time] 
        || "Super! 📍 Wo magst du suchen?";
      addBotMessage(response);
      setStep("location");
    }, 300);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setShowCalendar(false);
    const formattedDate = format(date, "d. MMMM yyyy", { locale: de });
    setSelectedTime("pick");
    addUserMessage(formattedDate);
    
    setTimeout(() => {
      addBotMessage("Perfekt, ist notiert! 📍 Wo magst du suchen?");
      setStep("location");
    }, 300);
  };

  const handleCitySelect = (cityLabel: string) => {
    setLocationInput(cityLabel);
  };

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      toast.error("GPS wird von deinem Browser nicht unterstützt");
      return;
    }
    
    setIsLoadingGPS(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearestCity = getNearestPlace(position.coords.latitude, position.coords.longitude);
        setLocationInput(nearestCity);
        setIsLoadingGPS(false);
        toast.success(`Standort erkannt: ${nearestCity}`);
      },
      (error) => {
        setIsLoadingGPS(false);
        toast.error("Standort konnte nicht ermittelt werden");
        console.error("GPS Error:", error);
      },
      { timeout: 10000 }
    );
  };

  const handleLocationSubmit = async () => {
    if (!locationInput.trim() && !selectedRadius) return;
    
    const locationText = locationInput.trim() || "Schweiz";
    const radiusText = RADIUS_OPTIONS.find(r => r.id === selectedRadius)?.label || "";
    
    addUserMessage(`${locationText}${radiusText ? ` ${radiusText}` : ''}`);
    
    // Build URL params for navigation
    const params = new URLSearchParams();
    if (locationText && locationText !== "Schweiz") {
      params.set("city", locationText);
    }
    if (selectedRadius && selectedRadius !== "all") {
      params.set("radius", selectedRadius);
    }
    if (selectedTime) {
      params.set("time", selectedTime);
    }
    if (selectedDate) {
      params.set("date", format(selectedDate, "yyyy-MM-dd"));
    }
    if (selectedMission && MISSION_TO_FILTER[selectedMission]) {
      params.set("quickFilter", MISSION_TO_FILTER[selectedMission]);
    }
    
    // Bot confirms and navigates
    setTimeout(() => {
      addBotMessage("Perfekt! Ich zeige dir jetzt die passenden Events. ✨");
      setStep("complete");
      
      // Navigate to listings page with filters
      setTimeout(() => {
        onClose();
        const queryString = params.toString();
        navigate(`/listings${queryString ? `?${queryString}` : ''}`);
      }, 800);
    }, 300);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const input = inputValue.toLowerCase().trim();

    // Step 1: Mission - try to match input to mission
    if (step === "mission") {
      const matchedMission = MISSION_OPTIONS.find(m => 
        input.includes(m.label.toLowerCase()) ||
        (m.id === "couple" && (input.includes("date") || input.includes("zweit") || input.includes("romantik") || input.includes("paar"))) ||
        (m.id === "friends" && (input.includes("freund") || input.includes("friend"))) ||
        (m.id === "family" && (input.includes("famili") || input.includes("kind"))) ||
        (m.id === "solo" && (input.includes("solo") || input.includes("allein")))
      );
      if (matchedMission) {
        setInputValue("");
        handleMissionSelect(matchedMission.id);
        return;
      }
      // No match but try to be helpful
      addUserMessage(inputValue);
      setInputValue("");
      setTimeout(() => {
        addBotMessage("Interessant! Wähle eine Mission oder sag mir mehr. 😊");
      }, 300);
      return;
    }
    
    // Step 2: Time - try to match time keywords
    if (step === "time") {
      const matchedTime = TIME_KEYWORDS.find(t => 
        t.keywords.some(k => input.includes(k))
      );
      if (matchedTime) {
        setInputValue("");
        handleTimeSelect(matchedTime.id);
        return;
      }
      // Try to parse as a date-like string
      if (input.includes("samstag") || input.includes("sonntag")) {
        setInputValue("");
        handleTimeSelect("weekend");
        return;
      }
      // No match
      addUserMessage(inputValue);
      setInputValue("");
      setTimeout(() => {
        addBotMessage("Wähle eine Zeit-Option oder tippe z.B. 'Wochenende'. 📅");
      }, 300);
      return;
    }
    
    // Step 3: Location - treat as location input
    if (step === "location") {
      setLocationInput(inputValue);
      setInputValue("");
      // Auto-submit if it looks like a city
      const isCityMatch = CITY_OPTIONS.some(c => input.includes(c.label.toLowerCase()));
      if (isCityMatch || input.length >= 3) {
        setTimeout(() => handleLocationSubmit(), 100);
      }
      return;
    }

    // Complete step: Free AI request for follow-up questions
    addUserMessage(inputValue);
    const messageToSend = inputValue;
    setInputValue("");

    await sendMessageToAI(messageToSend);
  };

  const handleSurprise = async () => {
    if (isLoading) return;
    addUserMessage("Überrasche mich! ✨");
    
    // Set defaults for filter
    setSelectedMission("solo");
    setSelectedTime("weekend");
    setLocationInput("Schweiz");
    setSelectedRadius("all");
    
    setTimeout(() => {
      addBotMessage("Ich liebe Überraschungen! 🎲 Hier sind die besten Events der Woche für dich:");
      setStep("complete");
      
      const filters: WizardFilters = {
        mission: "solo",
        time: "weekend",
        location: "Schweiz",
        radius: "all",
      };
      
      if (onFilterApply) {
        onFilterApply(filters);
      }
      
      setTimeout(() => {
        onClose();
        toast.success("Überraschung! Scroll nach unten für die Highlights.");
      }, 1500);
    }, 300);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      if (step === "location" && locationInput.trim()) {
        handleLocationSubmit();
      } else {
        handleSendMessage();
      }
    }
  };

  const getPlaceholder = () => {
    switch (step) {
      case "mission":
        return "z.B. 'date', 'Familie', 'Freunde'...";
      case "time":
        return "z.B. 'nächsten Samstag', 'Wochenende'...";
      case "location":
        return "Stadt oder PLZ eingeben...";
      case "complete":
        return "Frag mich nach weiteren Details...";
      default:
        return "Nachricht eingeben...";
    }
  };

  const resetWizard = () => {
    setStep("mission");
    setSelectedMission(null);
    setSelectedTime(null);
    setSelectedDate(undefined);
    setLocationInput("");
    setSelectedRadius(null);
    setMessages([{
      role: "bot",
      content: "Hi! 👋 Verrate mir deinen Wunsch oder lass uns das Richtige über mein Quiz finden! ✨",
    }]);
  };

  return (
    <>
      {/* Chevron Handle - visible when collapsed */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] w-8 h-20 flex items-center justify-center bg-white shadow-xl rounded-l-xl border border-r-0 border-gray-300 hover:bg-gray-50 hover:w-10 transition-all duration-200"
        >
          <ChevronLeft className="h-7 w-7 text-gray-600" />
        </button>
      )}

      {/* Main Panel - Dynamic Height */}
      <div
        className={`fixed right-0 top-16 z-50 transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="w-[380px] max-w-[calc(100vw-1rem)] flex flex-col rounded-l-2xl overflow-hidden shadow-2xl border border-r-0 border-white/20">
          {/* Frosted Glass Background */}
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-l-2xl" />
          
          {/* Content - Auto height with max constraint */}
          <div className="relative flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Header - Clean, no divider */}
            <div className="flex items-center justify-between p-5 pb-3">
              <h2 className="font-serif text-lg text-gray-800">
                Dein Event-Assistent
              </h2>
              <div className="flex items-center gap-2">
                {step === "complete" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetWizard}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Neu starten
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full hover:bg-gray-200/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Chat Messages - Always visible */}
              <div className="px-5 py-2 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                        message.role === "user"
                          ? "bg-[hsl(var(--wizard-accent))] text-white rounded-br-md"
                          : "bg-white/90 text-gray-800 rounded-bl-md shadow-sm border border-gray-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start">
                    <div className="bg-white/90 text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-2.5">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Step 1: Mission Selection */}
              {step === "mission" && (
                <div className="px-5 pb-4 pt-2 space-y-2">
                  {MISSION_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleMissionSelect(option.id)}
                      disabled={isLoading}
                      className="w-full py-3 px-5 text-center rounded-xl bg-white/70 hover:bg-white/90 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                  
                  <button
                    onClick={handleSurprise}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 text-center text-gray-500 hover:text-gray-700 text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-3 hover:bg-white/50 rounded-lg"
                  >
                    Noch unschlüssig? Lass dich überraschen
                    <Sparkles className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Step 2: Time Selection */}
              {step === "time" && (
                <div className="px-5 pb-4 pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleTimeSelect(option.id)}
                        disabled={isLoading}
                        className="py-3.5 px-4 text-center rounded-xl bg-white/70 hover:bg-white/90 border border-gray-200/50 text-gray-800 font-medium transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Location Selection - Clean Design */}
              {step === "location" && (
                <div className="px-5 pb-4 pt-2 space-y-4">
                  {/* City Chips - Clean Row */}
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 font-medium px-1">Wähle eine Stadt:</span>
                    <div className="flex flex-wrap gap-2">
                      {CITY_OPTIONS.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => handleCitySelect(city.label)}
                          className={`py-2 px-4 rounded-full border text-xs font-medium transition-all ${
                            locationInput === city.label
                              ? "bg-[hsl(var(--wizard-accent))] text-white border-[hsl(var(--wizard-accent))] shadow-md"
                              : "bg-white/60 hover:bg-white/90 border-gray-200/50 text-gray-700"
                          }`}
                        >
                          {city.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* GPS Button - Below cities */}
                  <button
                    onClick={handleGPSLocation}
                    disabled={isLoadingGPS}
                    className="w-full py-3 px-4 text-center rounded-xl bg-white/60 hover:bg-white/90 border border-gray-200/50 text-gray-600 hover:text-gray-800 font-medium transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoadingGPS ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="h-4 w-4" />
                    )}
                    <span>Oder Standort nutzen</span>
                  </button>
                  
                  {/* Radius Chips - White/light styling */}
                  <div className="space-y-2">
                    <span className="text-xs text-gray-500 font-medium px-1">Umkreis:</span>
                    <div className="flex gap-2">
                      {RADIUS_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setSelectedRadius(selectedRadius === option.id ? null : option.id)}
                          className={`flex-1 py-2 px-3 text-center rounded-full border text-xs font-medium transition-all ${
                            selectedRadius === option.id
                              ? "bg-white text-gray-900 border-gray-400 shadow-sm"
                              : "bg-white/40 hover:bg-white/70 border-gray-200/60 text-gray-500"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <Button
                    onClick={handleLocationSubmit}
                    disabled={isLoading || !locationInput.trim()}
                    className="w-full bg-[hsl(var(--wizard-accent))] hover:bg-[hsl(var(--wizard-accent))]/90 text-white rounded-xl h-12 font-medium shadow-md"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "✨ Events finden"}
                  </Button>
                </div>
              )}

              {/* Complete Step - Follow-up chat available */}
              {step === "complete" && (
                <div className="px-5 pb-4 pt-2">
                  <div className="text-center text-sm text-gray-500 bg-white/50 rounded-lg py-3 px-4">
                    Du kannst mir noch Fragen stellen, z.B. "Hunde erlaubt?" oder "Mit Parkplatz?"
                  </div>
                </div>
              )}
            </div>

            {/* Calendar Dialog */}
            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
              <DialogContent className="sm:max-w-[350px] p-0">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </DialogContent>
            </Dialog>

            {/* Input Area - ALWAYS VISIBLE in every step */}
            <div className="p-4 pt-2">
              <div className="flex gap-2">
                <Input
                  value={step === "location" ? locationInput : inputValue}
                  onChange={(e) => step === "location" ? setLocationInput(e.target.value) : setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={getPlaceholder()}
                  disabled={isLoading}
                  className="flex-1 bg-white/90 border-gray-200/60 rounded-xl focus-visible:ring-[hsl(var(--wizard-accent))]/50 text-sm h-11"
                />
                <Button
                  onClick={step === "location" ? handleLocationSubmit : handleSendMessage}
                  disabled={(step === "location" ? !locationInput.trim() : !inputValue.trim()) || isLoading}
                  className="bg-[hsl(var(--wizard-accent))] hover:bg-[hsl(var(--wizard-accent))]/90 text-white rounded-xl px-4 h-11 shadow-md"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatbotPopup;
