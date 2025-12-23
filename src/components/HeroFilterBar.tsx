import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mapping: Display label → Database value
const categoryFilters = [
  { display: "Alle", value: null, emoji: "✨" },
  { display: "Romantik", value: "Romantik", emoji: "❤️" },
  { display: "Top Stars", value: "Top Stars", emoji: "⭐" },
  { display: "Familie", value: "Familie", emoji: "👨‍👩‍👧" },
  { display: "Natur", value: "Natur & Ausflüge", emoji: "🌿" },
  { display: "Musik", value: "Musik & Party", emoji: "🎵" },
  { display: "Kunst", value: "Kunst & Kultur", emoji: "🎨" },
  { display: "Kulinarik", value: "Kulinarik & Genuss", emoji: "🍽️" },
  { display: "Märkte", value: "Märkte & Stadtfeste", emoji: "🎪" },
];

interface HeroFilterBarProps {
  onFilterChange?: (categoryValue: string | null) => void;
}

const HeroFilterBar = ({ onFilterChange }: HeroFilterBarProps) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFilterClick = (value: string | null) => {
    setActiveFilter(value);
    onFilterChange?.(value);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (activeFilter) {
      params.set("category", activeFilter);
    }
    navigate(`/listings${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-2xl">
      {/* Glassmorphism Container */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/60 rounded-2xl p-4 shadow-lg">
        <div className="flex items-stretch gap-4">
          {/* Filter Pills Grid - Left Side */}
          <div className="flex-1 grid grid-cols-4 gap-2">
            {categoryFilters.map((filter) => (
              <button
                key={filter.display}
                onClick={() => handleFilterClick(filter.value)}
                className={`
                  px-3 py-2 rounded-full text-sm font-medium
                  border border-white/80 transition-all duration-200
                  flex items-center justify-center gap-1.5
                  ${
                    activeFilter === filter.value
                      ? "bg-white text-foreground shadow-md"
                      : "bg-white/80 text-foreground/90 hover:bg-white/95 hover:shadow-sm"
                  }
                `}
              >
                <span className="text-base">{filter.emoji}</span>
                <span className="hidden sm:inline">{filter.display}</span>
              </button>
            ))}
          </div>

          {/* Search Button - Right Side */}
          <button
            onClick={handleSearch}
            className="
              px-6 py-2 rounded-xl text-base font-semibold
              bg-white/80 text-foreground border border-white/80
              hover:bg-white hover:shadow-md transition-all duration-200
              flex items-center justify-center gap-2 min-w-[120px]
            "
          >
            <Search size={20} />
            <span>Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroFilterBar;
