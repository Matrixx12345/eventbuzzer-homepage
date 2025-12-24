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
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[90vw]">
      {/* Glassmorphism Container */}
      <div className="backdrop-blur-xl bg-white/30 border border-white/60 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-center gap-12">
          {/* Filter Pills - Single Row */}
          {categoryFilters.map((filter) => (
            <button
              key={filter.display}
              onClick={() => handleFilterClick(filter.value)}
              className="
                px-3 py-1.5 rounded-lg text-sm font-medium
                border border-white/80 transition-all duration-200
                flex items-center justify-center gap-1.5
                bg-white/80 text-foreground/90 hover:bg-white hover:shadow-md
              "
            >
              <span className="text-sm">{filter.emoji}</span>
              <span className="hidden sm:inline">{filter.display}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroFilterBar;
