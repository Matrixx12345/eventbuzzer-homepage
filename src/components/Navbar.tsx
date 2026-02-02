import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Startseite", href: "/" },
    { label: "Events", href: "/eventlist1" },
    { label: "Favoriten", href: "/favorites" },
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
              </Link>
            ))}

            {/* Admin Dropdown - Only visible when logged in */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-sm font-medium text-navbar-foreground/20 hover:text-navbar-foreground/40 transition-colors flex items-center gap-1">
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
                  <Link to="/auth">Einloggen</Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to="/auth">Registrieren</Link>
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
                </Link>
              ))}

              {/* Mobile Admin Links - Only visible when logged in */}
              {user && (
                <div className="pt-2 border-t border-border/30">
                  <span className="text-xs text-navbar-foreground/20 mb-2 block">Admin</span>
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
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                {user ? (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                        <User size={16} />
                        Profil
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleSignOut}>
                      <LogOut size={16} />
                      Ausloggen
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Einloggen</Link>
                    </Button>
                    <Button variant="secondary" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Registrieren</Link>
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
