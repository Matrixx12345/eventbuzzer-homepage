import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { label: "Startseite", href: "/" },
    { label: "Alle Events", href: "/listings" },
    { label: "Eventliste 1", href: "/eventlist1" },
    { label: "Trip Planer", href: "/trip-planner" },
    { label: "Favoriten", href: "/favorites" },
  ];

  const adminLinks = [
    { label: "Dashboard", href: "/admin/ratings" },
    { label: "Tagging", href: "/admin/speed-tagging" },
    { label: "Supabase Test", href: "/supabase-test" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-navbar border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-serif italic text-navbar-foreground">
            EventBuzzer
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {/* Ghost Admin Dropdown */}
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
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                    <LogOut size={16} />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/auth">Anmelden</Link>
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
                  className="text-sm font-medium text-navbar-foreground/80 hover:text-navbar-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Admin Links - Ghost Style */}
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
              
              <div className="flex gap-3 pt-4">
                {user ? (
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={handleSignOut}>
                    <LogOut size={16} />
                    Abmelden
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Anmelden</Link>
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
