import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score-ring";
import { searchProfiles, type Profile } from "@/lib/campuscred";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const searchSchema = z.object({ with: z.string().optional() });

export const Route = createFileRoute("/_authenticated/loans/new")({
  ssr: false,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "New loan — CampusCred" }] }),
  component: NewLoanPage,
});

function NewLoanPage() {
  const navigate = useNavigate();
  const { with: prefillId } = Route.useSearch();
  const [me, setMe] = useState<string | null>(null);
  const [role, setRole] = useState<"lender" | "borrower">("lender");
  const [counterparty, setCounterparty] = useState<Profile | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);
  useEffect(() => {
    if (prefillId) {
      supabase.from("profiles").select("*").eq("id", prefillId).maybeSingle().then(({ data }) => {
        if (data) setCounterparty(data as Profile);
      });
    }
  }, [prefillId]);
  useEffect(() => {
    if (counterparty) return;
    const t = setTimeout(() => { searchProfiles(query).then(setResults); }, 200);
    return () => clearTimeout(t);
  }, [query, counterparty]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !counterparty) { toast.error("Pick a student"); return; }
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!dueDate) { toast.error("Pick a due date"); return; }
    setBusy(true);
    const lender_id = role === "lender" ? me : counterparty.id;
    const borrower_id = role === "lender" ? counterparty.id : me;
    const { data, error } = await supabase.from("loans").insert({
      lender_id, borrower_id, amount: amt, purpose: purpose.slice(0, 240), due_date: dueDate,
      status: "requested", initiator_id: me,
    }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Loan request created");
    navigate({ to: "/loans/$loanId", params: { loanId: data.id } });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create a loan request</h1>
        <p className="mt-1 text-sm text-muted-foreground">Both parties confirm the loan in the next screen.</p>

        <form onSubmit={submit} className="mt-6 space-y-6">
          {/* Role */}
          <div className="glass-card p-2">
            <div className="grid grid-cols-2 gap-1">
              {([
                { v: "lender", label: "I'm lending", icon: ArrowUpRight },
                { v: "borrower", label: "I'm borrowing", icon: ArrowDownLeft },
              ] as const).map(({ v, label, icon: Icon }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRole(v)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${role===v ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Counterparty */}
          <div className="space-y-2">
            <Label>{role === "lender" ? "Borrower" : "Lender"}</Label>
            {counterparty ? (
              <div className="glass-card flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {counterparty.full_name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{counterparty.full_name}</div>
                    <div className="text-xs text-muted-foreground">{counterparty.college} • Score {Math.round(Number(counterparty.score))}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setCounterparty(null)} className="text-xs text-muted-foreground hover:text-foreground">Change</button>
              </div>
            ) : (
              <>
                <Input placeholder="Search by name, college, email…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <div className="max-h-64 overflow-auto rounded-xl border border-border">
                  {results.filter(p => p.id !== me).slice(0, 8).map((p) => (
                    <button key={p.id} type="button" onClick={() => setCounterparty(p)} className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-3 py-2.5 text-left last:border-0 hover:bg-secondary">
                      <div>
                        <div className="text-sm font-medium">{p.full_name}</div>
                        <div className="text-xs text-muted-foreground">{p.college}</div>
                      </div>
                      <span className="numeric text-xs text-muted-foreground">{Math.round(Number(p.score))}</span>
                    </button>
                  ))}
                  {results.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground">No matches</div>}
                </div>
              </>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" min={1} step={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="numeric text-lg" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due">Due date</Label>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Books for the semester, mess fees, weekend trip…" maxLength={240} />
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Creating…" : "Create loan request"}
          </Button>
        </form>
      </div>

      {/* Preview */}
      <aside className="glass-card sticky top-24 h-fit p-6">
        <div className="chip">Preview</div>
        <h3 className="mt-3 text-lg font-semibold">{role === "lender" ? "You lend" : "You borrow"} {amount ? `₹${Number(amount).toLocaleString()}` : "—"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{counterparty ? `${role==='lender'?'to':'from'} ${counterparty.full_name}` : "Pick a student"}</p>
        {counterparty && (
          <div className="mt-6 flex items-center gap-4">
            <ScoreRing score={Number(counterparty.score)} size={110} />
            <div className="text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{counterparty.full_name}</div>
              <div>{counterparty.college || "—"}</div>
              <div className="mt-2">Due {dueDate || "—"}</div>
            </div>
          </div>
        )}
        <div className="mt-6 rounded-xl bg-surface p-4 text-xs text-muted-foreground">
          Trust is earned slowly and lost quickly. Both parties must agree before the loan goes active.
        </div>
      </aside>
    </div>
  );
}
