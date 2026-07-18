import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../integrations/supabase/client";

import { SiteHeader, SiteFooter } from "../../components/site-chrome";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

import { toast } from "sonner";

function Admin() {
  const queryClient = useQueryClient();

  const { data: businesses = [], isLoading } = useQuery({
    queryKey: ["admin-businesses"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    },
  });

  const verify = useMutation({
    mutationFn: async ({ id, val }) => {
      const { error } = await supabase
        .from("businesses")
        .update({
          is_verified: val,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      toast.success("Updated");

      queryClient.invalidateQueries({
        queryKey: ["admin-businesses"],
      });
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="font-display text-3xl md:text-4xl">Admin</h1>

        <p className="text-muted-foreground text-sm mt-1">
          Manage businesses and verifications.
        </p>

        <div className="mt-8 space-y-3">
          {businesses.map((b) => (
            <Card
              key={b.id}
              className="p-4 flex items-center justify-between gap-4 flex-wrap"
            >
              <div>
                <div className="font-medium">{b.name}</div>

                <div className="text-xs text-muted-foreground">
                  {b.city || "—"} · {b.slug}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase font-medium px-2.5 py-1 rounded-full ${
                    b.is_verified
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {b.is_verified ? "Verified" : "Pending"}
                </span>

                <Button
                  size="sm"
                  variant={b.is_verified ? "outline" : "default"}
                  disabled={verify.isPending}
                  onClick={() =>
                    verify.mutate({
                      id: b.id,
                      val: !b.is_verified,
                    })
                  }
                >
                  {b.is_verified ? "Unverify" : "Verify"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default Admin;
