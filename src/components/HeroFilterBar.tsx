import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Die exakten 10 Filter mit Mapping zu den Quick-Filter Tags
const categoryFilters = [
  { display: "Musik", value: "musik-party", emoji: "🎵" },
  { display: "Kunst", value: "kunst-kultur", emoji: "🎨" },
  { display: "Kulinarik", value: "kulinarik-genuss", emoji: "🍽️" },
  { display: "Ausflüge", value: "natur-ausfluege", emoji: "🌿" },
  { display: "Märkte", value: "maerkte-stadtfeste", emoji: "🎪" },
  { display: "Romantik", value: "romantik", emoji: "❤️" },
  { display: "Top Stars", value: "top-stars", emoji: "⭐" },
  { display: "Mit Kind", value: "mit-kind", emoji: "👶" },
  { display: "Mistwetter", value: "mistwetter", emoji: "🌧️" },
  { display: "Wellness", value: "wellness", emoji: "💆" },
];

interface HeroFilterBarProps {
  onFilterChange?: (categoryValue: string | null) => void;
}

const HeroFilterBar = ({ onFilterChange }: HeroFilterBarProps) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFilterClick = (value: string | null) => {
    // Toggle: if already active, deselect
    const newValue = activeFilter === value ? null : value;
    setActiveFilter(newValue);
    onFilterChange?.(newValue);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeFilter) {
      params.set("quickFilter", activeFilter);
    }
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[90vw]">
      {/* Glassmorphism Container */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/60 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-12">
          {/* Filter Pills Grid - Left Side */}
          <div className="flex-1 grid grid-cols-5 gap-6">
            {categoryFilters.map((filter) => (
              <button
                key={filter.display}
                onClick={() => handleFilterClick(filter.value)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium
                  border border-white/80 transition-all duration-200
                  flex items-center justify-center gap-1.5
                  ${
                    activeFilter === filter.value
                      ? "bg-white text-foreground shadow-md"
                      : "bg-white/80 text-foreground/90 hover:bg-white/95 hover:shadow-sm"
                  }
                `}
              >
                <span className="text-sm">{filter.emoji}</span>
                <span className="hidden sm:inline">{filter.display}</span>
              </button>
            ))}
          </div>

          {/* Search Button - Right Side */}
          <button
            onClick={handleSearch}
            className="
              px-10 py-2.5 rounded-lg text-sm font-semibold
              bg-white/90 text-foreground border border-white/80
              hover:bg-white hover:shadow-md transition-all duration-200
              flex items-center justify-center gap-2 shrink-0
            "
          >
            <Search size={18} />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroFilterBar;
