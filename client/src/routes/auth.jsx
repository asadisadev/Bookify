import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth, primaryRole, dashboardPathForRole } from "../lib/auth-context";
import { SiteHeader } from "../components/site-chrome";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional().default("signin"),
  role: z.enum(["customer", "business"]).optional(),
  next: z.string().optional(),
});

function Auth() {
  const [searchParams] = useSearchParams();

  const search = {
    mode: searchParams.get("mode") || "signin",
    role: searchParams.get("role") || "customer",
    next: searchParams.get("next"),
  };
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const [tab, setTab] = useState(search.mode);
  const [signupRole, setSignupRole] = useState(search.role ?? "customer");
  const [busy, setBusy] = useState(false);

  // Already signed in? redirect to dashboard
  useEffect(() => {
    if (loading) return;
    if (user) {
      const p = primaryRole(roles);
      navigate(search.next ?? dashboardPathForRole(p), {
        replace: true,
      });
    }
  }, [user, roles, loading, navigate, search.next]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const email = String(fd.get("email"));
      const password = String(fd.get("password"));

       const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'https://bookify-production-00ef.up.railway.app/api';
    const loginUrl = `${apiUrl}/auth/login`;

      console.log("🔄 Attempting login for:", email);
      console.log("📡 URL:", `${import.meta.env.VITE_API_URL}/auth/login`);

      const response = await fetch(loginUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      console.log("📡 Response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const text = await response.text();
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error("Server returned HTML. Please check if the server is running correctly.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save JWT token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Signed in successfully");
      
      // Reload to update auth state
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("❌ Login error:", err);
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const email = String(fd.get("email"));
      const password = String(fd.get("password"));
      const full_name = String(fd.get("full_name"));
      
      const backendRole = signupRole === "business" ? "Professional" : "Customer";

      console.log("🔄 Attempting registration for:", email);
      console.log("📡 URL:", `${import.meta.env.VITE_API_URL}/auth/register`);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: full_name,
            email: email,
            password: password,
            role: backendRole,
          }),
        }
      );

      console.log("📡 Response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const text = await response.text();
        console.error("Received HTML instead of JSON:", text.substring(0, 200));
        throw new Error("Server returned HTML instead of JSON.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast.success("Account created successfully! Please sign in.");
      setTab("signin");
      
      // Reset form
      e.currentTarget.reset();
    } catch (err) {
      console.error("❌ Registration error:", err);
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    try {
      toast.info("Google sign-in will be available soon. Please use email for now.");
    } catch (err) {
      toast.error("Google sign-in unavailable. Please use email.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 grid place-items-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="font-display text-4xl">Welcome to Bookify</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Book appointments or grow your business.
            </p>
          </div>
          <Card className="p-6">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                if (v === "signin" || v === "signup") {
                  setTab(v);
                }
              }}
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="si-email">Email</Label>
                    <Input
                      id="si-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="si-password">Password</Label>
                    <Input
                      id="si-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setSignupRole("customer")}
                    className={`rounded-xl border px-3 py-3 text-sm text-left transition ${signupRole === "customer" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="font-medium">I'm a customer</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Book appointments
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupRole("business")}
                    className={`rounded-xl border px-3 py-3 text-sm text-left transition ${signupRole === "business" ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div className="font-medium">I'm a business</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Accept bookings
                    </div>
                  </button>
                </div>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" name="full_name" required />
                  </div>
                  <div>
                    <Label htmlFor="su-email">Email</Label>
                    <Input
                      id="su-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="su-password">Password</Label>
                    <Input
                      id="su-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" /> or{" "}
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogle}
            >
              Continue with Google
            </Button>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-4">
            By continuing you agree to Bookify's{" "}
            <Link to="/" className="underline">
              Terms
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default Auth;