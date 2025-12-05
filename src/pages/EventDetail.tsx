import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Heart, MapPin, Calendar, Clock, ExternalLink } from "lucide-react";
import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Import all event images
import weekendJazz from "@/assets/weekend-jazz.jpg";
import weekendOrchestra from "@/assets/weekend-orchestra.jpg";
import weekendArt from "@/assets/weekend-art.jpg";
import weekendWine from "@/assets/weekend-wine.jpg";
import weekendComedy from "@/assets/weekend-comedy.jpg";
import weekendOpera from "@/assets/weekend-opera.jpg";
import swissGeneva from "@/assets/swiss-geneva.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissZermatt from "@/assets/swiss-zermatt.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import swissInterlaken from "@/assets/swiss-interlaken.jpg";
import swissBasel from "@/assets/swiss-basel.jpg";
import swissTrain from "@/assets/swiss-train.jpg";
import eventAbbey from "@/assets/event-abbey.jpg";
import eventConcert from "@/assets/event-concert.jpg";
import eventSymphony from "@/assets/event-symphony.jpg";
import eventVenue from "@/assets/event-venue.jpg";

// Rainy day images
import rainyKunsthaus from "@/assets/rainy-kunsthaus.jpg";
import rainySpa from "@/assets/rainy-spa.jpg";
import rainyCinema from "@/assets/rainy-cinema.jpg";
import rainyChocolate from "@/assets/rainy-chocolate.jpg";
import rainyFifa from "@/assets/rainy-fifa.jpg";

// Partner products
import partnerChampagne from "@/assets/partner-champagne.jpg";
import partnerRoses from "@/assets/partner-roses.jpg";
import partnerTeddy from "@/assets/partner-teddy.jpg";
import partnerChocolate from "@/assets/partner-chocolate.jpg";

// Event data mapping
const eventsData: Record<string, {
  image: string;
  title: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  description: string;
}> = {
  "jazz-quartet": {
    image: weekendJazz,
    title: "The Finezdara & Jazz Quartet Club",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 15, 2025",
    time: "20:00",
    description: "Experience an unforgettable evening of smooth jazz in the intimate setting of Leonard House. The Finezdara Jazz Quartet brings together world-class musicians for a night of improvisation and musical excellence. The Käfigturm was the city's second western gateway. The tower was built between 1256 and 1344, served as a prison between 1641 and 1643 and retained that function until 1897. The clock was installed in 1691."
  },
  "kulturbetrieb-royal": {
    image: weekendOrchestra,
    title: "Kulturbetrieh Royal",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 18, 2025",
    time: "19:30",
    description: "A royal evening of classical performances featuring the finest orchestral arrangements in Switzerland's most prestigious venue. Experience the grandeur of classical music in an intimate setting."
  },
  "art-exhibit": {
    image: weekendArt,
    title: "Art Exhibit Bimore",
    venue: "Tonhalla Orchestra",
    location: "Zürich • CH",
    date: "December 20, 2025",
    time: "10:00",
    description: "Discover contemporary masterpieces and timeless classics in this curated exhibition showcasing the best of Swiss and international art."
  },
  "wine-dining": {
    image: weekendWine,
    title: "Freenstannee Wine & Fine Dining Event",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 22, 2025",
    time: "18:30",
    description: "An exquisite pairing of fine wines and gourmet cuisine, guided by Switzerland's most renowned sommeliers and chefs."
  },
  "comedy-club": {
    image: weekendComedy,
    title: "Local Comedy Club Night",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 23, 2025",
    time: "21:00",
    description: "Laugh the night away with Switzerland's funniest comedians in an intimate club setting."
  },
  "opera-festival": {
    image: weekendOpera,
    title: "Festival: Initial Musics for Opera",
    venue: "Opera House",
    location: "Zürich • CH",
    date: "December 28, 2025",
    time: "19:00",
    description: "A grand operatic experience featuring world-renowned performers in Zürich's iconic Opera House."
  },
  "geneva-watch-fair": {
    image: swissGeneva,
    title: "The Geneva Watch & Art Fair",
    venue: "Palexpo Geneva",
    location: "Geneva • CH",
    date: "January 10, 2026",
    time: "09:00",
    description: "The world's most prestigious watch and art fair, showcasing horological masterpieces alongside contemporary art."
  },
  "lucerne-classical": {
    image: swissLucerne,
    title: "Lucerne Classical Summer",
    venue: "KKL Luzern",
    location: "Lucerne • CH",
    date: "January 15, 2026",
    time: "19:30",
    description: "World-class orchestras and soloists perform in the acoustically perfect KKL concert hall."
  },
  "bern-market": {
    image: swissBern,
    title: "Bern Federal Plaza Market",
    venue: "Bundesplatz",
    location: "Bern • CH",
    date: "January 20, 2026",
    time: "08:00",
    description: "Experience the vibrant atmosphere of Bern's famous market at the historic Federal Plaza."
  },
  "zermatt-hiking": {
    image: swissZermatt,
    title: "Zermatt Matterhorn Hiking Week",
    venue: "Zermatt Village",
    location: "Zermatt • CH",
    date: "January 25, 2026",
    time: "All Day",
    description: "A week of guided hiking adventures with breathtaking views of the iconic Matterhorn."
  },
  "zurich-film": {
    image: swissZurich,
    title: "Zurich Film Festival Specials",
    venue: "Corso Cinema",
    location: "Zürich • CH",
    date: "February 1, 2026",
    time: "14:00",
    description: "Special screenings and premieres at Switzerland's most celebrated film festival."
  },
  "interlaken-adventure": {
    image: swissInterlaken,
    title: "Interlaken Adventure Days",
    venue: "Interlaken Ost",
    location: "Interlaken • CH",
    date: "February 10, 2026",
    time: "08:00",
    description: "Paragliding, hiking, and extreme sports in the stunning Swiss Alps."
  },
  "basel-fair": {
    image: swissBasel,
    title: "Basel Autumn Fair",
    venue: "Messeplatz",
    location: "Basel • CH",
    date: "February 15, 2026",
    time: "11:00",
    description: "Switzerland's largest autumn fair with rides, food, and entertainment for all ages."
  },
  "grand-train-tour": {
    image: swissTrain,
    title: "The Grand Train Tour Winter Edition",
    venue: "Swiss Rail",
    location: "Switzerland",
    date: "March 1, 2026",
    time: "08:00",
    description: "Experience the breathtaking panoramic Glacier Express journey through snow-covered Swiss Alps."
  },
  "kunsthaus-zurich": {
    image: rainyKunsthaus,
    title: "Kunsthaus Zürich",
    venue: "Kunsthaus Zürich",
    location: "Zürich • CH",
    date: "Open Daily",
    time: "10:00 - 18:00",
    description: "Discover world-class art collections spanning from medieval times to contemporary masterpieces in one of Switzerland's most prestigious galleries."
  },
  "hurlimann-spa": {
    image: rainySpa,
    title: "Hürlimann Spa",
    venue: "Thermalbad & Spa",
    location: "Zürich • CH",
    date: "Open Daily",
    time: "09:00 - 22:00",
    description: "Relax in the historic thermal baths housed in a beautifully restored 19th-century brewery, featuring rooftop pools with panoramic city views."
  },
  "kosmos-cinema": {
    image: rainyCinema,
    title: "Kosmos Cinema",
    venue: "Kosmos Kulturhaus",
    location: "Zürich • CH",
    date: "Various Screenings",
    time: "Check Schedule",
    description: "Experience cinema in style with luxurious velvet seating and carefully curated film selections in this iconic Zurich cultural venue."
  },
  "lindt-chocolate": {
    image: rainyChocolate,
    title: "Lindt Home of Chocolate",
    venue: "Lindt Museum",
    location: "Kilchberg • CH",
    date: "Open Daily",
    time: "10:00 - 18:00",
    description: "Experience the world's largest chocolate fountain and explore interactive exhibits showcasing the art of Swiss chocolate making."
  },
  "fifa-museum": {
    image: rainyFifa,
    title: "FIFA Museum",
    venue: "FIFA World Museum",
    location: "Zürich • CH",
    date: "Open Daily",
    time: "10:00 - 18:00",
    description: "Immerse yourself in the history of football with interactive exhibits, memorabilia, and the iconic World Cup trophy."
  }
};

// Similar events for carousel
const similarEvents = [
  { slug: "kulturbetrieb-royal", image: eventAbbey, title: "Photo Spot Einsiedeln Abbey", venue: "Leonard House", location: "Einsiedeln • CH", date: "Dec 20" },
  { slug: "art-exhibit", image: eventConcert, title: "Kulturbetrieb Royal", venue: "Leonard House", location: "Baden • CH", date: "Dec 22" },
  { slug: "wine-dining", image: eventSymphony, title: "Zurich Tonhalle", venue: "Tonhalle Orchestra", location: "Zürich • CH", date: "Dec 25" },
  { slug: "opera-festival", image: eventVenue, title: "Volver", venue: "Bern Venue", location: "Bern • CH", date: "Dec 28" },
];

// Partner products - masonry grid items
const partnerProducts = [
  { image: partnerChampagne, name: "Moët & Chandon", price: "CHF 49", partner: "Galaxus", isTall: true },
  { image: partnerRoses, name: "12 Red Roses", price: "CHF 39", partner: "Fleurop", isTall: false },
  { image: partnerTeddy, name: "Teddy Bear", price: "CHF 35", partner: "Manor", isTall: false },
  { image: partnerChocolate, name: "Lindt Pralinés", price: "CHF 29", partner: "Lindt", isTall: true },
  { image: partnerRoses, name: "Rose Bouquet", price: "CHF 45", partner: "Fleurop", isTall: false },
  { image: partnerChampagne, name: "Dom Pérignon", price: "CHF 189", partner: "Galaxus", isTall: false },
];

// Similar Event Card - Zig-Zag Style from Landing Page
const SimilarEventCard = ({ slug, image, title, venue, location, date }: {
  slug: string;
  image: string;
  title: string;
  venue: string;
  location: string;
  date: string;
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Link to={`/event/${slug}`} className="block group h-full">
      <article className="bg-neutral-900 rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Image - 50% */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-600 text-white text-xs font-semibold">
              🔥 POPULAR
            </span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3 right-3 p-1.5"
          >
            <Heart size={16} className={isFavorite ? "fill-red-500 text-red-500" : "text-white"} />
          </button>
        </div>

        {/* Content - 50% */}
        <div className="p-4 flex flex-col flex-1">
          <span className="text-amber-500 text-xs font-semibold tracking-wider mb-2">PREMIUM EVENT</span>
          <h3 className="font-serif text-white text-base font-semibold leading-tight mb-1">{title}</h3>
          <p className="text-neutral-400 text-sm mb-1">{venue}</p>
          <p className="text-neutral-500 text-xs mb-3">{location} • {date}</p>
          <button className="mt-auto bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
            View Details
          </button>
        </div>
      </article>
    </Link>
  );
};

// Masonry Product Card
const ProductCard = ({ image, name, price, partner, isTall }: {
  image: string;
  name: string;
  price: string;
  partner: string;
  isTall: boolean;
}) => {
  return (
    <article className={`relative rounded-2xl overflow-hidden group cursor-pointer ${isTall ? 'row-span-2' : ''}`}>
      <img
        src={image}
        alt={name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <p className="text-white/60 text-xs mb-1">via {partner}</p>
        <h3 className="font-serif text-white text-lg font-semibold mb-1">{name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-amber-400 font-semibold">{price}</span>
          <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
            Shop <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </article>
  );
};

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [isFavorite, setIsFavorite] = useState(false);

  // Get event data or use default
  const event = slug && eventsData[slug] ? eventsData[slug] : {
    image: weekendJazz,
    title: "Event Not Found",
    venue: "Unknown Venue",
    location: "Switzerland",
    date: "Coming Soon",
    time: "TBA",
    description: "This event is not available."
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO SECTION - Cinematic Dark Mode */}
      <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </section>

      {/* FLOATING WHITE CARD - Magazine Style */}
      <section className="relative z-10 -mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-4xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left - Event Info */}
              <div className="flex-1">
                <h1 className="font-serif text-neutral-900 text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                  {event.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-amber-600" />
                    <span className="text-sm">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-amber-600" />
                    <span className="text-sm">{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-amber-600" />
                    <span className="text-sm">{event.venue}, {event.location}</span>
                  </div>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-lg shadow-amber-600/30">
                  Get Tickets
                </button>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                >
                  <Heart size={20} className={isFavorite ? "fill-red-500 text-red-500" : "text-neutral-600"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENT & MAP SECTION - Clean White */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Left - About (66%) */}
            <div className="lg:col-span-2">
              <h2 className="font-serif text-neutral-900 text-2xl font-bold mb-6">About This Event</h2>
              <p className="text-neutral-600 leading-relaxed text-lg">
                {event.description}
              </p>
              <p className="text-neutral-600 leading-relaxed text-lg mt-4">
                Join us for an extraordinary experience that combines world-class entertainment with Swiss precision and elegance. Whether you're a seasoned enthusiast or discovering this for the first time, this event promises to create lasting memories.
              </p>
              <button className="text-amber-600 hover:text-amber-700 mt-4 text-sm font-semibold flex items-center gap-1">
                Read more about the venue →
              </button>
            </div>

            {/* Right - Map (33%) */}
            <div className="lg:col-span-1">
              <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
                <div className="aspect-square bg-neutral-100 relative">
                  <img
                    src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/8.5417,47.3769,12,0/400x400?access_token=placeholder`}
                    alt="Map"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect fill="%23f5f5f5" width="400" height="400"/><text x="200" y="200" fill="%23999" text-anchor="middle" font-family="sans-serif" font-size="14">Map</text></svg>';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-amber-600 text-white p-2 rounded-full shadow-lg">
                      <MapPin size={20} />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <p className="text-neutral-900 font-semibold text-sm">{event.venue}</p>
                  <p className="text-neutral-500 text-sm">{event.location}</p>
                  <button className="text-amber-600 hover:text-amber-700 text-sm font-medium mt-2">
                    Get Directions →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMILAR EVENTS - Dark Mode Carousel */}
      <section className="bg-neutral-950 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-white text-2xl sm:text-3xl font-bold">Ähnliche Events</h2>
            <Link to="/" className="text-amber-500 hover:text-amber-400 text-sm font-medium">
              View All →
            </Link>
          </div>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {similarEvents.map((evt, index) => (
                <CarouselItem key={index} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                  <SimilarEventCard {...evt} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
            <CarouselNext className="hidden sm:flex -right-4 bg-white/10 border-white/20 text-white hover:bg-white/20" />
          </Carousel>
        </div>
      </section>

      {/* PARTNER PRODUCTS - Light Masonry Grid */}
      <section className="bg-stone-50 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="font-serif text-neutral-900 text-2xl sm:text-3xl font-bold mb-2">Unvergessliche Augenblicke</h2>
            <p className="text-neutral-500">Curated additions to make your evening unforgettable</p>
          </div>

          {/* Masonry Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
            {partnerProducts.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer Spacer */}
      <div className="h-16 bg-stone-50" />
    </div>
  );
};

export default EventDetail;
