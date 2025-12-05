import { Button } from "@/components/ui/button";

import swissGeneva from "@/assets/swiss-geneva.jpg";
import swissLucerne from "@/assets/swiss-lucerne.jpg";
import swissBern from "@/assets/swiss-bern.jpg";
import swissZermatt from "@/assets/swiss-zermatt.jpg";
import swissZurich from "@/assets/swiss-zurich.jpg";
import swissInterlaken from "@/assets/swiss-interlaken.jpg";
import swissBasel from "@/assets/swiss-basel.jpg";

const swissEvents = [
  {
    id: 1,
    title: "The Geneva Watch & Art Fair",
    description: "Experience the world's finest timepieces and contemporary art at Lake Geneva's most prestigious annual event featuring renowned watchmakers and international artists.",
    image: swissGeneva,
  },
  {
    id: 2,
    title: "Lucerne Classical Summer",
    description: "Immerse yourself in world-class orchestral performances set against the stunning backdrop of Chapel Bridge and the Swiss Alps.",
    image: swissLucerne,
  },
  {
    id: 3,
    title: "Bern Federal Plaza Market",
    description: "Discover artisanal treasures and local delicacies at the historic Federal Plaza, surrounded by Switzerland's magnificent Parliament Building.",
    image: swissBern,
  },
  {
    id: 4,
    title: "Zermatt Matterhorn Hiking Week",
    description: "Embark on guided alpine adventures through breathtaking trails with panoramic views of the iconic Matterhorn peak.",
    image: swissZermatt,
  },
  {
    id: 5,
    title: "Zurich Film Festival Specials",
    description: "Celebrate international cinema in Zurich's charming Old Town with exclusive screenings, director Q&As, and red carpet premieres.",
    image: swissZurich,
  },
  {
    id: 6,
    title: "Interlaken Adventure Days",
    description: "Soar above the Swiss Alps with paragliding, bungee jumping, and outdoor activities in one of Europe's most thrilling adventure destinations.",
    image: swissInterlaken,
  },
  {
    id: 7,
    title: "Basel Autumn Fair",
    description: "Experience Switzerland's largest and oldest fair along the Rhine River, featuring traditional crafts, carnival rides, and seasonal festivities.",
    image: swissBasel,
  },
];

const SwitzerlandSection = () => {
  return (
    <section className="bg-white py-24 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h2 className="font-serif text-4xl md:text-5xl text-neutral-900 text-left mb-16">
          This Month in Switzerland
        </h2>

        {/* Cards Stack */}
        <div className="flex flex-col gap-16">
          {swissEvents.map((event, index) => {
            const isOdd = index % 2 === 0; // 0, 2, 4, 6 = Image LEFT
            
            return (
              <div
                key={event.id}
                className={`bg-card rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[400px]`}
              >
                {/* Image */}
                <div
                  className={`relative h-64 md:h-auto ${
                    isOdd ? "md:order-1" : "md:order-2"
                  }`}
                >
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div
                  className={`flex flex-col justify-center p-8 md:p-12 ${
                    isOdd ? "md:order-2" : "md:order-1"
                  }`}
                >
                  <span className="text-primary text-xs font-sans tracking-[0.2em] uppercase mb-4">
                    Premium Event
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-white mb-4">
                    {event.title}
                  </h3>
                  <p className="text-gray-400 font-sans text-sm md:text-base leading-relaxed mb-8">
                    {event.description}
                  </p>
                  <div>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-sm px-6">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SwitzerlandSection;
