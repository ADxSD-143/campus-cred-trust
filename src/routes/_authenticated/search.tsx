import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { findByCampusCredId, type Profile } from "@/lib/campuscred";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/score-ring";
import { scoreTier } from "@/lib/auth";
import { Search as SearchIcon, IdCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/search")({
  ssr: false,
  head: () => ({ meta: [{ title: "Find by ID — CampusCred" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Profile | null>(null);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    const p = await findByCampusCredId(q);
    setResult(p);
    setSearched(true);
    setBusy(false);
  }

  const tier = result ? scoreTier(Number(result.score)) : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Find a student</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter a CampusCred ID (e.g. <span className="numeric">CCABC123</span>). Ask your friend for theirs — they'll find it on their dashboard.</p>
      </div>

      <form onSubmit={handleSearch} className="glass-card flex items-center gap-2 p-2 pl-4">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="CCXXXXXX"
          className="numeric border-0 bg-transparent uppercase tracking-wider shadow-none focus-visible:ring-0"
          maxLength={12}
        />
        <Button type="submit" disabled={busy || !q.trim()}>Search</Button>
      </form>

      {searched && !result && (
        <div className="glass-card p-10 text-center text-sm text-muted-foreground">
          No student found with ID <span className="numeric font-semibold">{q.toUpperCase()}</span>.
          <div className="mt-3"><Link to="/dashboard" className="text-primary">Back to dashboard</Link></div>
        </div>
      )}

      {result && tier && (
        <button
          onClick={() => navigate({ to: "/loans/new", search: { with: result.id } })}
          className="glass-card group flex w-full items-center gap-4 p-5 text-left transition-transform hover:-translate-y-0.5"
        >
          <ScoreRing score={Number(result.score)} size={88} />
          <div className="min-w-0 flex-1">
            <div className="chip"><IdCard className="h-3 w-3" /><span className="numeric">{result.campuscred_id}</span></div>
            <div className="mt-2 truncate text-lg font-semibold">{result.full_name || "Unnamed"}</div>
            <div className="truncate text-xs text-muted-foreground">{result.college || "—"} {result.year && `• ${result.year}`}</div>
            <div className="mt-1.5 text-[11px] font-medium" style={{ color: tier.color }}>{tier.label}</div>
          </div>
          <div className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">Create loan →</div>
        </button>
      )}
    </div>
  );
}
