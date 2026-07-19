import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch categories from backend
  const categoriesQ = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/categories`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      return data.categories || [];
    },
  });

  // Check if user already has a business
  const myBizQ = useQuery({
    queryKey: ["my-business", user?._id],
    enabled: !!user?._id,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/business/my-business`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Please login first");
      }

      const name = String(fd.get("name") || "").trim();
      if (!name) {
        throw new Error("Business name is required");
      }

      const baseSlug = slugify(name);
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

      const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

      const businessData = {
        name: name,
        slug: slug,
        description: String(fd.get("description") || ""),
        email: String(fd.get("email") || ""),
        phone: String(fd.get("phone") || ""),
        website: String(fd.get("website") || ""),
        country: String(fd.get("country") || ""),
        city: String(fd.get("city") || ""),
        address: String(fd.get("address") || ""),
        appointmentDuration: Number(fd.get("duration") || 30),
        depositAmount: Number(fd.get("deposit") || 0),
        currency: String(fd.get("currency") || "USD"),
        workingDays: workingDays,
        workingHours: { start: "09:00", end: "17:00" },
        categoryId: categoryId || null,
        status: "pending"
      };

      const response = await fetch(`${apiUrl}/business`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create business');
      }

      toast.success("Business submitted — awaiting admin approval.");
      navigate("/business");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create business"
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
              Fill in a few details. You can add gallery, services, and staff later.
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
                        <SelectItem key={c._id || c.id} value={c._id || c.id}>
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

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>City</Label>
                  <Input name="city" />
                </div>

                <div>
                  <Label>Country</Label>
                  <Input name="country" />
                </div>

                <div>
                  <Label>Website</Label>
                  <Input name="website" type="url" />
                </div>
              </div>

              <div>
                <Label>Address</Label>
                <Input name="address" />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Appointment Duration (minutes)</Label>
                  <Input name="duration" type="number" defaultValue="30" />
                </div>

                <div>
                  <Label>Deposit Amount</Label>
                  <Input name="deposit" type="number" defaultValue="0" />
                </div>

                <div>
                  <Label>Currency</Label>
                  <Input name="currency" defaultValue="USD" />
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