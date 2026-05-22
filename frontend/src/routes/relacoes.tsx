import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Building2, Target, Users } from "lucide-react";
import { Shell } from "@/components/Shell";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/relacoes")({ component: Relacoes });

// ── Types ────────────────────────────────────────────
interface Contact {
  id: string;
  name: string;
  role?: string | null;
  company?: string | null;
  type: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  notes?: string | null;
}
interface Opportunity {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  value?: number | null;
  dueDate?: string | null;
  contact?: { id: string; name: string } | null;
}
interface RelationsData { contacts: Contact[]; opportunities: Opportunity[] }

const API = "/api/relations/kyan";

const CONTACT_TYPES = ["selo", "promoter", "produtor", "marca", "imprensa", "outro"] as const;
const CONTACT_TYPE_LABEL: Record<string, string> = {
  selo: "Selo", promoter: "Promoter", produtor: "Produtor",
  marca: "Marca", imprensa: "Imprensa", outro: "Outro",
};

const OPP_STATUS = ["aberta", "em_negociacao", "ganha", "perdida"] as const;
const OPP_STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta", em_negociacao: "Em negociação", ganha: "Ganha", perdida: "Perdida",
};
const OPP_STATUS_STYLE: Record<string, string> = {
  aberta:        "bg-white/8 text-white/70",
  em_negociacao: "bg-[#8a6d1f]/25 text-[#cda84a]",
  ganha:         "bg-primary/25 text-primary",
  perdida:       "bg-white/8 text-text-dim",
};

// ── Data ─────────────────────────────────────────────
function useRelations() {
  return useQuery<RelationsData>({
    queryKey: ["relations"],
    queryFn: async () => {
      const r = await fetch(API);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    staleTime: 30_000,
  });
}

function fmtBRL(v?: number | null) {
  if (v == null) return null;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

// ── Component ────────────────────────────────────────
function Relacoes() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useRelations();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["relations"] });

  // form de contato
  const [cName, setCName]       = useState("");
  const [cRole, setCRole]       = useState("");
  const [cCompany, setCCompany] = useState("");
  const [cType, setCType]       = useState<string>("outro");

  // form de oportunidade
  const [oTitle, setOTitle]       = useState("");
  const [oValue, setOValue]       = useState("");
  const [oContact, setOContact]   = useState("");

  const createContact = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch(`${API}/contact`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => { setCName(""); setCRole(""); setCCompany(""); setCType("outro"); invalidate(); },
  });
  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${API}/contact/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: invalidate,
  });
  const createOpp = useMutation({
    mutationFn: async (body: object) => {
      const r = await fetch(`${API}/opportunity`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: () => { setOTitle(""); setOValue(""); setOContact(""); invalidate(); },
  });
  const updateOpp = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: object }) => {
      const r = await fetch(`${API}/opportunity/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: invalidate,
  });
  const deleteOpp = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`${API}/opportunity/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    },
    onSuccess: invalidate,
  });

  const contacts      = data?.contacts ?? [];
  const opportunities = data?.opportunities ?? [];

  function handleCreateContact(e: React.FormEvent) {
    e.preventDefault();
    if (!cName.trim()) return;
    createContact.mutate({ name: cName.trim(), role: cRole.trim() || null, company: cCompany.trim() || null, type: cType });
  }
  function handleCreateOpp(e: React.FormEvent) {
    e.preventDefault();
    if (!oTitle.trim()) return;
    createOpp.mutate({ title: oTitle.trim(), value: oValue || null, contactId: oContact || null });
  }

  const inputCls = "bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[15px] text-white placeholder:text-text-dim outline-none focus:border-primary/50 transition-colors";

  return (
    <Shell>
      <section className="mb-8">
        <p className="text-text-dim text-sm uppercase tracking-[0.18em] mb-3">Relações / CRM</p>
        <h1 className="text-white">Sua rede e suas oportunidades</h1>
        <p className="text-text-dim text-[15px] mt-2">
          {contacts.length} contato{contacts.length !== 1 ? "s" : ""} · {opportunities.length} oportunidade{opportunities.length !== 1 ? "s" : ""}
        </p>
      </section>

      {isLoading ? (
        <div className="flex items-center gap-2 text-text-dim text-sm py-16 justify-center">
          <Loader2 size={16} className="animate-spin" /> Carregando…
        </div>
      ) : isError ? (
        <GlassCard className="text-center py-10">
          <p className="text-white mb-4">Não consegui carregar as relações.</p>
          <button onClick={() => refetch()} className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-medium hover:opacity-90">
            Tentar novamente
          </button>
        </GlassCard>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* ─── OPORTUNIDADES ─── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-primary" />
              <h2 className="text-white text-[17px] font-semibold">Oportunidades</h2>
            </div>

            <GlassCard className="mb-4">
              <form onSubmit={handleCreateOpp} className="flex flex-col gap-3">
                <input value={oTitle} onChange={e => setOTitle(e.target.value)} placeholder="Nova oportunidade…" className={inputCls} />
                <div className="flex gap-3">
                  <input value={oValue} onChange={e => setOValue(e.target.value)} placeholder="Valor R$ (opcional)" type="number" className={`${inputCls} flex-1 min-w-0`} />
                  <select value={oContact} onChange={e => setOContact(e.target.value)} className={`${inputCls} flex-1 min-w-0`}>
                    <option value="" className="bg-[#1a1a1a]">Sem contato</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#1a1a1a]">{c.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={!oTitle.trim() || createOpp.isPending}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-[14px] font-medium transition-opacity disabled:opacity-40 hover:opacity-90">
                  {createOpp.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Adicionar oportunidade
                </button>
              </form>
            </GlassCard>

            {opportunities.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-text-dim text-[14px]">Nenhuma oportunidade ainda.</p></GlassCard>
            ) : (
              <div className="space-y-2">
                {opportunities.map(o => (
                  <div key={o.id} className="glass rounded-2xl px-4 py-3.5 group">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[15px]">{o.title}</p>
                        {o.description && <p className="text-text-dim text-[13px] mt-0.5">{o.description}</p>}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {o.contact && (
                            <span className="text-text-dim text-[12px] inline-flex items-center gap-1">
                              <Users size={11} /> {o.contact.name}
                            </span>
                          )}
                          {fmtBRL(o.value) && <span className="text-primary text-[12px] font-medium">{fmtBRL(o.value)}</span>}
                        </div>
                      </div>
                      <button onClick={() => deleteOpp.mutate(o.id)}
                        className="shrink-0 text-text-dim/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <select
                      value={o.status}
                      onChange={e => updateOpp.mutate({ id: o.id, patch: { status: e.target.value } })}
                      className={["mt-2 rounded-full px-2.5 py-1 text-[11px] font-medium border-0 outline-none cursor-pointer", OPP_STATUS_STYLE[o.status] ?? OPP_STATUS_STYLE.aberta].join(" ")}
                    >
                      {OPP_STATUS.map(s => (
                        <option key={s} value={s} className="bg-[#1a1a1a] text-white">{OPP_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ─── CONTATOS ─── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-primary" />
              <h2 className="text-white text-[17px] font-semibold">Contatos</h2>
            </div>

            <GlassCard className="mb-4">
              <form onSubmit={handleCreateContact} className="flex flex-col gap-3">
                <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Nome do contato…" className={inputCls} />
                <div className="flex gap-3">
                  <input value={cRole} onChange={e => setCRole(e.target.value)} placeholder="Função" className={`${inputCls} flex-1 min-w-0`} />
                  <input value={cCompany} onChange={e => setCCompany(e.target.value)} placeholder="Empresa" className={`${inputCls} flex-1 min-w-0`} />
                </div>
                <div className="flex gap-3">
                  <select value={cType} onChange={e => setCType(e.target.value)} className={`${inputCls} flex-1 min-w-0`}>
                    {CONTACT_TYPES.map(t => (
                      <option key={t} value={t} className="bg-[#1a1a1a]">{CONTACT_TYPE_LABEL[t]}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={!cName.trim() || createContact.isPending}
                    className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-[14px] font-medium transition-opacity disabled:opacity-40 hover:opacity-90 flex-1 min-w-0">
                    {createContact.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Adicionar
                  </button>
                </div>
              </form>
            </GlassCard>

            {contacts.length === 0 ? (
              <GlassCard className="text-center py-8"><p className="text-text-dim text-[14px]">Nenhum contato ainda.</p></GlassCard>
            ) : (
              <div className="space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="glass rounded-2xl px-4 py-3.5 flex items-start gap-3 group">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-[15px]">{c.name}</span>
                        <span className="inline-flex items-center rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-dim">
                          {CONTACT_TYPE_LABEL[c.type] ?? c.type}
                        </span>
                      </div>
                      <p className="text-text-dim text-[13px] mt-0.5">
                        {[c.role, c.company, c.city].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {c.notes && <p className="text-text-dim/80 text-[13px] mt-1">{c.notes}</p>}
                    </div>
                    <button onClick={() => deleteContact.mutate(c.id)}
                      className="shrink-0 text-text-dim/50 hover:text-white transition-colors opacity-0 group-hover:opacity-100" title="Excluir">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
}
