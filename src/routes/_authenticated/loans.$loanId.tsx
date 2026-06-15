import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getLoan, getProfileMap } from "@/lib/campuscred";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score-ring";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownLeft, Coins } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "./dashboard";

export const Route = createFileRoute("/_authenticated/loans/$loanId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Loan — CampusCred" }] }),
  component: LoanDetailsPage,
});

function LoanDetailsPage() {
  const { loanId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [me, setMe] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  const loanQ = useQuery({ queryKey: ["loan", loanId], queryFn: () => getLoan(loanId) });
  const loan = loanQ.data;
  const partiesQ = useQuery({
    queryKey: ["loanParties", loan?.lender_id, loan?.borrower_id],
    enabled: !!loan,
    queryFn: () => getProfileMap([loan!.lender_id, loan!.borrower_id]),
  });

  if (loanQ.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!loan) return <div className="glass-card p-8 text-center"><p>Loan not found.</p><Link to="/dashboard" className="text-primary">Back to dashboard</Link></div>;

  const profiles = partiesQ.data ?? {};
  const lender = profiles[loan.lender_id];
  const borrower = profiles[loan.borrower_id];
  const iAmLender = me === loan.lender_id;
  const iAmBorrower = me === loan.borrower_id;
  const counterparty = iAmLender ? borrower : lender;

  async function update(patch: Record<string, any>, msg: string) {
    const { error } = await supabase.from("loans").update(patch).eq("id", loanId);
    if (error) { toast.error(error.message); return; }
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ["loan", loanId] });
    qc.invalidateQueries({ queryKey: ["loans"] });
    qc.invalidateQueries({ queryKey: ["me"] });
  }

  const dueDays = Math.ceil((new Date(loan.due_date).getTime() - Date.now()) / 86400000);

  return (
    <div className="space-y-8">
      <button onClick={() => navigate({ to: "/dashboard" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hero */}
      <div className="glass-card relative overflow-hidden p-8" style={{ background: "var(--gradient-card)" }}>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, oklch(0.72 0.18 285 / 0.25), transparent 70%)" }} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={loan.status} />
              <span className="text-xs text-muted-foreground">Created {new Date(loan.created_at).toLocaleDateString()}</span>
            </div>
            <div className="numeric mt-4 text-5xl font-semibold tracking-tight">₹{Number(loan.amount).toLocaleString()}</div>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{loan.purpose || "No purpose specified"}</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Due</div>
            <div className="numeric mt-1 text-2xl font-semibold">{new Date(loan.due_date).toLocaleDateString()}</div>
            <div className={`mt-1 text-xs ${dueDays < 0 ? "text-destructive" : dueDays < 7 ? "text-warning" : "text-muted-foreground"}`}>
              {dueDays < 0 ? `${-dueDays}d overdue` : dueDays === 0 ? "Due today" : `in ${dueDays} days`}
            </div>
          </div>
        </div>
      </div>

      {/* Parties */}
      <div className="grid gap-5 md:grid-cols-2">
        <PartyCard role="Lender" profile={lender} isYou={iAmLender} icon={ArrowUpRight} />
        <PartyCard role="Borrower" profile={borrower} isYou={iAmBorrower} icon={ArrowDownLeft} />
      </div>

      {/* Actions */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {loan.status === "requested" && me !== loan.initiator_id && (
            <>
              <Button onClick={() => update({ status: "active" }, "Loan activated")}><CheckCircle2 className="mr-2 h-4 w-4" />Accept & activate</Button>
              <Button variant="outline" onClick={() => update({ status: "cancelled" }, "Loan declined")}><XCircle className="mr-2 h-4 w-4" />Decline</Button>
            </>
          )}
          {loan.status === "requested" && me === loan.initiator_id && (
            <>
              <p className="text-sm text-muted-foreground">Waiting on {counterparty?.full_name ?? "the other party"} to accept.</p>
              <Button variant="outline" onClick={() => update({ status: "cancelled" }, "Loan cancelled")}><XCircle className="mr-2 h-4 w-4" />Cancel request</Button>
            </>
          )}
          {loan.status === "active" && iAmBorrower && (
            <Button onClick={() => update({ status: "repaid" }, "Marked repaid — score updated")}><Coins className="mr-2 h-4 w-4" />Mark as repaid</Button>
          )}
          {loan.status === "active" && iAmLender && (
            <>
              <Button onClick={() => update({ status: "repaid" }, "Confirmed repayment")}><CheckCircle2 className="mr-2 h-4 w-4" />Confirm repayment</Button>
              <Button variant="outline" onClick={() => update({ status: "defaulted" }, "Marked as defaulted")}>
                <AlertTriangle className="mr-2 h-4 w-4" />Mark defaulted
              </Button>
              <Button variant="outline" onClick={() => update({ status: "disputed" }, "Loan disputed")}>Dispute</Button>
            </>
          )}
          {(loan.status === "repaid" || loan.status === "cancelled" || loan.status === "defaulted") && (
            <p className="text-sm text-muted-foreground">This loan is closed.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PartyCard({ role, profile, isYou, icon: Icon }: { role: string; profile: any; isYou: boolean; icon: any }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div className="chip"><Icon className="h-3 w-3" />{role} {isYou && <span className="text-primary">• You</span>}</div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <ScoreRing score={Number(profile?.score ?? 50)} size={88} />
        <div className="min-w-0">
          <div className="truncate text-base font-semibold">{profile?.full_name ?? "—"}</div>
          <div className="truncate text-xs text-muted-foreground">{profile?.college ?? "—"}</div>
          {profile?.phone && <div className="mt-1 numeric text-xs text-muted-foreground">{profile.phone}</div>}
        </div>
      </div>
    </div>
  );
}
