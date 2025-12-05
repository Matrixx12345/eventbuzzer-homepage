import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Heart, MapPin, Calendar, Clock, ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";

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
    time: "20:00 - 23:00",
    description: "Experience an unforgettable evening of smooth jazz in the intimate setting of Leonard House. The Finezdara Jazz Quartet brings together world-class musicians for a night of improvisation and musical excellence."
  },
  "kulturbetrieb-royal": {
    image: weekendOrchestra,
    title: "Kulturbetrieh Royal",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 18, 2025",
    time: "19:30 - 22:00",
    description: "A royal evening of classical performances featuring the finest orchestral arrangements in Switzerland's most prestigious venue."
  },
  "art-exhibit": {
    image: weekendArt,
    title: "Art Exhibit Bimore",
    venue: "Tonhalla Orchestra",
    location: "Zürich • CH",
    date: "December 20, 2025",
    time: "10:00 - 18:00",
    description: "Discover contemporary masterpieces and timeless classics in this curated exhibition showcasing the best of Swiss and international art."
  },
  "wine-dining": {
    image: weekendWine,
    title: "Freenstannee Wine & Fine Dining Event",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 22, 2025",
    time: "18:30 - 23:00",
    description: "An exquisite pairing of fine wines and gourmet cuisine, guided by Switzerland's most renowned sommeliers and chefs."
  },
  "comedy-club": {
    image: weekendComedy,
    title: "Local Comedy Club Night",
    venue: "Leonard House",
    location: "Baden • CH",
    date: "December 23, 2025",
    time: "21:00 - 00:00",
    description: "Laugh the night away with Switzerland's funniest comedians in an intimate club setting."
  },
  "opera-festival": {
    image: weekendOpera,
    title: "Festival: Initial Musics for Opera",
    venue: "Opera House",
    location: "Zürich • CH",
    date: "December 28, 2025",
    time: "19:00 - 22:30",
    description: "A grand operatic experience featuring world-renowned performers in Zürich's iconic Opera House."
  },
  "geneva-watch-fair": {
    image: swissGeneva,
    title: "The Geneva Watch & Art Fair",
    venue: "Palexpo Geneva",
    location: "Geneva • CH",
    date: "January 10, 2026",
    time: "09:00 - 18:00",
    description: "The world's most prestigious watch and art fair, showcasing horological masterpieces alongside contemporary art."
  },
  "lucerne-classical": {
    image: swissLucerne,
    title: "Lucerne Classical Summer",
    venue: "KKL Luzern",
    location: "Lucerne • CH",
    date: "January 15, 2026",
    time: "19:30 - 22:00",
    description: "World-class orchestras and soloists perform in the acoustically perfect KKL concert hall."
  },
  "bern-market": {
    image: swissBern,
    title: "Bern Federal Plaza Market",
    venue: "Bundesplatz",
    location: "Bern • CH",
    date: "January 20, 2026",
    time: "08:00 - 17:00",
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
    time: "14:00 - 23:00",
    description: "Special screenings and premieres at Switzerland's most celebrated film festival."
  },
  "interlaken-adventure": {
    image: swissInterlaken,
    title: "Interlaken Adventure Days",
    venue: "Interlaken Ost",
    location: "Interlaken • CH",
    date: "February 10, 2026",
    time: "08:00 - 18:00",
    description: "Paragliding, hiking, and extreme sports in the stunning Swiss Alps."
  },
  "basel-fair": {
    image: swissBasel,
    title: "Basel Autumn Fair",
    venue: "Messeplatz",
    location: "Basel • CH",
    date: "February 15, 2026",
    time: "11:00 - 22:00",
    description: "Switzerland's largest autumn fair with rides, food, and entertainment for all ages."
  }
};

// Similar events for the grid
const similarEvents = [
  { slug: "kulturbetrieb-royal", image: weekendOrchestra, title: "Kulturbetrieh Royal", venue: "Leonard House", location: "Baden • CH" },
  { slug: "art-exhibit", image: weekendArt, title: "Art Exhibit Bimore", venue: "Tonhalla Orchestra", location: "Zürich • CH" },
  { slug: "wine-dining", image: weekendWine, title: "Wine & Fine Dining", venue: "Leonard House", location: "Baden • CH" },
  { slug: "opera-festival", image: weekendOpera, title: "Opera Festival", venue: "Opera House", location: "Zürich • CH" },
];

// Partner products
const partnerProducts = [
  {
    image: partnerChampagne,
    name: "Moët & Chandon Impérial",
    price: "CHF 65.00",
    partner: "Galaxus",
    description: "Classic champagne for celebratory moments"
  },
  {
    image: partnerRoses,
    name: "12 Red Roses Bouquet",
    price: "CHF 89.00",
    partner: "Fleurop",
    description: "Hand-tied luxury rose arrangement"
  },
  {
    image: partnerTeddy,
    name: "Premium Teddy Bear",
    price: "CHF 45.00",
    partner: "Manor",
    description: "Soft plush gift companion"
  },
  {
    image: partnerChocolate,
    name: "Lindt Pralinés Selection",
    price: "CHF 55.00",
    partner: "Lindt",
    description: "Assorted Swiss chocolate pralines"
  }
];

const SimilarEventCard = ({ slug, image, title, venue, location }: {
  slug: string;
  image: string;
  title: string;
  venue: string;
  location: string;
}) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Link to={`/event/${slug}`} className="block group">
      <article className="relative h-[320px] bg-card rounded-2xl overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/40 to-transparent" />
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors z-10"
        >
          <Heart size={18} className={isFavorite ? "fill-favorite text-favorite" : "text-card-foreground"} />
        </button>

        <div className="relative h-full flex flex-col justify-end p-5">
          <span className="text-primary text-xs font-semibold tracking-wider mb-2">PREMIUM EVENT</span>
          <h3 className="font-serif text-card-foreground text-lg font-semibold leading-tight mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm">{venue}</p>
          <p className="text-muted-foreground text-sm">{location}</p>
        </div>
      </article>
    </Link>
  );
};

const PartnerProductCard = ({ image, name, price, partner, description }: {
  image: string;
  name: string;
  price: string;
  partner: string;
  description: string;
}) => {
  return (
    <article className="group relative bg-gradient-to-b from-neutral-800 to-neutral-900 rounded-3xl overflow-hidden flex flex-col h-[480px] hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
      {/* Partner Badge */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-primary/40 bg-card/60 backdrop-blur-sm">
          <span className="text-primary text-[10px] font-semibold tracking-widest">PARTNER</span>
          <span className="text-card-foreground text-[10px] font-medium">{partner}</span>
        </span>
      </div>

      {/* Product Image */}
      <div className="relative h-[65%] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6 justify-between">
        <div>
          <h3 className="font-serif text-card-foreground text-xl font-semibold mb-1">{name}</h3>
          <p className="text-muted-foreground text-sm mb-2">{description}</p>
          <p className="text-primary font-semibold text-lg">{price}</p>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-xl transition-colors mt-4 group/btn">
          <span>Shop at Partner</span>
          <ExternalLink size={16} className="group-hover/btn:translate-x-1 transition-transform" />
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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] bg-card overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/20" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative h-full flex flex-col justify-end pb-12">
          <Link
            to="/"
            className="absolute top-8 left-4 sm:left-6 lg:left-8 flex items-center gap-2 text-card-foreground/70 hover:text-card-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Events</span>
          </Link>

          <span className="text-primary text-sm font-semibold tracking-widest mb-4">PREMIUM EVENT</span>
          <h1 className="font-serif text-card-foreground text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 max-w-3xl">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-6 mb-8 text-card-foreground/80">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-primary" />
              <span>{event.venue}, {event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-primary" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              <span>{event.time}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-3 rounded-lg transition-colors">
              Book Now
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="flex items-center gap-2 bg-card/30 backdrop-blur-sm hover:bg-card/50 text-card-foreground px-6 py-3 rounded-lg transition-colors border border-card-foreground/20"
            >
              <Heart size={20} className={isFavorite ? "fill-favorite text-favorite" : ""} />
              <span>{isFavorite ? "Saved" : "Save Event"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Event Description */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="font-serif text-foreground text-2xl sm:text-3xl mb-6">About This Event</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">{event.description}</p>
          </div>
        </div>
      </section>

      {/* Similar Events Section */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-card-foreground text-3xl sm:text-4xl mb-10">Ähnliche Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarEvents.map((evt, index) => (
              <SimilarEventCard key={index} {...evt} />
            ))}
          </div>
        </div>
      </section>

      {/* Partner Carousel Section */}
      <section className="py-20 bg-gradient-to-b from-neutral-950 to-neutral-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-semibold tracking-widest mb-3 block">CONCIERGE SERVICE</span>
            <h2 className="font-serif text-card-foreground text-3xl sm:text-4xl lg:text-5xl mb-4">
              Unvergessliche Augenblicke
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Elevate your experience with curated gifts from our trusted partners
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnerProducts.map((product, index) => (
              <PartnerProductCard key={index} {...product} />
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
