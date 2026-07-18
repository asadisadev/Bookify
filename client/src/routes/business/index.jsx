import {  Link, useNavigate} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../integrations/supabase/client";
import { SiteHeader, SiteFooter } from "../../components/site-chrome";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";


function BusinessDash() {
  const bizQ = useQuery({
    queryKey: ["my-business"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", u.user?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const apptsQ = useQuery({
    queryKey: ["biz-appts", bizQ.data?.id],
    enabled: !!bizQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", bizQ.data?.id)
        .order("starts_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  if (bizQ.isLoading) return <div className="min-h-screen"><SiteHeader /><div className="p-10 text-center">Loading…</div></div>;

  if (!bizQ.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center p-10">
          <Card className="p-8 max-w-md text-center">
            <h1 className="font-display text-2xl">No business yet</h1>
            <p className="text-muted-foreground text-sm mt-2">Register your business to start accepting bookings.</p>
            <Button asChild className="mt-5 rounded-full"><Link to="/for-business">Register business</Link></Button>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const b = bizQ.data;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl">{b.name}</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Status: <span className={`font-medium ${b.is_verified ? "text-primary" : "text-foreground"}`}>{b.is_verified ? "Verified" : "Pending verification"}</span>
            </p>
          </div>
          <Button asChild variant="outline"><Link to="/b/$slug" params={{ slug: b.slug }}>View public page</Link></Button>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Total bookings</div><div className="font-display text-3xl mt-1">{apptsQ.data?.length ?? 0}</div></Card>
          <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Rating</div><div className="font-display text-3xl mt-1">{Number(b.rating_avg).toFixed(1)}</div></Card>
          <Card className="p-5"><div className="text-xs uppercase text-muted-foreground">Reviews</div><div className="font-display text-3xl mt-1">{b.rating_count}</div></Card>
        </div>

        <h2 className="mt-10 font-medium">Recent appointments</h2>
        <div className="mt-3 space-y-2">
          {apptsQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No appointments yet.</p>}
          {apptsQ.data?.map((a) => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm">
                <div className="font-medium">{a.customer_email ?? "Customer"}</div>
                <div className="text-muted-foreground">{format(new Date(a.starts_at), "MMM d, yyyy · HH:mm")}</div>
              </div>
              <span className="text-xs uppercase font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{a.status}</span>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
export default BusinessDash