import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "../../components/site-chrome";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";

function Admin() {
  const queryClient = useQueryClient();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch all businesses/professionals from backend
  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Please login first");
      }

      const response = await fetch(`${apiUrl}/admin/businesses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch businesses');
      }

      const data = await response.json();
      return data.businesses || [];
    },
  });

  // Verify/Unverify business mutation
  const verify = useMutation({
    mutationFn: async ({ id, val }) => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Please login first");
      }

      const response = await fetch(`${apiUrl}/admin/businesses/${id}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isApproved: val })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update business');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Business status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-businesses"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update business");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl md:text-4xl">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage businesses and verifications.
        </p>

        <div className="mt-8 space-y-3">
          {businesses.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">No businesses found.</p>
            </Card>
          ) : (
            businesses.map((b) => (
              <Card
                key={b._id || b.id}
                className="p-4 flex items-center justify-between gap-4 flex-wrap hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.organization || b.city || "—"} · {b.email || "No email"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Role: <span className="capitalize">{b.role || "Professional"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs uppercase font-medium px-2.5 py-1 rounded-full ${
                      b.isApproved
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {b.isApproved ? "Verified" : "Pending"}
                  </span>

                  <Button
                    size="sm"
                    variant={b.isApproved ? "outline" : "default"}
                    disabled={verify.isPending}
                    onClick={() =>
                      verify.mutate({
                        id: b._id || b.id,
                        val: !b.isApproved,
                      })
                    }
                  >
                    {b.isApproved ? "Unverify" : "Verify"}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Admin;