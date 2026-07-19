import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, primaryRole } from "../lib/auth-context";
import { Button } from "./ui/button";
import {
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Calendar,
  Home,
  Briefcase,
  Users,
  Search,
  Sparkles,
  ChevronDown,
  PlusCircle,
  Star,
  Bell,
  LayoutDashboard,
  Store,
  Heart
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";

export function Navbar() {
  const { user, roles, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const role = primaryRole(roles);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Navigation items based on role
  const getNavItems = () => {
    const items = [];

    // Common items for all users
    items.push({
      label: "Home",
      path: "/",
      icon: Home
    });

    items.push({
      label: "Explore",
      path: "/explore",
      icon: Search
    });

    if (user) {
      if (role === "admin") {
        items.push({
          label: "Admin",
          path: "/admin",
          icon: LayoutDashboard
        });
        items.push({
          label: "Users",
          path: "/admin/users",
          icon: Users
        });
      } else if (role === "business" || role === "staff") {
        items.push({
          label: "Dashboard",
          path: "/business/dashboard",
          icon: LayoutDashboard
        });
        items.push({
          label: "Appointments",
          path: "/business/appointments",
          icon: Calendar
        });
        items.push({
          label: "Customers",
          path: "/business/customers",
          icon: Users
        });
      } else {
        items.push({
          label: "My Appointments",
          path: "/account",
          icon: Calendar
        });
        items.push({
          label: "Favorites",
          path: "/favorites",
          icon: Heart
        });
      }
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60 shadow-lg shadow-primary/5"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-300">
              <Sparkles className="h-5 w-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
            </div>
            <span className="font-display text-xl md:text-2xl font-bold tracking-tight">
              <span className="text-foreground">Book</span>
              <span className="text-primary">ify</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Auth or User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl hover:bg-secondary/50 transition-all duration-200 group"
                >
                  <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata.full_name || user.email || "User"}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-4.5 w-4.5 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium hidden md:block">
                    {user.user_metadata?.full_name || user.email?.split("@")[0] || "User"}
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    userMenuOpen && "rotate-180"
                  )} />
                </button>

                {/* User Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-background/95 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl py-1.5 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3.5 border-b border-border/60">
                      <p className="text-sm font-semibold">
                        {user.user_metadata?.full_name || user.email || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {user.email}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {role || "customer"}
                        </span>
                      </div>
                    </div>

                    <div className="py-1.5">
                      <Link
                        to="/account"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      {(role === "business" || role === "staff") && (
                        <Link
                          to="/business"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Store className="h-4 w-4" />
                          Business Dashboard
                        </Link>
                      )}
                      <Link
                        to="/account/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="border-t border-border/60 my-1.5" />
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth?mode=signin">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-xl text-sm font-medium hover:bg-secondary/50 transition-all duration-200"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup">
                  <Button 
                    size="sm" 
                    className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-secondary/50 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4 border-t border-border/60 space-y-1.5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}

            {!user && (
              <div className="pt-4 border-t border-border/60 space-y-2.5">
                <Link to="/auth?mode=signin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {user && (
              <div className="pt-4 border-t border-border/60">
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}