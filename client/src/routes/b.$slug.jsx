import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../integrations/supabase/client";
import { SiteHeader, SiteFooter } from "../components/site-chrome";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Star, MapPin, Phone, Globe, Calendar } from "lucide-react";

import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { toast } from "sonner";
import { format, addDays, startOfDay } from "date-fns";

// Build available slots
function buildSlots(dayIndex, dateISO, workingHours, durationMin, booked) {
  const wh = workingHours?.find((w) => w.day === dayIndex);

  if (!wh || wh.closed) return [];

  const [oh, om] = wh.open.split(":").map(Number);
  const [ch, cm] = wh.close.split(":").map(Number);

  const start = new Date(dateISO + "T00:00:00");
  start.setHours(oh, om, 0, 0);

  const end = new Date(dateISO + "T00:00:00");
  end.setHours(ch, cm, 0, 0);

  const slots = [];
  const current = new Date(start);

  while (current < end) {
    const iso = current.toISOString();

    if (!booked.has(iso) && current > new Date()) {
      slots.push({
        time: format(current, "HH:mm"),
        iso,
      });
    }

    current.setMinutes(current.getMinutes() + durationMin);
  }

  return slots;
}

function BusinessProfile() {
  const { slug } = useParams();

  const { user } = useAuth();

  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [selectedDay, setSelectedDay] = useState(0);

  const [selectedSlot, setSelectedSlot] = useState(null);

  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const bizQ = useQuery({
    queryKey: ["business", slug],

    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          `
        *,
        business_categories(name),
        services(*),
        reviews(
          id,
          rating,
          comment,
          created_at
        )
      `,
        )
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      return data;
    },
  });

  const day = addDays(startOfDay(new Date()), selectedDay);

  const dateISO = format(day, "yyyy-MM-dd");

  const dayIndex = day.getDay();

  const bookedQ = useQuery({
    queryKey: ["appointments", bizQ.data?.id, dateISO],

    enabled: !!bizQ.data?.id,

    queryFn: async () => {
      const from = new Date(dateISO + "T00:00:00").toISOString();

      const to = new Date(dateISO + "T23:59:59").toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select("starts_at")
        .eq("business_id", bizQ.data.id)
        .gte("starts_at", from)
        .lte("starts_at", to)
        .in("status", ["pending", "confirmed"]);

      if (error) throw error;

      return new Set(
        (data || []).map((a) => new Date(a.starts_at).toISOString()),
      );
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login first");

      if (!selectedSlot || !bizQ.data) throw new Error("Select a slot");

      const service = bizQ.data.services?.find(
        (s) => s.id === selectedServiceId,
      );

      const start = new Date(selectedSlot.iso);

      const end = new Date(start);

      end.setMinutes(
        end.getMinutes() +
          (service?.duration_minutes || bizQ.data.appointment_duration_minutes),
      );

      const { error } = await supabase.from("appointments").insert({
        business_id: bizQ.data.id,

        service_id: service?.id || null,

        customer_id: user.id,

        starts_at: start.toISOString(),

        ends_at: end.toISOString(),

        price: service?.price || 0,

        customer_email: user.email,

        status: "pending",
      });

      if (error) throw error;
    },

    onSuccess: () => {
      toast.success("Booking sent!");

      setSelectedSlot(null);

      queryClient.invalidateQueries({
        queryKey: ["appointments"],
      });

      navigate("/account");
    },

    onError: (e) => toast.error(e.message),
  });

  if (bizQ.isLoading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="p-10 text-center">Loading...</div>
      </div>
    );
  }

  if (!bizQ.data) {
    return (
      <div className="min-h-screen">
        <SiteHeader />

        <div className="grid place-items-center p-10">
          <div className="text-center">
            <h1 className="text-3xl">Business not found</h1>

            <Button asChild className="mt-4">
              <Link to="/explore">Back</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const b = bizQ.data;

  const slots = buildSlots(
    dayIndex,
    dateISO,
    b.working_hours || [],
    b.appointment_duration_minutes,
    bookedQ.data || new Set(),
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="aspect-video bg-muted">
          {b.banner_url && (
            <img
              src={b.banner_url}
              alt={b.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-4xl font-bold">{b.name}</h1>

          <div className="mt-3 flex gap-4 text-sm">
            <span>
              <Star className="inline h-4" />
              {Number(b.rating_avg).toFixed(1)}
            </span>

            <span>
              <MapPin className="inline h-4" />
              {b.city},{b.country}
            </span>

            {b.phone && (
              <span>
                <Phone className="inline h-4" />
                {b.phone}
              </span>
            )}
          </div>

          <Card className="mt-8 p-6">
            <h2 className="font-semibold">Services</h2>

            {b.services?.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedServiceId(s.id)}
                className="block w-full text-left border p-3 mt-2 rounded"
              >
                {s.name}
              </button>
            ))}
          </Card>

          <Card className="mt-8 p-6">
            <h2 className="font-semibold">Book Appointment</h2>

            <div className="grid grid-cols-3 gap-2 mt-4">
              {slots.map((s) => (
                <button
                  key={s.iso}
                  onClick={() => setSelectedSlot(s)}
                  className="border p-2 rounded"
                >
                  {s.time}
                </button>
              ))}
            </div>

            <Button
              className="mt-5 w-full"
              disabled={!selectedSlot}
              onClick={() => book.mutate()}
            >
              {book.isPending ? "Booking..." : "Book"}
            </Button>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default BusinessProfile;
