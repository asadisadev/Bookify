import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "../../components/site-chrome";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";

function BusinessDash() {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch business data from backend
  const bizQ = useQuery({
    queryKey: ["my-business"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Please login first");
      }

      const response = await fetch(`${apiUrl}/business/my-business`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch business');
      }

      const data = await response.json();
      return data.business;
    },
  });

  // Fetch appointments for this business
  const apptsQ = useQuery({
    queryKey: ["biz-appts", bizQ.data?._id],
    enabled: !!bizQ.data?._id,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Please login first");
      }

      const response = await fetch(`${apiUrl}/appointments/business/${bizQ.data._id}?limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      return data.appointments || [];
    },
  });

  if (bizQ.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="p-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!bizQ.data) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 grid place-items-center p-10">
          <Card className="p-8 max-w-md text-center">
            <h1 className="font-display text-2xl">No business yet</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Register your business to start accepting bookings.
            </p>
            <Button asChild className="mt-5 rounded-full">
              <Link to="/for-business">Register business</Link>
            </Button>
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
              Status:{" "}
              <span className={`font-medium ${b.isApproved ? "text-primary" : "text-foreground"}`}>
                {b.isApproved ? "Verified" : "Pending verification"}
              </span>
            </p>
            {b.role && (
              <p className="text-xs text-muted-foreground mt-1">
                Role: <span className="capitalize">{b.role}</span>
              </p>
            )}
          </div>
          <Button asChild variant="outline">
            <Link to={`/b/${b.name.toLowerCase().replace(/\s+/g, '-')}`}>
              View public page
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="text-xs uppercase text-muted-foreground">Total bookings</div>
            <div className="font-display text-3xl mt-1">{apptsQ.data?.length ?? 0}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase text-muted-foreground">Rating</div>
            <div className="font-display text-3xl mt-1">{Number(b.ratingAvg || 0).toFixed(1)}</div>
          </Card>
          <Card className="p-5">
            <div className="text-xs uppercase text-muted-foreground">Reviews</div>
            <div className="font-display text-3xl mt-1">{b.ratingCount || 0}</div>
          </Card>
        </div>

        <h2 className="mt-10 font-medium">Recent appointments</h2>
        <div className="mt-3 space-y-2">
          {apptsQ.isLoading && (
            <p className="text-sm text-muted-foreground">Loading appointments...</p>
          )}
          {apptsQ.data?.length === 0 && !apptsQ.isLoading && (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          )}
          {apptsQ.data?.map((a) => (
            <Card key={a._id || a.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm">
                <div className="font-medium">
                  {a.customer?.name || a.customer?.email || "Customer"}
                </div>
                <div className="text-muted-foreground">
                  {format(new Date(a.appointmentDate || a.starts_at), "MMM d, yyyy · HH:mm")}
                </div>
                {a.tokenNumber && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Token #{a.tokenNumber}
                  </div>
                )}
              </div>
              <span className={`text-xs uppercase font-medium px-2.5 py-1 rounded-full ${
                a.status === "Booked" || a.status === "confirmed"
                  ? "bg-primary/10 text-primary"
                  : a.status === "Completed" || a.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : a.status === "Cancelled" || a.status === "cancelled"
                  ? "bg-red-100 text-red-800"
                  : "bg-secondary text-secondary-foreground"
              }`}>
                {a.status}
              </span>
            </Card>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default BusinessDash;