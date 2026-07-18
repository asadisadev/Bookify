import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../lib/auth-context"; // Use your existing auth context
import { SiteHeader, SiteFooter } from "../../components/site-chrome";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";
import { appointmentAPI } from "../../lib/api"; // Import the new API

export default function Account() {
  const navigate = useNavigate();
  const { user, loading } = useAuth(); // Use your existing auth context

  // Redirect if not authenticated - keep your existing logic
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Modified query to use backend API instead of Supabase
  const q = useQuery({
    queryKey: ["my-appointments"],
    queryFn: async () => {
      if (!user) return [];
      
      // Call your backend API
      const response = await appointmentAPI.getMyAppointments();
      return response.appointments || [];
    },
    enabled: !!user, // Only run if user exists
  });

  // Rest of your component stays exactly the same
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl md:text-4xl">
          Your Appointments
        </h1>

        <p className="text-muted-foreground mt-1 text-sm">
          Manage upcoming and past bookings.
        </p>

        <div className="mt-8 space-y-3">
          {q.isLoading && (
            <p className="text-muted-foreground">Loading...</p>
          )}

          {q.data?.length === 0 && (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">
                No bookings yet.
              </p>

              <Button asChild className="mt-4 rounded-full">
                <Link to="/explore">
                  Discover Businesses
                </Link>
              </Button>
            </Card>
          )}

          {q.data?.map((a) => {
            // Handle both backend and Supabase data structures
            const biz = a.businesses || a.organization || a.professional;
            
            // Format the appointment date
            const appointmentDate = a.appointmentDate || a.starts_at;
            
            // Map status from backend to frontend
            const statusMap = {
              'Booked': 'confirmed',
              'CheckedIn': 'confirmed',
              'Completed': 'completed',
              'Cancelled': 'cancelled',
              'NoShow': 'cancelled'
            };
            const displayStatus = statusMap[a.status] || a.status || 'pending';

            return (
              <Card
                key={a._id || a.id}
                className="p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="font-medium">
                    {biz?.name || 'Business'}
                  </div>

                  <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(
                        new Date(appointmentDate),
                        "MMM d, yyyy"
                      )}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(
                        new Date(appointmentDate),
                        "HH:mm"
                      )}
                    </span>
                    
                    {a.tokenNumber && (
                      <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-xs">
                        Token #{a.tokenNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs uppercase font-medium px-2.5 py-1 rounded-full ${
                      displayStatus === "confirmed"
                        ? "bg-primary/10 text-primary"
                        : displayStatus === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : displayStatus === "completed"
                        ? "bg-muted text-muted-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {displayStatus}
                  </span>

                  {biz?.slug && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/b/${biz.slug}`}>
                        View
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}