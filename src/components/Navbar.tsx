import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import { Badge } from "@/components/ui/badge";
import { externalSupabase } from "@/integrations/supabase/externalClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Admin emails allowed to see pending events
const ADMIN_EMAILS = ["eventbuzzer1@gmail.com", "j.straton111@gmail.com"];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { user, signOut } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  const { favorites } = useFavorites();
  const { totalEventCount } = useTripPlanner();
  const navigate = useNavigate();

  // Load pending events count for admins only
  useEffect(() => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    const loadPendingCount = async () => {
      try {
        const { count, error } = await externalSupabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("source", "partner");

        if (!error) {
          setPendingCount(count || 0);
        }
      } catch (err) {
        console.error("Error loading pending count:", err);
      }
    };

    loadPendingCount();

    // Poll every 60 seconds for updates
    const interval = setInterval(loadPendingCount, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const navLinks = [
    { label: "Startseite", href: "/" },
    { label: "Events", href: "/eventlist1" },
    { label: "Favoriten", href: "/favorites" },
    { label: "Reiseplaner", href: "/reiseplaner" },
  ];

  const adminLinks = [
    { label: "Dashboard", href: "/admin/ratings" },
    { label: "Tagging", href: "/admin/speed-tagging" },
    { label: "Alle Events", href: "/listings" },
    { label: "Events Neu", href: "/events-neu" },
    { label: "Trip-Planer", href: "/trip-planner" },
    { label: "Trip-Planer Neu", href: "/trip-planer-neu" },
    { label: "Supabase Test", href: "/supabase-test" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="z-50 bg-white/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-serif italic text-navbar-foreground">
            EventBuzzer
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors relative"
              >
                {link.label}
                {link.label === "Favoriten" && favorites.length > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
                {link.label === "Reiseplaner" && totalEventCount > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalEventCount}
                  </span>
                )}
              </Link>
            ))}

            {/* Admin Dropdown - Only visible for authorized admins */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-sm font-medium text-navbar-foreground/20 hover:text-navbar-foreground/40 transition-colors flex items-center gap-1 relative">
                    <Settings size={14} />
                    <span>Admin</span>
                    {pendingCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-popover">
                  {/* Pending Events Link - Top Priority */}
                  <DropdownMenuItem asChild>
                    <Link
                      to="/admin/pending-events"
                      className="cursor-pointer flex items-center justify-between"
                    >
                      <span>Pending Events</span>
                      {pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {pendingCount}
                        </Badge>
                      )}
                    </Link>
                  </DropdownMenuItem>

                  {/* Divider */}
                  <div className="my-1 h-px bg-border"></div>

                  {/* Other Admin Links */}
                  {adminLinks.map((link) => (
                    <DropdownMenuItem key={link.label} asChild>
                      <Link to={link.href} className="cursor-pointer">
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <User size={16} />
                    {user.email?.split("@")[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="gap-2 cursor-pointer">
                      <User size={16} />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                    <LogOut size={16} />
                    Ausloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/partner">Event hochladen</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                  <Link to="/auth">Login</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-navbar-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                  {link.label === "Favoriten" && favorites.length > 0 && (
                    <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                  {link.label === "Reiseplaner" && totalEventCount > 0 && (
                    <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {totalEventCount}
                    </span>
                  )}
                </Link>
              ))}

              {/* Mobile Admin Links - Only visible when logged in */}
              {user ? (
                <div className="pt-2 border-t border-border/30">
                  <span className="text-xs text-navbar-foreground/20 mb-2 block">Profil & Admin</span>
                  <Link
                    to="/profile"
                    className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors block py-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profil
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/pending-events"
                        className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors block py-1 flex items-center justify-between"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>Pending Events</span>
                        {pendingCount > 0 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {pendingCount}
                          </Badge>
                        )}
                      </Link>
                      {adminLinks.map((link) => (
                        <Link
                          key={link.label}
                          to={link.href}
                          className="text-sm font-medium text-navbar-foreground/20 hover:text-navbar-foreground/40 transition-colors block py-1"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              ) : null}
              
              <div className="flex gap-3 pt-4">
                {user ? (
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleSignOut}>
                    <LogOut size={16} />
                    Ausloggen
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/partner" onClick={() => setMobileMenuOpen(false)}>Event hochladen</Link>
                    </Button>
                    <Button variant="default" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
