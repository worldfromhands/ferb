import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Users, Sparkles, Send, History } from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";

interface Take { agentId: string; name: string; avatar: string; opinion: string }
interface CouncilResult {
  id: string; question: string; takes: Take[]; synthesis: string; createdAt: string;
}

export function Concilio({ onBack }: { onBack: () => void }) {
  const qc = useQueryClient();
  const [question, setQuestion] = useState("");
  const [result, setResult]     = useState<CouncilResult | null>(null);

  const { data: history } = useQuery<CouncilResult[]>({
    queryKey: ["concilios"],
    queryFn: async () => {
      const r = await fetch("/api/mvp/concilios/kyan");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
  });

  const run = useMutation({
    mutationFn: async (q: string) => {
      const r = await fetch("/api/mvp/concilio/kyan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<CouncilResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["concilios"] });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || run.isPending) return;
    setResult(null);
    run.mutate(q);
  }

  return (
    <Shell>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-text-dim hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Voltar à Agência
      </button>

      <section className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Users size={20} className="text-primary" />
          <p className="text-text-dim text-sm uppercase tracking-[0.18em]">Concílio</p>
        </div>
        <h1 className="text-white">Reúna a agência inteira</h1>
        <p className="text-text-dim text-[15px] mt-2">
          Faça uma pergunta e os 8 especialistas dão seu parecer. O Gerente fecha com a síntese.
        </p>
      </section>

      {/* Pergunta */}
      <GlassCard className="mb-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ex: Devo lançar um EP agora ou focar numa turnê regional?"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-text-dim outline-none focus:border-primary/50 transition-colors resize-none"
          />
          <button
            type="submit"
            disabled={!question.trim() || run.isPending}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-5 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-40 self-start"
          >
            {run.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            {run.isPending ? "Concílio em sessão…" : "Reunir o Concílio"}
          </button>
        </form>
      </GlassCard>

      {/* Estado de processamento */}
      {run.isPending && (
        <GlassCard className="text-center py-10 mb-6">
          <Loader2 size={26} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-white text-[15px]">Os 8 especialistas estão analisando…</p>
          <p className="text-text-dim text-[13px] mt-1">Isso leva cerca de 40 segundos.</p>
        </GlassCard>
      )}

      {run.isError && (
        <GlassCard className="mb-6 text-center py-6">
          <p className="text-white">O concílio não pôde ser reunido agora. Tente novamente.</p>
        </GlassCard>
      )}

      {/* Resultado */}
      {result && !run.isPending && <CouncilView c={result} />}

      {/* Histórico */}
      {history && history.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <History size={16} className="text-text-dim" />
            <h2 className="text-white text-[15px] font-semibold">Concílios anteriores</h2>
          </div>
          <div className="space-y-2">
            {history.filter(h => h.id !== result?.id).map(h => (
              <button
                key={h.id}
                onClick={() => setResult(h)}
                className="w-full text-left glass rounded-xl px-4 py-3 hover:glass-hover transition-colors"
              >
                <p className="text-white text-[14px]">{h.question}</p>
                <p className="text-text-dim text-[12px] mt-0.5">
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

function CouncilView({ c }: { c: CouncilResult }) {
  return (
    <div>
      {/* Questão */}
      <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-2">Questão</p>
      <p className="text-white text-[17px] mb-6">{c.question}</p>

      {/* Síntese do Gerente — destaque */}
      <GlassCard className="mb-6 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <h2 className="text-white text-[16px] font-semibold">Síntese do Gerente</h2>
        </div>
        <p className="text-white/90 text-[15px] leading-relaxed whitespace-pre-line">{c.synthesis}</p>
      </GlassCard>

      {/* Pareceres */}
      <p className="text-text-dim text-xs uppercase tracking-[0.18em] mb-3">Pareceres dos especialistas</p>
      <div className="grid md:grid-cols-2 gap-3">
        {c.takes.map(t => (
          <GlassCard key={t.agentId} className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{t.avatar}</span>
              <span className="text-white text-[14px] font-medium">{t.name}</span>
            </div>
            <p className="text-white/80 text-[14px] leading-relaxed">{t.opinion}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
