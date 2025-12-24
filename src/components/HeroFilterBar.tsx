import { useNavigate } from "react-router-dom";

// 6 Filter in einer Reihe
const categoryFilters = [
  { display: "Musik", value: "musik-party", emoji: "🎵" },
  { display: "Kunst", value: "kunst-kultur", emoji: "🎨" },
  { display: "Ausflüge", value: "natur-ausfluege", emoji: "🌿" },
  { display: "Märkte", value: "maerkte-stadtfeste", emoji: "🎪" },
  { display: "Romantik", value: "romantik", emoji: "❤️" },
  { display: "Mit Kind", value: "mit-kind", emoji: "👶" },
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
                px-5 py-2.5 rounded-full text-sm font-medium
                border border-white/60 transition-all duration-300
                flex items-center justify-center gap-2
                bg-white/90 text-foreground/90 
                hover:bg-white hover:shadow-lg hover:scale-105
                backdrop-blur-sm
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
