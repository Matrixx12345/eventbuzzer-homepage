import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Heart, MapPin, Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useRef } from "react";
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
  { slug: "kulturbetrieb-royal", image: eventAbbey, title: "Photo Spot Einsiedeln Abbey", venue: "Leonard House", location: "Einsiedeln • CH", date: "Dec 20, 2025" },
  { slug: "art-exhibit", image: eventConcert, title: "Kulturbetrieb Royal", venue: "Leonard House", location: "Baden • CH", date: "Dec 22, 2025" },
  { slug: "wine-dining", image: eventSymphony, title: "Zurich Tonhalle", venue: "Tonhalle Orchestra", location: "Zürich • CH", date: "Dec 25, 2025" },
  { slug: "opera-festival", image: eventVenue, title: "Volver", venue: "Bern Venue", location: "Bern • CH", date: "Dec 28, 2025" },
  { slug: "jazz-quartet", image: weekendJazz, title: "Jazz Quartet Night", venue: "Leonard House", location: "Baden • CH", date: "Jan 5, 2026" },
  { slug: "comedy-club", image: weekendComedy, title: "Comedy Night", venue: "Leonard House", location: "Baden • CH", date: "Jan 10, 2026" },
];

// Partner products - compact grid items
const partnerProducts = [
  { image: partnerRoses, name: "Red Roses Bouquet (12 pcs)", price: "39 €", partner: "Lokalem Partner" },
  { image: partnerChocolate, name: "Heart-Shaped Velvet Box of Chocolates", price: "29 €", partner: "Lokalem Partner" },
  { image: partnerChampagne, name: "Moët & Chandon Brut Impérial", price: "49 €", partner: "Galaxus" },
  { image: partnerTeddy, name: "Soft Teddy Bear (50 cm)", price: "35 €", partner: "Manor" },
  { image: partnerChocolate, name: "Elegant Scented Candle Set", price: "24 €", partner: "Manor" },
  { image: partnerRoses, name: "Heart-Shaped Winter Gloves (Couple Set)", price: "27 €", partner: "Galaxus" },
];

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
    <Link to={`/event/${slug}`} className="block group">
      <article className="bg-card rounded-xl overflow-hidden">
        {/* 16:9 Landscape Image */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* POPULAR Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-semibold">
              🔥 POPULAR
            </span>
          </div>
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3 right-3 p-2"
          >
            <Heart size={20} className={isFavorite ? "fill-favorite text-favorite" : "text-white"} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-sans text-card-foreground text-base font-semibold leading-tight mb-1">{title}</h3>
          <p className="text-muted-foreground text-sm">{venue}</p>
          <p className="text-muted-foreground text-sm">{location}</p>
        </div>
      </article>
    </Link>
  );
};

const ProductCard = ({ image, name, price, partner }: {
  image: string;
  name: string;
  price: string;
  partner: string;
}) => {
  return (
    <article className="bg-card rounded-xl overflow-hidden p-4 flex flex-col sm:flex-row items-center gap-4">
      {/* Square Product Image */}
      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-card-foreground text-sm font-semibold mb-1">{name}</h3>
        <p className="text-primary font-semibold mb-3">{price}</p>
        <button className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-medium px-4 py-2 rounded-lg transition-colors text-sm">
          Bei {partner} kaufen
        </button>
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
    <div className="min-h-screen bg-card">
      <Navbar />

      {/* Hero Image - Full Width, No Overlay Text */}
      <section className="relative h-[50vh] min-h-[350px] overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </section>

      {/* Info Bar + Content Section */}
      <section className="bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title and Get Tickets Row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between py-8 gap-6">
            <div className="flex-1">
              <h1 className="font-serif text-card-foreground text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {event.title}
              </h1>
              
              {/* Event Meta */}
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{event.venue}</span>
                </div>
                <span>{event.location}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors">
                Get Tickets
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-3 rounded-lg border border-border/40 hover:bg-card/80 transition-colors"
              >
                <Heart size={20} className={isFavorite ? "fill-favorite text-favorite" : "text-card-foreground"} />
              </button>
            </div>
          </div>

          {/* Two Column: About + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
            {/* Left - About (66%) */}
            <div className="lg:col-span-2">
              <h2 className="font-semibold text-card-foreground text-lg mb-4">About This Event</h2>
              <p className="text-muted-foreground leading-relaxed">
                {event.description}
              </p>
              <button className="text-primary hover:underline mt-2 text-sm font-medium">
                Mehr lesen
              </button>
            </div>

            {/* Right - Map (33%) */}
            <div className="lg:col-span-1">
              <div className="rounded-xl overflow-hidden border border-border/20">
                {/* Placeholder Map */}
                <div className="aspect-[4/3] bg-neutral-800 relative">
                  <img
                    src="https://maps.googleapis.com/maps/api/staticmap?center=New+York,NY&zoom=11&size=400x300&maptype=roadmap&key=placeholder"
                    alt="Map"
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="%23374151" width="400" height="300"/><text x="200" y="150" fill="%239CA3AF" text-anchor="middle" font-family="sans-serif" font-size="16">Map</text></svg>';
                    }}
                  />
                  {/* Map Controls Overlay */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <span className="bg-white text-neutral-800 text-xs px-2 py-1 rounded font-medium">Map</span>
                    <span className="bg-white/80 text-neutral-600 text-xs px-2 py-1 rounded">Satellite</span>
                  </div>
                </div>
                <div className="p-3 bg-card">
                  <p className="text-muted-foreground text-sm">
                    📍 Distance: 76.0 km away from you (is only shown when you allow location access)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Similar Events Carousel */}
      <section className="py-16 bg-card border-t border-border/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-card-foreground text-2xl sm:text-3xl mb-8">Ähnliche Events</h2>
          
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
            <CarouselPrevious className="hidden sm:flex -left-4 bg-card border-border/40 text-card-foreground hover:bg-card/80" />
            <CarouselNext className="hidden sm:flex -right-4 bg-card border-border/40 text-card-foreground hover:bg-card/80" />
          </Carousel>
        </div>
      </section>

      {/* Unvergessliche Augenblicke - Dense Grid */}
      <section className="py-16 bg-card border-t border-border/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-card-foreground text-2xl sm:text-3xl mb-8">
            Unvergessliche Augenblicke schaffen
          </h2>

          {/* 3-Column Grid on Desktop (2 rows of 3) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerProducts.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-muted-foreground text-sm">
            © 2025 EventBuzzer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EventDetail;
