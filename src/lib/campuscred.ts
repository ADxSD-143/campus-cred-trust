import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  college: string;
  year: string;
  avatar_url: string | null;
  phone: string | null;
  score: number;
  email: string | null;
};

export type Loan = {
  id: string;
  lender_id: string;
  borrower_id: string;
  amount: number;
  purpose: string;
  due_date: string;
  status: "requested" | "active" | "repaid" | "defaulted" | "cancelled" | "disputed";
  initiator_id: string;
  created_at: string;
  funded_at: string | null;
  repaid_at: string | null;
  notes: string | null;
};

export async function getMyProfile(): Promise<Profile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
  return (data as Profile) ?? null;
}

export async function getMyLoans(): Promise<Loan[]> {
  const { data } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
  return (data as Loan[]) ?? [];
}

export async function getLoan(id: string): Promise<Loan | null> {
  const { data } = await supabase.from("loans").select("*").eq("id", id).maybeSingle();
  return (data as Loan) ?? null;
}

export async function getProfileMap(ids: string[]): Promise<Record<string, Profile>> {
  if (!ids.length) return {};
  const { data } = await supabase.from("profiles").select("*").in("id", Array.from(new Set(ids)));
  const map: Record<string, Profile> = {};
  (data as Profile[] | null)?.forEach((p) => (map[p.id] = p));
  return map;
}

export async function searchProfiles(q: string): Promise<Profile[]> {
  if (!q.trim()) {
    const { data } = await supabase.from("profiles").select("*").order("score", { ascending: false }).limit(20);
    return (data as Profile[]) ?? [];
  }
  const term = `%${q}%`;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .or(`full_name.ilike.${term},college.ilike.${term},email.ilike.${term}`)
    .order("score", { ascending: false })
    .limit(30);
  return (data as Profile[]) ?? [];
}
