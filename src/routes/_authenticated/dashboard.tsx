import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyLoans, getMyProfile, getProfileMap, type Loan, type Profile } from "@/lib/campuscred";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ScoreRing } from "@/components/score-ring";
import { ArrowDownLeft, ArrowUpRight, Clock, Plus, TrendingUp, Wallet } from "lucide-react";
import { scoreTier } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — CampusCred" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, []);

  const profileQ = useQuery({ queryKey: ["me"], queryFn: getMyProfile });
  const loansQ = useQuery({ queryKey: ["loans"], queryFn: getMyLoans });
  const profilesQ = useQuery({
    queryKey: ["profileMap", loansQ.data?.map(l => l.id).join(",")],
    enabled: !!loansQ.data,
    queryFn: () => getProfileMap((loansQ.data ?? []).flatMap(l => [l.lender_id, l.borrower_id])),
  });

  const loans = loansQ.data ?? [];
  const profile = profileQ.data;
  const profiles = profilesQ.data ?? {};

  const given = loans.filter(l => l.lender_id === userId);
  const taken = loans.filter(l => l.borrower_id === userId);
  const active = loans.filter(l => l.status === "active" || l.status === "requested");

  const totalGiven = given.filter(l => l.status === "active").reduce((s, l) => s + Number(l.amount), 0);
  const totalOwed = taken.filter(l => l.status === "active").reduce((s, l) => s + Number(l.amount), 0);

  const score = Number(profile?.score ?? 50);
  const tier = scoreTier(score);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hello {profile?.full_name?.split(" ")[0] || "there"}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Your campus credit, at a glance</h1>
        </div>
        <Link to="/loans/new" className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] sm:inline-flex">
          <Plus className="h-4 w-4" /> New loan
        </Link>
      </div>

      {/* Hero score + KPIs */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="glass-card relative overflow-hidden p-6 lg:col-span-1" style={{ background: "var(--gradient-card)" }}>
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle, oklch(0.85 0.16 155 / 0.25), transparent 70%)" }} />
          <div className="relative flex items-center gap-5">
            <ScoreRing score={score} size={140} />
            <div>
              <div className="chip"><TrendingUp className="h-3 w-3" /> CampusCred Score</div>
              <div className="mt-3 text-sm text-muted-foreground">{tier.description}</div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>0–30 <span className="text-foreground/80">Red Flag</span></div>
                <div>30–50 <span className="text-foreground/80">Risky</span></div>
                <div>50–70 <span className="text-foreground/80">Neutral</span></div>
                <div>70–85 <span className="text-foreground/80">Trusted</span></div>
                <div>85+ <span className="text-foreground/80">Highly Trusted</span></div>
              </div>
            </div>
          </div>
        </div>

        <KPI label="Active loans" value={active.length.toString()} icon={Clock} hint={`${active.filter(l => l.status==='requested').length} pending`} />
        <KPI label="Lent out (active)" value={`₹${totalGiven.toLocaleString()}`} icon={ArrowUpRight} accent="success" hint={`${given.length} given total`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <KPI label="Currently owed" value={`₹${totalOwed.toLocaleString()}`} icon={Wallet} accent="warning" hint={`${taken.length} taken total`} />
        <KPI label="Loans given" value={given.length.toString()} icon={ArrowUpRight} hint={`${given.filter(l=>l.status==='repaid').length} repaid`} />
        <KPI label="Loans taken" value={taken.length.toString()} icon={ArrowDownLeft} hint={`${taken.filter(l=>l.status==='repaid').length} repaid`} />
      </div>

      {/* Loan lists */}
      <div className="grid gap-5 lg:grid-cols-2">
        <LoanList title="Loans you gave" loans={given} userId={userId} profiles={profiles} emptyHref="/search" emptyLabel="Find someone to lend to" />
        <LoanList title="Loans you took" loans={taken} userId={userId} profiles={profiles} emptyHref="/loans/new" emptyLabel="Request a loan" />
      </div>
    </div>
  );
}

function KPI({ label, value, icon: Icon, hint, accent }: { label: string; value: string; icon: any; hint?: string; accent?: "success"|"warning" }) {
  const color = accent === "success" ? "var(--success)" : accent === "warning" ? "var(--warning)" : "var(--foreground)";
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="chip"><Icon className="h-3 w-3" />{label}</div>
      </div>
      <div className="numeric mt-3 text-3xl font-semibold" style={{ color }}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function LoanList({ title, loans, userId, profiles, emptyHref, emptyLabel }: {
  title: string; loans: Loan[]; userId: string | null; profiles: Record<string, Profile>; emptyHref: string; emptyLabel: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
        <span className="numeric text-xs text-muted-foreground">{loans.length}</span>
      </div>
      {loans.length === 0 ? (
        <Link to={emptyHref} className="block rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
          {emptyLabel} →
        </Link>
      ) : (
        <ul className="space-y-2">
          {loans.slice(0, 6).map((l) => {
            const counterpartyId = l.lender_id === userId ? l.borrower_id : l.lender_id;
            const cp = profiles[counterpartyId];
            return (
              <li key={l.id}>
                <Link to="/loans/$loanId" params={{ loanId: l.id }} className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-surface px-4 py-3 transition-colors hover:border-border">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold">
                      {(cp?.full_name ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{cp?.full_name ?? "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{l.purpose || "No purpose"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="numeric text-sm font-semibold">₹{Number(l.amount).toLocaleString()}</div>
                    <StatusBadge status={l.status} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: Loan["status"] }) {
  const map: Record<Loan["status"], { c: string; bg: string }> = {
    requested: { c: "var(--warning)", bg: "oklch(0.82 0.16 75 / 0.12)" },
    active:    { c: "var(--primary)", bg: "oklch(0.85 0.16 155 / 0.12)" },
    repaid:    { c: "var(--success)", bg: "oklch(0.78 0.17 155 / 0.12)" },
    defaulted: { c: "var(--destructive)", bg: "oklch(0.65 0.22 25 / 0.12)" },
    cancelled: { c: "var(--muted-foreground)", bg: "oklch(1 0 0 / 0.05)" },
    disputed:  { c: "var(--destructive)", bg: "oklch(0.65 0.22 25 / 0.12)" },
  };
  const s = map[status];
  return <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: s.c, background: s.bg }}>{status}</span>;
}
