import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../lib/auth-context";

import { SiteHeader, SiteFooter } from "../components/site-chrome";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

import { toast } from "sonner";

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function ForBusiness() {
  const { user, roles, loading } = useAuth();

  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);

  const [categoryId, setCategoryId] = useState("");

  const categoriesQ = useQuery({
    queryKey: ["categories"],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_categories")
        .select("*")
        .order("sort_order");

      if (error) throw error;

      return data;
    },
  });

  const myBizQ = useQuery({
    queryKey: ["my-business", user?.id],

    enabled: !!user?.id,

    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("owner_id", user?.id)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/auth?mode=signup&role=business&next=/for-business");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (myBizQ.data) {
      navigate("/business");
    }
  }, [myBizQ.data, navigate]);

  if (loading || !user) return null;

  const onSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.currentTarget);

    setBusy(true);

    try {
      const name = String(fd.get("name") || "").trim();

      if (!name) {
        throw new Error("Business name is required");
      }

      const baseSlug = slugify(name);

      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const workingHours = Array.from({ length: 7 }, (_, i) => ({
        day: i,
        open: "09:00",
        close: "17:00",
        closed: i === 0,
      }));

      await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "business",
        })
        .select();

      const { error } = await supabase.from("businesses").insert({
        owner_id: user.id,

        category_id: categoryId || null,

        name,

        slug,

        description: String(fd.get("description") || ""),

        email: String(fd.get("email") || ""),

        phone: String(fd.get("phone") || ""),

        website: String(fd.get("website") || ""),

        country: String(fd.get("country") || ""),

        city: String(fd.get("city") || ""),

        address: String(fd.get("address") || ""),

        appointment_duration_minutes: Number(fd.get("duration") || 30),

        deposit_amount: Number(fd.get("deposit") || 0),

        currency: String(fd.get("currency") || "USD"),

        working_hours: workingHours,

        status: "pending",
      });

      if (error) throw error;

      toast.success("Business submitted — awaiting admin approval.");

      navigate("/business");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create business",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl">
              List your business on Bookify
            </h1>

            <p className="text-muted-foreground mt-2">
              Fill in a few details. You can add gallery, services, and staff
              later.
            </p>
          </div>

          <Card className="p-6 md:p-8">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Business name *</Label>

                  <Input id="name" name="name" required />
                </div>

                <div>
                  <Label>Category</Label>

                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>

                    <SelectContent>
                      {categoriesQ.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>

                <Textarea id="description" name="description" rows={4} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>

                  <Input name="email" type="email" />
                </div>

                <div>
                  <Label>Phone</Label>

                  <Input name="phone" />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="submit" disabled={busy} className="rounded-full">
                  {busy ? "Submitting..." : "Submit for review"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-full"
                >
                  <Link to="/">Cancel</Link>
                </Button>
              </div>
            </form>
          </Card>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default ForBusiness;
