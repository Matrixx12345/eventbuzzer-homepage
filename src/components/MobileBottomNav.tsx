import { Home, Calendar, Heart, Map } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import { cn } from "@/lib/utils";

const MobileBottomNav = () => {
  const location = useLocation();
  const { favorites } = useFavorites();
  const { totalEventCount } = useTripPlanner();

  const navItems = [
    {
      label: "Home",
      icon: Home,
      href: "/",
      badge: null,
    },
    {
      label: "Events",
      icon: Calendar,
      href: "/eventlist1",
      badge: null,
    },
    {
      label: "Favoriten",
      icon: Heart,
      href: "/favorites",
      badge: favorites.length,
    },
    {
      label: "Planer",
      icon: Map,
      href: "/reiseplaner",
      badge: totalEventCount,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-lg border-t-2 border-stone-300 shadow-[0_-4px_16px_rgba(0,0,0,0.12)] safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 relative min-w-[64px] min-h-[56px] px-3 py-2 rounded-lg transition-all duration-200",
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={cn(
                    "transition-all duration-200",
                    active ? "scale-110" : "scale-100"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.badge !== null && (
                  <span className={`absolute -top-2 -right-2 text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                    item.badge === 0
                      ? 'text-gray-500 border border-gray-400/30 font-normal'
                      : 'bg-red-500 text-white shadow-md font-bold'
                  }`}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-all duration-200",
                  active ? "font-semibold" : "font-normal"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
