import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useTripPlanner } from "@/contexts/TripPlannerContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Admin emails allowed to see pending events
const ADMIN_EMAILS = ["eventbuzzer1@gmail.com", "j.straton111@gmail.com"];

interface NavbarProps {
  bgColor?: string;
}

const Navbar = ({ bgColor = "bg-white/80" }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  const { favorites } = useFavorites();
  const { totalEventCount } = useTripPlanner();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Events", href: "/" },
    { label: "Magazin", href: "/magazin" },
    { label: "Favoriten", href: "/favorites" },
    { label: "Reiseplaner", href: "/reiseplaner" },
  ];

  const adminLinks = [
    { label: "Dashboard", href: "/admin/ratings" },
    { label: "Tagging", href: "/admin/speed-tagging" },
    { label: "Supabase Test", href: "/supabase-test" },
    { label: "Honeypot", href: "/admin/honeypot" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className={`z-50 ${bgColor} backdrop-blur-md border-b border-border/50`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-serif italic text-navbar-foreground">
            EventBuzzer
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors relative"
              >
                {link.label}
                {link.label === "Favoriten" && (
                  <span className={`absolute -top-2 -right-5 text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                    favorites.length === 0
                      ? 'text-gray-500 border border-gray-400/30 font-normal'
                      : 'bg-red-500 text-white shadow-md font-bold'
                  }`}>
                    {favorites.length}
                  </span>
                )}
                {link.label === "Reiseplaner" && (
                  <span className={`absolute -top-2 -right-5 text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                    totalEventCount === 0
                      ? 'text-gray-500 border border-gray-400/30 font-normal'
                      : 'bg-red-500 text-white shadow-md font-bold'
                  }`}>
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
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-popover">
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
          <div className="hidden lg:flex items-center gap-3">
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
            className="lg:hidden p-2 text-navbar-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors relative"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                  {link.label === "Favoriten" && (
                    <span className={`absolute -top-1 -right-5 text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                      favorites.length === 0
                        ? 'text-gray-500 border border-gray-400/30 font-normal'
                        : 'bg-red-500 text-white shadow-md font-bold'
                    }`}>
                      {favorites.length}
                    </span>
                  )}
                  {link.label === "Reiseplaner" && (
                    <span className={`absolute -top-1 -right-5 text-xs rounded-full w-5 h-5 flex items-center justify-center ${
                      totalEventCount === 0
                        ? 'text-gray-500 border border-gray-400/30 font-normal'
                        : 'bg-red-500 text-white shadow-md font-bold'
                    }`}>
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
