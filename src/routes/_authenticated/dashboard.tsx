import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyLoans, getMyProfile, getProfileMap, type Loan, type Profile } from "@/lib/campuscred";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { ScoreRing } from "@/components/score-ring";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Copy,
  HandCoins,
  IdCard,
  Plus,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { scoreTier } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — CampusCred" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const profileQ = useQuery({ queryKey: ["me"], queryFn: getMyProfile });
  const loansQ = useQuery({ queryKey: ["loans"], queryFn: getMyLoans });
  const profilesQ = useQuery({
    queryKey: ["profileMap", loansQ.data?.map((l) => l.id).join(",")],
    enabled: !!loansQ.data,
    queryFn: () => getProfileMap((loansQ.data ?? []).flatMap((l) => [l.lender_id, l.borrower_id])),
  });

  const loans = loansQ.data ?? [];
  const profile = profileQ.data;
  const profiles = profilesQ.data ?? {};

  const given = loans.filter((l) => l.lender_id === userId);
  const taken = loans.filter((l) => l.borrower_id === userId);
  const active = loans.filter((l) => l.status === "active" || l.status === "requested");

  const totalGiven = given.filter((l) => l.status === "active").reduce((s, l) => s + Number(l.amount), 0);
  const totalOwed = taken.filter((l) => l.status === "active").reduce((s, l) => s + Number(l.amount), 0);

  const score = Number(profile?.score ?? 50);
  const tier = scoreTier(score);

  const recentLoans = [...loans].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 5);
  const recentRepayments = loans
    .filter((l) => l.status === "repaid")
    .sort((a, b) => +new Date(b.repaid_at || b.created_at) - +new Date(a.repaid_at || a.created_at))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Hello, {profile?.full_name?.split(" ")[0] || "there"}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Your campus credit, at a glance</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {profile?.campuscred_id && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(profile.campuscred_id);
                toast.success("CampusCred ID copied");
              }}
              className="glass-card group flex items-center gap-2 px-3 py-2 text-xs"
              title="Click to copy"
            >
              <IdCard className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Your ID</span>
              <span className="numeric font-semibold tracking-wider">{profile.campuscred_id}</span>
              <Copy className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}
          <Link
            to="/loans/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Plus className="h-4 w-4" /> New loan
          </Link>
        </div>
      </div>

      {/* Score Card */}
      <div className="glass-card relative overflow-hidden p-6" style={{ background: "var(--gradient-card)" }}>
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.85 0.16 155 / 0.25), transparent 70%)" }}
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <ScoreRing score={score} size={160} />
          <div className="flex-1">
            <div className="chip">
              <TrendingUp className="h-3 w-3" /> CampusCred Score
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="numeric text-5xl font-semibold tracking-tight">{Math.round(score)}</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: tier.color, background: `color-mix(in oklab, ${tier.color} 12%, transparent)` }}
              >
                {tier.label}
              </span>
            </div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{tier.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-md border border-border/60 px-2 py-1">0–30 Red Flag</span>
              <span className="rounded-md border border-border/60 px-2 py-1">30–50 Risky</span>
              <span className="rounded-md border border-border/60 px-2 py-1">50–70 Neutral</span>
              <span className="rounded-md border border-border/60 px-2 py-1">70–85 Trusted</span>
              <span className="rounded-md border border-border/60 px-2 py-1">85+ Highly Trusted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Loans" value={active.length.toString()} icon={Clock} hint={`${active.filter((l) => l.status === "requested").length} pending`} />
        <StatCard label="Loans Given" value={given.length.toString()} icon={ArrowUpRight} hint={`${given.filter((l) => l.status === "repaid").length} repaid`} accent="success" />
        <StatCard label="Loans Taken" value={taken.length.toString()} icon={ArrowDownLeft} hint={`${taken.filter((l) => l.status === "repaid").length} repaid`} />
        <StatCard label="Outstanding Amount" value={`₹${totalOwed.toLocaleString()}`} icon={Wallet} accent="warning" hint={totalGiven > 0 ? `₹${totalGiven.toLocaleString()} lent out` : undefined} />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/loans/new"
          className="glass-card group flex items-center justify-between p-5 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Create Loan Request</div>
              <div className="text-xs text-muted-foreground">Ask a friend or offer to lend</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>
        <Link
          to="/search"
          className="glass-card group flex items-center justify-between p-5 transition-colors hover:border-primary/30"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold">Search by CampusCred ID</div>
              <div className="text-xs text-muted-foreground">Find someone on campus</div>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ActivityCard
          title="Recent Loans"
          loans={recentLoans}
          userId={userId}
          profiles={profiles}
          emptyLabel="No loans yet"
        />
        <ActivityCard
          title="Recent Repayments"
          loans={recentRepayments}
          userId={userId}
          profiles={profiles}
          emptyLabel="No repayments yet"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  hint?: string;
  accent?: "success" | "warning";
}) {
  const color = accent === "success" ? "var(--success)" : accent === "warning" ? "var(--warning)" : "var(--foreground)";
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="chip">
          <Icon className="h-3 w-3" />
          {label}
        </div>
      </div>
      <div className="numeric mt-3 text-3xl font-semibold" style={{ color }}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ActivityCard({
  title,
  loans,
  userId,
  profiles,
  emptyLabel,
}: {
  title: string;
  loans: Loan[];
  userId: string | null;
  profiles: Record<string, Profile>;
  emptyLabel: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>
        <span className="numeric text-xs text-muted-foreground">{loans.length}</span>
      </div>
      {loans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <ul className="space-y-2">
          {loans.map((l) => {
            const counterpartyId = l.lender_id === userId ? l.borrower_id : l.lender_id;
            const cp = profiles[counterpartyId];
            return (
              <li key={l.id}>
                <Link
                  to="/loans/$loanId"
                  params={{ loanId: l.id }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-surface px-4 py-3 transition-colors hover:border-border"
                >
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
  const map: Record<string, { c: string; bg: string }> = {
    requested: { c: "var(--warning)", bg: "oklch(0.82 0.16 75 / 0.12)" },
    active: { c: "var(--primary)", bg: "oklch(0.85 0.16 155 / 0.12)" },
    repaid: { c: "var(--success)", bg: "oklch(0.78 0.17 155 / 0.12)" },
    defaulted: { c: "var(--destructive)", bg: "oklch(0.65 0.22 25 / 0.12)" },
    cancelled: { c: "var(--muted-foreground)", bg: "oklch(1 0 0 / 0.05)" },
  };
  const s = map[status] ?? { c: "var(--foreground)", bg: "oklch(1 0 0 / 0.05)" };
  return (
    <span
      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: s.c, background: s.bg }}
    >
      {status}
    </span>
  );
}
