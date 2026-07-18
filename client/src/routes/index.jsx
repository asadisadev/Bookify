import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "../components/site-chrome";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Star, 
  ArrowRight, 
  CalendarCheck, 
  Users, 
  TrendingUp,
  Clock,
  Award,
  MapPin,
  CheckCircle,
  Layers,
  Smartphone,
  Heart,
  MessageSquare,
  Bell,
  CreditCard,
  Settings
} from "lucide-react";

function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const featuredQ = useQuery({
    queryKey: ["featured-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, description, banner_url, logo_url, city, country, rating_avg, rating_count, category_id")
        .eq("status", "approved")
        .order("rating_avg", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const onSearch = (e) => {
    e.preventDefault();
    navigate({ to: "/explore", search: { q } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-150 w-225 rounded-full bg-primary/20 blur-[120px] opacity-70" />
          <div className="absolute bottom-0 right-0 h-100 w-100 rounded-full bg-primary/10 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-20 md:pt-28 md:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Smart appointment discovery, powered by AI
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[1.02]">
              Book any appointment,<br />
              <span className="text-gradient-ember italic">instantly.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
              Doctors, salons, restaurants, lawyers — discover appointment-based businesses near you and book in seconds.
            </p>

            <form onSubmit={onSearch} className="mt-10 max-w-2xl mx-auto glass rounded-2xl p-2 flex items-center gap-2 shadow-lg">
              <Search className="h-5 w-5 text-muted-foreground ml-3 shrink-0" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Try “dentist tomorrow at 10” or “salon near me”"
                className="border-0 bg-transparent focus-visible:ring-0 shadow-none text-base h-12"
              />
              <Button type="submit" size="lg" className="rounded-xl h-12 px-6">
                Search
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {categoriesQ.data?.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  to="/explore"
                  search={{ q: c.name }}
                  className="rounded-full border border-border/70 bg-background/50 backdrop-blur px-3.5 py-1.5 text-xs hover:bg-background hover:border-primary/50 transition"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="border-t border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, label: "Verified Businesses", desc: "All businesses are vetted" },
              { icon: Clock, label: "Real-time Availability", desc: "Book instantly" },
              { icon: Star, label: "4.9 Avg Rating", desc: "From real customers" },
              { icon: Users, label: "10k+ Businesses", desc: "Trusted by thousands" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured businesses */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Featured businesses</h2>
            <p className="text-muted-foreground mt-1">Trusted, top-rated, and ready to book.</p>
          </div>
          <Link to="/explore" className="text-sm text-primary flex items-center gap-1 hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featuredQ.data && featuredQ.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredQ.data.map((b) => (
              <Link key={b.id} to="/b/$slug" params={{ slug: b.slug }}>
                <Card className="overflow-hidden hover:ring-1 hover:ring-primary/40 transition group h-full">
                  <div className="aspect-16/10 bg-muted relative overflow-hidden">
                    {b.banner_url ? (
                      <img src={b.banner_url} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-lg leading-tight">{b.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span>{Number(b.rating_avg).toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {[b.city, b.country].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground">No businesses listed yet. Be the first — <Link to="/for-business" className="text-primary underline">list your business</Link>.</p>
          </Card>
        )}
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl">How Bookify works</h2>
            <p className="text-muted-foreground mt-2">Three steps between you and your next appointment.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Search", desc: "Describe what you need in plain English. Bookify finds businesses with matching availability." },
              { icon: CalendarCheck, title: "Book", desc: "Pick a time from real-time available slots. Confirmation lands in your inbox instantly." },
              { icon: Zap, title: "Show up", desc: "We remind you. No phone tag, no double-bookings, no waiting on hold." },
            ].map((s, i) => (
              <Card key={i} className="p-6">
                <div className="h-11 w-11 rounded-xl bg-primary/10 grid place-items-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-medium text-lg mt-4">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - NEW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl">Everything you need to manage appointments</h2>
          <p className="text-muted-foreground mt-2">Built for businesses and customers alike.</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Smartphone, title: "Mobile-Friendly", desc: "Book and manage appointments on the go from any device." },
            { icon: Bell, title: "Smart Reminders", desc: "Automated notifications reduce no-shows and keep everyone informed." },
            { icon: CreditCard, title: "Secure Payments", desc: "Collect deposits and payments seamlessly with our secure system." },
            { icon: Heart, title: "Personalized Experience", desc: "AI-powered recommendations for the best appointment matches." },
            { icon: MessageSquare, title: "Direct Messaging", desc: "Chat with businesses instantly for questions or special requests." },
            { icon: Settings, title: "Easy Management", desc: "Dashboard tools for businesses to manage bookings and staff." },
          ].map((feature, i) => (
            <Card key={i} className="p-6 hover:shadow-md transition">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-medium mt-3">{feature.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials - NEW */}
      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl">What our users say</h2>
            <p className="text-muted-foreground mt-2">Thousands of happy customers and businesses.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah Johnson", role: "Customer", quote: "Bookify saved me so much time! Found a dentist instantly and booked within minutes." },
              { name: "Dr. James Wilson", role: "Dentist", quote: "My practice is fully booked now. The automated reminders have cut no-shows by 60%." },
              { name: "Maria Garcia", role: "Salon Owner", quote: "Managing appointments used to be a nightmare. Bookify made it effortless." },
            ].map((t, i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-1 text-primary mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-primary" />
                  ))}
                </div>
                <p className="text-sm">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - NEW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Businesses", value: "10,000+" },
            { label: "Appointments", value: "500,000+" },
            { label: "Average Rating", value: "4.9/5" },
            { label: "Customer Satisfaction", value: "98%" },
          ].map((stat, i) => (
            <div key={i}>
              <p className="font-display text-3xl md:text-4xl text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For business */}
      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs rounded-full bg-primary/10 text-primary px-3 py-1">
                <TrendingUp className="h-3.5 w-3.5" /> For business owners
              </div>
              <h2 className="mt-4 font-display text-3xl md:text-5xl leading-tight">
                Fill your calendar.<br />Skip the phone.
              </h2>
              <p className="mt-4 text-muted-foreground max-w-md">
                Get discovered by new customers, manage your team, reduce no-shows with deposits and automated reminders — all in one place.
              </p>
              <div className="mt-6 flex gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link to="/for-business">List your business</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link to="/auth">Sign in</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, k: "10k+", v: "Businesses" },
                { icon: CalendarCheck, k: "500k+", v: "Appointments" },
                { icon: Star, k: "4.9", v: "Avg rating" },
                { icon: ShieldCheck, k: "Verified", v: "Businesses only" },
              ].map((s, i) => (
                <Card key={i} className="p-6">
                  <s.icon className="h-5 w-5 text-primary" />
                  <div className="mt-3 font-display text-3xl">{s.k}</div>
                  <div className="text-sm text-muted-foreground">{s.v}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - NEW */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 right-1/3 h-150 w-150 rounded-full bg-primary/15 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-5xl">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mt-3 text-lg">
              Join thousands of businesses and customers already using Bookify.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link to="/auth?mode=signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link to="/explore">Explore Businesses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
export default Landing;