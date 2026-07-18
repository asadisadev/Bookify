import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";

import { SiteHeader, SiteFooter } from "../components/site-chrome";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";

import { Star, MapPin, Search } from "lucide-react";
import { useState } from "react";

function Explore() {
  const [searchParams] = useSearchParams();

  const initialQ = searchParams.get("q") || "";

  const [q, setQ] = useState(initialQ);

  const listQ = useQuery({
    queryKey: ["explore", q],

    queryFn: async () => {
      let query = supabase
        .from("businesses")
        .select(
          "id, name, slug, description, banner_url, city, country, rating_avg, rating_count, business_categories(name)",
        )
        .eq("status", "approved")
        .order("rating_avg", { ascending: false })
        .limit(48);

      if (q.trim()) {
        query = query.or(
          `name.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="font-display text-4xl">Explore</h1>

          <div className="mt-4 max-w-xl flex items-center gap-2 border border-border rounded-2xl p-1 bg-card">
            <Search className="h-4 w-4 text-muted-foreground ml-3" />

            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, city, or service…"
              className="border-0 bg-transparent focus-visible:ring-0 shadow-none"
            />
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listQ.isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="p-6 animate-pulse h-56 bg-muted/40" />
              ))}

            {listQ.data?.map((b) => (
              <Link key={b.id} to={`/b/${b.slug}`}>
                <Card className="overflow-hidden hover:ring-1 hover:ring-primary/40 transition h-full">
                  <div className="aspect-video bg-muted">
                    {b.banner_url ? (
                      <img
                        src={b.banner_url}
                        alt={b.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5" />
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium">{b.name}</h3>

                      <span className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-primary text-primary" />

                        {Number(b.rating_avg || 0).toFixed(1)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />

                      {[b.city, b.country].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}

            {listQ.data && listQ.data.length === 0 && (
              <Card className="p-10 text-center col-span-full">
                <p className="text-muted-foreground">
                  No matches. Try a different search.
                </p>
              </Card>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Explore;
