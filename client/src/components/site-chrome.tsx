import { Link, useNavigate } from "react-router-dom";
import { useAuth, primaryRole } from "../lib/auth-context";
import { Button } from "./ui/button";
import { 
  Search, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Calendar, 
  Home,
  Briefcase,
  Users
} from "lucide-react";
import { useState } from "react";

// ... your existing imports

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Fix: Use object syntax for to prop with search
  const getLinkProps = (path: string, search?: string) => {
    if (search) {
      return { to: { pathname: path, search: search } };
    }
    return { to: path };
  };

  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display text-xl">
            <span className="text-primary">Bookify</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/explore" className="text-sm text-muted-foreground hover:text-foreground transition">
              Explore
            </Link>
            {user && (
              <>
                <Link 
                  to="/account" 
                  className="text-sm text-muted-foreground hover:text-foreground transition"
                >
                  Dashboard
                </Link>
                {roles.includes("business") && (
                  <Link 
                    to="/business" 
                    className="text-sm text-muted-foreground hover:text-foreground transition"
                  >
                    Business
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right side - Auth buttons or user menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
                <Link to="/account">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* Fix: Use object syntax for search */}
                <Link 
                  to={{ 
                    pathname: "/auth", 
                    search: new URLSearchParams({ mode: "signin" }).toString() 
                  }}
                >
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link 
                  to={{ 
                    pathname: "/auth", 
                    search: new URLSearchParams({ mode: "signup" }).toString() 
                  }}
                >
                  <Button size="sm" className="rounded-full">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/60">
            <nav className="flex flex-col gap-3">
              <Link 
                to="/explore" 
                className="text-sm text-muted-foreground hover:text-foreground transition"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explore
              </Link>
              {user ? (
                <>
                  <Link 
                    to="/account" 
                    className="text-sm text-muted-foreground hover:text-foreground transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {roles.includes("business") && (
                    <Link 
                      to="/business" 
                      className="text-sm text-muted-foreground hover:text-foreground transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Business
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {/* Fix: Use object syntax for search */}
                  <Link 
                    to={{ 
                      pathname: "/auth", 
                      search: new URLSearchParams({ mode: "signin" }).toString() 
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link 
                    to={{ 
                      pathname: "/auth", 
                      search: new URLSearchParams({ mode: "signup" }).toString() 
                    }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button size="sm" className="w-full rounded-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-display text-lg mb-3">Bookify</h3>
            <p className="text-sm text-muted-foreground">
              Book appointments instantly.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">For Customers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explore">Explore</Link></li>
              <li><Link to="/auth">Sign Up</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">For Businesses</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/for-business">List Your Business</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/resources">Resources</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border/60 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Bookify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}