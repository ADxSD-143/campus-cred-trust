import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}

export type ScoreTier = {
  label: string;
  color: string;
  description: string;
};

export function scoreTier(score: number): ScoreTier {
  if (score >= 85) return { label: "Highly Trusted", color: "var(--success)", description: "Top-tier borrower" };
  if (score >= 70) return { label: "Trusted", color: "var(--primary)", description: "Reliable history" };
  if (score >= 50) return { label: "Neutral", color: "var(--muted-foreground)", description: "Building reputation" };
  if (score >= 30) return { label: "Risky", color: "var(--warning)", description: "Lend with caution" };
  return { label: "Red Flag", color: "var(--destructive)", description: "High risk" };
}
