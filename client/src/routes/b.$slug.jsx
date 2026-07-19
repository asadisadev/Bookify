import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  // Fix: Remove TypeScript type assertion
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Fetch business data from backend
  const bizQ = useQuery({
    queryKey: ["business", slug],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/business/${slug}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business');
      }

      const data = await response.json();
      return data.business;
    },
  });

  const day = addDays(startOfDay(new Date()), selectedDay);
  const dateISO = format(day, "yyyy-MM-dd");
  const dayIndex = day.getDay();

  // Fetch booked appointments from backend
  const bookedQ = useQuery({
    queryKey: ["appointments", bizQ.data?._id, dateISO],
    enabled: !!bizQ.data?._id,
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const from = new Date(dateISO + "T00:00:00").toISOString();
      const to = new Date(dateISO + "T23:59:59").toISOString();

      const response = await fetch(
        `${apiUrl}/appointments/business/${bizQ.data._id}?from=${from}&to=${to}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        return new Set();
      }

      const data = await response.json();
      return new Set(
        (data.appointments || []).map((a) => new Date(a.appointmentDate).toISOString())
      );
    },
  });

  // Book appointment mutation
  const book = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login first");
      if (!selectedSlot || !bizQ.data) throw new Error("Select a slot");

      const token = localStorage.getItem('token');
      if (!token) throw new Error("Please login first");

      const service = bizQ.data.services?.find(
        (s) => s._id === selectedServiceId
      );

      const start = new Date(selectedSlot.iso);
      const end = new Date(start);
      end.setMinutes(
        end.getMinutes() +
          (service?.durationMinutes || bizQ.data.appointmentDuration || 30)
      );

      const appointmentData = {
        professional: bizQ.data._id,
        organization: bizQ.data.organizationId || null,
        appointmentDate: start.toISOString(),
        service: service?.name || null,
        notes: null,
        paymentAmount: service?.price || 0
      };

      const response = await fetch(`${apiUrl}/appointments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Booking failed');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Booking sent!");
      setSelectedSlot(null);
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
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
    b.workingHours || [],
    b.appointmentDuration || 30,
    bookedQ.data || new Set()
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="aspect-video bg-muted">
          {b.bannerUrl && (
            <img
              src={b.bannerUrl}
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
              {Number(b.ratingAvg || 0).toFixed(1)}
            </span>

            <span>
              <MapPin className="inline h-4" />
              {b.city}, {b.country}
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
                key={s._id}
                onClick={() => setSelectedServiceId(s._id)}
                className={`block w-full text-left border p-3 mt-2 rounded transition ${
                  selectedServiceId === s._id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{s.name}</span>
                  <span className="text-sm text-muted-foreground">
                    ${s.price} · {s.durationMinutes}min
                  </span>
                </div>
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
                  className={`border p-2 rounded transition ${
                    selectedSlot?.iso === s.iso
                      ? "border-primary bg-primary/5"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>

            <Button
              className="mt-5 w-full"
              disabled={!selectedSlot || book.isPending}
              onClick={() => book.mutate()}
            >
              {book.isPending ? "Booking..." : "Book Appointment"}
            </Button>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default BusinessProfile;