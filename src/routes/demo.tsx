import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ScoreRing } from "@/components/score-ring";
import { scoreTier } from "@/lib/auth";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Copy,
  HandCoins,
  Home,
  IdCard,
  Plus,
  Search,
  ShieldCheck,
  TrendingUp,
  User,
  Wallet,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/demo")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — CampusCred" }] }),
  component: DemoDashboard,
});

type DemoLoan = {
  id: string;
  counterparty: string;
  initials: string;
  purpose: string;
  amount: number;
  status: "active" | "requested" | "repaid";
  direction: "given" | "taken";
  date: string;
};

const SAMPLE_PROFILE = {
  full_name: "Aarav Mehta",
  campuscred_id: "CC7K3M9A",
  score: 78,
};

const SAMPLE_LOANS: DemoLoan[] = [
  { id: "1", counterparty: "Priya Sharma", initials: "PS", purpose: "Hostel mess fees", amount: 2500, status: "active", direction: "given", date: "Jun 12" },
  { id: "2", counterparty: "Rohan Iyer", initials: "RI", purpose: "Concert tickets", amount: 1800, status: "active", direction: "taken", date: "Jun 10" },
  { id: "3", counterparty: "Neha Kapoor", initials: "NK", purpose: "Project supplies", amount: 950, status: "requested", direction: "given", date: "Jun 09" },
  { id: "4", counterparty: "Vikram Singh", initials: "VS", purpose: "Cab to airport", amount: 600, status: "repaid", direction: "given", date: "Jun 05" },
  { id: "5", counterparty: "Ananya Rao", initials: "AR", purpose: "Textbook split", amount: 1200, status: "repaid", direction: "taken", date: "Jun 02" },
  { id: "6", counterparty: "Kunal Joshi", initials: "KJ", purpose: "Birthday dinner", amount: 1500, status: "repaid", direction: "given", date: "May 28" },
  { id: "7", counterparty: "Sneha Patel", initials: "SP", purpose: "Lab kit", amount: 3200, status: "active", direction: "given", date: "May 25" },
];

function DemoDashboard() {
  const profile = SAMPLE_PROFILE;
  const loans = SAMPLE_LOANS;

  const given = loans.filter((l) => l.direction === "given");
  const taken = loans.filter((l) => l.direction === "taken");
  const active = loans.filter((l) => l.status === "active" || l.status === "requested");
  const totalOwed = taken.filter((l) => l.status === "active").reduce((s, l) => s + l.amount, 0);
  const totalGiven = given.filter((l) => l.status === "active").reduce((s, l) => s + l.amount, 0);

  const score = profile.score;
  const tier = scoreTier(score);

  const recentLoans = loans.slice(0, 5);
  const recentRepayments = loans.filter((l) => l.status === "repaid").slice(0, 5);

  return (
    <div className="min-h-screen">
      <DemoNav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hello, {profile.full_name.split(" ")[0]}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Your campus credit, at a glance
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                <Plus className="h-4 w-4" /> New loan
              </button>
            </div>
          </div>

          {/* Score Card */}
          <div
            className="glass-card relative overflow-hidden p-6"
            style={{ background: "var(--gradient-card)" }}
          >
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
                  <span className="numeric text-5xl font-semibold tracking-tight">{score}</span>
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
            <StatCard label="Outstanding Amount" value={`₹${totalOwed.toLocaleString()}`} icon={Wallet} accent="warning" hint={`₹${totalGiven.toLocaleString()} lent out`} />
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
            <QuickAction icon={HandCoins} title="Create Loan Request" subtitle="Ask a friend or offer to lend" />
            <QuickAction icon={Search} title="Search by CampusCred ID" subtitle="Find someone on campus" />
          </div>

          {/* Recent Activity */}
          <div className="grid gap-5 lg:grid-cols-2">
            <ActivityCard title="Recent Loans" loans={recentLoans} emptyLabel="No loans yet" />
            <ActivityCard title="Recent Repayments" loans={recentRepayments} emptyLabel="No repayments yet" />
          </div>
        </div>
      </main>
    </div>
  );
}

function DemoNav() {
  const [active, setActive] = useState("Dashboard");
  const items = [
    { label: "Dashboard", icon: Home },
    { label: "Loans", icon: Receipt },
    { label: "Profile", icon: User },
  ];
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">CampusCred</span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.label;
            return (
              <button
                key={n.label}
                onClick={() => setActive(n.label)}
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {n.label}
              </button>
            );
          })}
        </nav>
        <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground">
          Sign in
        </Link>
      </div>
      <nav className="flex items-center justify-around border-t border-border/60 px-2 py-1.5 md:hidden">
        {items.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.label;
          return (
            <button
              key={n.label}
              onClick={() => setActive(n.label)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-[11px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

function QuickAction({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <button
      type="button"
      className="glass-card group flex items-center justify-between p-5 text-left transition-colors hover:border-primary/30"
    >
      <div className="flex items-center gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
    </button>
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
  const color =
    accent === "success" ? "var(--success)" : accent === "warning" ? "var(--warning)" : "var(--foreground)";
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

function ActivityCard({ title, loans, emptyLabel }: { title: string; loans: DemoLoan[]; emptyLabel: string }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        <span className="numeric text-xs text-muted-foreground">{loans.length}</span>
      </div>
      {loans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <ul className="space-y-2">
          {loans.map((l) => (
            <li key={l.id}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-surface px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {l.initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{l.counterparty}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.purpose} · {l.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="numeric text-sm font-semibold">
                    {l.direction === "given" ? "+" : "−"}₹{l.amount.toLocaleString()}
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: DemoLoan["status"] }) {
  const map: Record<string, { c: string; bg: string }> = {
    requested: { c: "var(--warning)", bg: "oklch(0.82 0.16 75 / 0.12)" },
    active: { c: "var(--primary)", bg: "oklch(0.85 0.16 155 / 0.12)" },
    repaid: { c: "var(--success)", bg: "oklch(0.78 0.17 155 / 0.12)" },
  };
  const s = map[status];
  return (
    <span
      className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ color: s.c, background: s.bg }}
    >
      {status}
    </span>
  );
}
