import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  campuscred_id: string;
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

export function normalizeCampusCredId(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^CC/, "CC-").replace("CC-", "CC");
}

export async function findByCampusCredId(rawId: string): Promise<Profile | null> {
  const id = rawId.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!id) return null;
  const { data } = await supabase.from("profiles").select("*").eq("campuscred_id", id).maybeSingle();
  return (data as Profile) ?? null;
}
