import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { searchProfiles, type Profile } from "@/lib/campuscred";
import { Input } from "@/components/ui/input";
import { ScoreRing } from "@/components/score-ring";
import { scoreTier } from "@/lib/auth";
import { Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/search")({
  ssr: false,
  head: () => ({ meta: [{ title: "Find people — CampusCred" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);

  useEffect(() => {
    const t = setTimeout(() => { searchProfiles(q).then(setResults); }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = results.filter(p => p.id !== me);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Find a student</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search by name, college, or email. Trust scores are visible to everyone.</p>
      </div>

      <div className="glass-card flex items-center gap-3 p-2 pl-4">
        <SearchIcon className="h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, college, email…"
          className="border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => {
          const tier = scoreTier(Number(p.score));
          return (
            <button
              key={p.id}
              onClick={() => navigate({ to: "/loans/new", search: { with: p.id } })}
              className="glass-card group flex items-center gap-4 p-4 text-left transition-transform hover:-translate-y-0.5"
            >
              <div className="shrink-0">
                <ScoreRing score={Number(p.score)} size={64} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold">{p.full_name || "Unnamed"}</div>
                <div className="truncate text-xs text-muted-foreground">{p.college || "—"} {p.year && `• ${p.year}`}</div>
                <div className="mt-1.5 text-[11px] font-medium" style={{ color: tier.color }}>{tier.label}</div>
              </div>
              <div className="text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">Create loan →</div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-card col-span-full p-10 text-center text-sm text-muted-foreground">
            No students found{q ? ` for "${q}"` : ""}. <Link to="/dashboard" className="text-primary">Back</Link>
          </div>
        )}
      </div>
    </div>
  );
}
