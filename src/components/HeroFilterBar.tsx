import { useNavigate } from "react-router-dom";

// 6 Filter - Values müssen mit quickFilters IDs in Listings.tsx übereinstimmen
const categoryFilters = [
  { display: "Musik", value: "musik", emoji: "🎵", tags: ["musik-konzerte", "party-clubs"] },
  { display: "Kunst", value: "kunst", emoji: "🎨", tags: ["kunst-kultur", "museum-galerie"] },
  { display: "Ausflüge", value: "natur", emoji: "🌿", tags: ["natur-erlebnisse", "open-air"] },
  { display: "Märkte", value: "maerkte", emoji: "🎪", tags: ["maerkte-feste", "food-maerkte"] },
  { display: "Romantik", value: "romantik", emoji: "❤️", tags: ["romantisch-date"] },
  { display: "Mit Kind", value: "mit-kind", emoji: "👶", tags: ["familie-kinder"] },
];

const HeroFilterBar = () => {
  const navigate = useNavigate();

  const handleFilterClick = (value: string) => {
    navigate(`/listings?quickFilter=${value}`);
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      {/* Glassmorphism Container - auto width */}
      <div className="backdrop-blur-xl bg-white/25 border border-white/40 rounded-full px-8 py-4 shadow-2xl">
        <div className="flex items-center gap-4">
          {/* Filter Pills - Single Row */}
          {categoryFilters.map((filter) => (
            <button
              key={filter.display}
              onClick={() => handleFilterClick(filter.value)}
              className="
                min-w-[110px] px-5 py-2.5 rounded-full text-sm font-medium
                border border-white/60 transition-all duration-300
                flex items-center justify-center gap-2
                bg-white/90 text-foreground/90 
                hover:bg-white hover:shadow-lg hover:scale-105
                backdrop-blur-sm whitespace-nowrap
              "
            >
              <span>{filter.emoji}</span>
              <span>{filter.display}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroFilterBar;
