import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score-ring";
import { findByCampusCredId, type Profile } from "@/lib/campuscred";
import { toast } from "sonner";
import { ArrowUpRight, ArrowDownLeft, IdCard, X } from "lucide-react";

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
  const [idInput, setIdInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
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

  async function lookup() {
    if (!idInput.trim()) return;
    setLookingUp(true);
    const p = await findByCampusCredId(idInput);
    setLookingUp(false);
    if (!p) { toast.error("No student found with that CampusCred ID"); return; }
    if (p.id === me) { toast.error("That's your own ID"); return; }
    setCounterparty(p);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me || !counterparty) { toast.error("Add a student by CampusCred ID"); return; }
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
    toast.success("Loan request sent");
    navigate({ to: "/loans/$loanId", params: { loanId: data.id } });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Create a loan request</h1>
        <p className="mt-1 text-sm text-muted-foreground">The other party confirms in the next screen.</p>

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

          {/* Counterparty via CampusCred ID */}
          <div className="space-y-2">
            <Label>{role === "lender" ? "Borrower's" : "Lender's"} CampusCred ID</Label>
            {counterparty ? (
              <div className="glass-card flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-xs font-semibold">
                    {counterparty.full_name.slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{counterparty.full_name}</div>
                    <div className="numeric text-xs text-muted-foreground">{counterparty.campuscred_id} • Score {Math.round(Number(counterparty.score))}</div>
                  </div>
                </div>
                <button type="button" onClick={() => setCounterparty(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="CCXXXXXX"
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  className="numeric uppercase tracking-wider"
                  maxLength={12}
                />
                <Button type="button" variant="outline" onClick={lookup} disabled={lookingUp || !idInput.trim()}>
                  {lookingUp ? "..." : "Find"}
                </Button>
              </div>
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
        <p className="mt-1 text-sm text-muted-foreground">{counterparty ? `${role==='lender'?'to':'from'} ${counterparty.full_name}` : "Add a student by CampusCred ID"}</p>
        {counterparty && (
          <div className="mt-6 flex items-center gap-4">
            <ScoreRing score={Number(counterparty.score)} size={110} />
            <div className="text-sm text-muted-foreground">
              <div className="font-medium text-foreground">{counterparty.full_name}</div>
              <div className="numeric flex items-center gap-1.5 text-xs"><IdCard className="h-3 w-3" />{counterparty.campuscred_id}</div>
              <div className="mt-2">Due {dueDate || "—"}</div>
            </div>
          </div>
        )}
        <div className="mt-6 rounded-xl bg-surface p-4 text-xs text-muted-foreground">
          Trust is earned slowly and lost quickly. The other party must accept before the loan goes active.
        </div>
      </aside>
    </div>
  );
}
