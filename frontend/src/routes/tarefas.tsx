import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Sparkles, Check } from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/tarefas")({ component: Tarefas });

// ── Types ────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  status: string;   // "todo" | "feita"
  priority: string; // "baixa" | "media" | "alta" | "critica"
  ferb: boolean;
  createdAt: string;
  updatedAt: string;
}

const API = "/api/execution/kyan";

const PRIORITIES = ["critica", "alta", "media", "baixa"] as const;
type Priority = (typeof PRIORITIES)[number];

const PRIORITY_LABEL: Record<string, string> = {
  critica: "Crítica", alta: "Alta", media: "Média", baixa: "Baixa",
};
const PRIORITY_STYLE: Record<string, string> = {
  critica: "bg-red-500/15 text-red-400",
  alta:    "bg-amber-500/15 text-amber-400",
  media:   "bg-sky-500/15 text-sky-400",
  baixa:   "bg-white/8 text-text-dim",
};
const PRIORITY_RANK: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

// ── Data ─────────────────────────────────────────────
function useTasks() {
  return useQuery<{ tasks: Task[] }>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const r = await fetch(API);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });
}

// ── Component ────────────────────────────────────────
function Tarefas() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useTasks();

  const [newTitle, setNewTitle]       = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("media");
  const [statusFilter, setStatusFilter]     = useState<"todas" | "todo" | "feita">("todas");
  const [priorityFilter, setPriorityFilter] = useState<"todas" | Priority>("todas");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tasks"] });

  const createTask = useMutation({
    mutationFn: async (body: { title: string; priority: string }) => {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => { setNewTitle(""); setNewPriority("media"); invalidate(); },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Task> }) => {
      const r = await fetch(`${API}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${API}/tasks/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: invalidate,
  });

  const all = data?.tasks ?? [];
  const tasks = all
    .filter(t => statusFilter === "todas" || t.status === statusFilter)
    .filter(t => priorityFilter === "todas" || t.priority === priorityFilter)
    .sort((a, b) => {
      // pendentes antes de feitas, depois por prioridade
      if (a.status !== b.status) return a.status === "feita" ? 1 : -1;
      return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
    });

  const pendentes = all.filter(t => t.status !== "feita").length;
  const feitas    = all.filter(t => t.status === "feita").length;

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    createTask.mutate({ title, priority: newPriority });
  }

  return (
    <Shell>
      <section className="mb-8">
        <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Tarefas / Execução</p>
        <h1 className="text-white">O que precisa ser feito</h1>
        <p className="text-text-dim text-[15px] mt-2">
          {all.length > 0
            ? `${pendentes} pendente${pendentes !== 1 ? "s" : ""} · ${feitas} concluída${feitas !== 1 ? "s" : ""}`
            : "Crie sua primeira tarefa abaixo."}
        </p>
      </section>

      {/* Form de criação */}
      <GlassCard className="mb-6">
        <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nova tarefa…"
            className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[15px] text-white placeholder:text-text-dim outline-none focus:border-primary/50 transition-colors"
          />
          <select
            value={newPriority}
            onChange={e => setNewPriority(e.target.value as Priority)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[14px] text-white outline-none focus:border-primary/50 transition-colors"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p} className="bg-[#1a1a1a]">{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!newTitle.trim() || createTask.isPending}
            className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-[14px] font-medium transition-opacity disabled:opacity-40 hover:opacity-90"
          >
            {createTask.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Adicionar
          </button>
        </form>
      </GlassCard>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {([["todas", "Todas"], ["todo", "Pendentes"], ["feita", "Concluídas"]] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setStatusFilter(v)}
            className={[
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              statusFilter === v ? "bg-white text-black" : "bg-white/8 text-text-dim hover:text-white",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
        <span className="w-px h-5 bg-white/10 mx-1" />
        <button
          onClick={() => setPriorityFilter("todas")}
          className={[
            "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
            priorityFilter === "todas" ? "bg-white text-black" : "bg-white/8 text-text-dim hover:text-white",
          ].join(" ")}
        >
          Toda prioridade
        </button>
        {PRIORITIES.map(p => (
          <button
            key={p}
            onClick={() => setPriorityFilter(p)}
            className={[
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              priorityFilter === p ? "bg-white text-black" : "bg-white/8 text-text-dim hover:text-white",
            ].join(" ")}
          >
            {PRIORITY_LABEL[p]}
          </button>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando tarefas…
        </div>
      ) : isError ? (
        <GlassCard className="text-center py-10">
          <p className="text-white mb-4">Não consegui carregar as tarefas.</p>
          <button onClick={() => refetch()} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </GlassCard>
      ) : tasks.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-text-dim text-[15px]">
            {all.length === 0 ? "Nenhuma tarefa ainda." : "Nenhuma tarefa nesse filtro."}
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => {
            const done = t.status === "feita";
            return (
              <div
                key={t.id}
                className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3 group"
              >
                {/* Checkbox */}
                <button
                  onClick={() => updateTask.mutate({ id: t.id, patch: { status: done ? "todo" : "feita" } })}
                  className={[
                    "shrink-0 h-5 w-5 rounded-md border flex items-center justify-center transition-colors",
                    done ? "bg-primary border-primary" : "border-white/25 hover:border-white/50",
                  ].join(" ")}
                  title={done ? "Marcar como pendente" : "Marcar como concluída"}
                >
                  {done && <Check size={13} className="text-white" />}
                </button>

                {/* Título */}
                <span className={["flex-1 text-[15px]", done ? "text-text-dim line-through" : "text-white"].join(" ")}>
                  {t.title}
                </span>

                {/* Badge FERB */}
                {t.ferb && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary shrink-0">
                    <Sparkles size={10} /> FERB
                  </span>
                )}

                {/* Prioridade */}
                <span className={[
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium shrink-0",
                  PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.baixa,
                ].join(" ")}>
                  {PRIORITY_LABEL[t.priority] ?? t.priority}
                </span>

                {/* Deletar */}
                <button
                  onClick={() => deleteTask.mutate(t.id)}
                  className="shrink-0 text-text-dim/50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  title="Excluir tarefa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
