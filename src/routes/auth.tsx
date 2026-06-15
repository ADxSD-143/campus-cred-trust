import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — CampusCred" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [college, setCollege] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: { full_name: fullName } },
        });
        if (error) throw error;
        // ensure profile fields set
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from("profiles").update({ full_name: fullName, college }).eq("id", userData.user.id);
        }
        toast.success("Account created");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-2">
        {/* Left: brand pitch */}
        <div className="hidden lg:block">
          <div className="chip"><Sparkles className="h-3.5 w-3.5 text-primary" /> Trust, scored.</div>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Trust before<br/>you lend.<br/>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CampusCred.</span>
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            CampusCred turns every loan into a track record. Repay on time, earn trust. Default once, lose it.
          </p>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {[
              { v: "0–100", l: "Trust score" },
              { v: "50", l: "Starting" },
              { v: "85+", l: "Highly trusted" },
            ].map((s) => (
              <div key={s.l} className="glass-card p-4">
                <div className="numeric text-xl font-semibold">{s.v}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: auth card */}
        <div className="glass-card mx-auto w-full max-w-md p-8" style={{ boxShadow: "var(--shadow-glow)" }}>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="text-lg font-semibold tracking-tight">CampusCred</div>
          </div>

          <h2 className="mt-6 text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to manage your campus loans." : "Start building your CampusCred score."}
          </p>




          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={80} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="college">College</Label>
                  <Input id="college" value={college} onChange={(e) => setCollege(e.target.value)} required maxLength={120} />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "New to CampusCred? Create an account" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
