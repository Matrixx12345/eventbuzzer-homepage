import mapTeaserImage from "@/assets/map-teaser.jpg";

interface StaticMapTeaserProps {
  eventCount: number;
  onOpenPlanner: () => void;
}

const StaticMapTeaser = ({ eventCount, onOpenPlanner }: StaticMapTeaserProps) => {
  return (
    <div 
      onClick={onOpenPlanner}
      className="relative h-[300px] rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Background Image */}
      <img
        src={mapTeaserImage}
        alt="Interaktive Karte mit Events"
        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
      />
      
      {/* Event Counter Badge - Top Right */}
      <div 
        className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          color: '#1a1a1a'
        }}
      >
        {eventCount} Events
      </div>
      
      {/* Hover Overlay with Button */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <button
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 px-6 py-3 rounded-lg font-semibold shadow-lg"
          style={{
            backgroundColor: 'white',
            color: '#333333'
          }}
        >
          🗺️ Zur interaktiven Map
        </button>
      </div>
    </div>
  );
};

export default StaticMapTeaser;
