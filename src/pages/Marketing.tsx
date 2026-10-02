import React, { useState, useEffect } from "react";
import {
  getMarketingStats,
  CampaignStats,
  getTargetEmails,
  getTargetCustomers,
  MarketingCustomer,
} from "../services/api/marketing";
import {
  Megaphone,
  Send,
  Users,
  Sparkles,
  MessageSquare,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Phone,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../utils/cn";

const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === "true";

export function Marketing() {
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [campaign, setCampaign] = useState({
    title: "",
    message: "",
    target: "all" as "all" | "vip" | "inactive",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [audienceCustomers, setAudienceCustomers] = useState<MarketingCustomer[]>([]);

  const previewCustomers: MarketingCustomer[] = [
    { id: 'demo-1', name: 'Mariana Souza', phone: '(71) 99921-4408', email: 'mariana.demo@example.com', last_visit: new Date(Date.now() - 6 * 86400000).toISOString(), is_vip: true },
    { id: 'demo-2', name: 'Cláudia Santos', phone: '(71) 98842-1030', email: 'claudia.demo@example.com', last_visit: new Date(Date.now() - 14 * 86400000).toISOString(), is_vip: false },
    { id: 'demo-3', name: 'Rafaela Lima', phone: '(71) 99710-6654', email: 'rafaela.demo@example.com', last_visit: new Date(Date.now() - 3 * 86400000).toISOString(), is_vip: true },
    { id: 'demo-4', name: 'Aline Oliveira', phone: '(71) 99118-3072', last_visit: new Date(Date.now() - 42 * 86400000).toISOString(), is_vip: false },
    { id: 'demo-5', name: 'Daniela Costa', phone: '(71) 98456-7721', last_visit: new Date(Date.now() - 21 * 86400000).toISOString(), is_vip: false },
  ];

  const openAudience = async (target: "all" | "vip" | "inactive") => {
    setCampaign(current => ({ ...current, target }));
    setAudienceOpen(true);
    setAudienceLoading(true);
    try {
      if (isPreview) {
        const cutoff = Date.now() - 30 * 86400000;
        setAudienceCustomers(previewCustomers.filter(customer => target === 'all' || (target === 'vip' ? customer.is_vip : !customer.last_visit || new Date(customer.last_visit).getTime() < cutoff)));
      } else {
        setAudienceCustomers(await getTargetCustomers(target));
      }
    } catch (error) {
      console.error('Erro ao carregar público:', error);
      setAudienceCustomers([]);
    } finally {
      setAudienceLoading(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = isPreview ? { totalCustomers: 186, inactiveCustomers: 34, vipCustomers: 22 } : await getMarketingStats();
        setStats(data);
      } catch (error) {
        console.error("Erro ao carregar marketing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLaunchCampaign = async () => {
    if (!campaign.title || !campaign.message) return;

    setIsSending(true);
    try {
      // Aqui o sistema busca a lista de e-mails/telefones reais do segmento
      const targets = isPreview
        ? Array.from({ length: campaign.target === "vip" ? 22 : campaign.target === "inactive" ? 34 : 186 }, (_, index) => `cliente-${index}@preview.local`)
        : await getTargetEmails(campaign.target);
      console.log(`Disparando campanha para ${targets.length} clientes...`);

      // Simula o delay do envio
      await new Promise((resolve) => setTimeout(resolve, isPreview ? 500 : 2000));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setCampaign({ title: "", message: "", target: "all" });
    } catch (error) {
      alert("Erro ao disparar campanha.");
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-aura-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-aura-charcoal p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-aura-gold/20 blur-3xl" />
        <div className="relative z-10 max-w-2xl">
          <p className="admin-kicker text-aura-gold">Relacionamento</p>
          <h3 className="mt-2 font-serif text-3xl sm:text-4xl">Presença que continua.</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">Crie comunicações relevantes para manter o Studio Modesto próximo das clientes, sem transformar cuidado em propaganda genérica.</p>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-card border border-aura-charcoal/5 p-5 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-aura-gold/10 text-aura-gold">
                <Megaphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-serif italic">Nova Campanha</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">
                  Título da Campanha
                </label>
                <input
                  placeholder="Ex: Promoção de Outono"
                  className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-aura-gold/20 transition-all"
                  value={campaign.title}
                  onChange={(e) =>
                    setCampaign({ ...campaign, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">
                  Mensagem
                </label>
                <textarea
                  placeholder="Escreva a sua mensagem para os clientes..."
                  className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 outline-none h-40 resize-none focus:ring-2 ring-aura-gold/20 transition-all"
                  value={campaign.message}
                  onChange={(e) =>
                    setCampaign({ ...campaign, message: e.target.value })
                  }
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleLaunchCampaign}
                  disabled={isSending || !campaign.title || !campaign.message}
                  className="aura-button aura-button-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Lançar Campanha
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-aura-sage/10 border border-aura-sage text-aura-sage rounded-2xl flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Campanha enviada com sucesso para a fila de processamento!
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-7 bg-aura-gold text-white relative overflow-hidden">
            <Sparkles className="w-8 h-8 mb-4 text-white" />
            <h4 className="text-xl font-serif mb-2">Tom do Studio</h4>
            <p className="text-sm opacity-80 leading-relaxed font-light">
              Fale como quem já conhece a cliente: com proximidade, clareza e um convite direto. Uma boa mensagem lembra o cuidado, não apenas a promoção.
            </p>
          </div>

          <div className="glass-card border border-aura-charcoal/5 p-6 sm:p-8 space-y-6">
            <div><p className="admin-kicker">Segmentação</p><h4 className="mt-1 text-lg font-serif">Público-alvo</h4></div>
            <div className="space-y-3">
              {[
                {
                  id: "all",
                  label: "Todos os Clientes",
                  count: stats?.totalCustomers || 0,
                  icon: Users,
                },
                {
                  id: "inactive",
                  label: "Inativos (+30 dias)",
                  count: stats?.inactiveCustomers || 0,
                  icon: MessageSquare,
                },
                {
                  id: "vip",
                  label: "Clientes VIP",
                  count: stats?.vipCustomers || 0,
                  icon: Sparkles,
                },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => void openAudience(t.id as "all" | "vip" | "inactive")}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                    campaign.target === t.id
                      ? "border-aura-gold bg-aura-gold/5 shadow-sm"
                      : "border-aura-charcoal/5 hover:border-aura-gold/30",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <t.icon
                      className={cn(
                        "w-4 h-4",
                        campaign.target === t.id
                          ? "text-aura-gold"
                          : "text-aura-charcoal/40 group-hover:text-aura-gold",
                      )}
                    />
                    <span className="text-sm font-medium">{t.label}</span>
                  </div>
                  <span className="flex items-center gap-2 text-xs font-bold text-aura-charcoal/40">{t.count}<ChevronRight className="h-4 w-4" /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {audienceOpen && (
          <>
            <motion.button type="button" aria-label="Fechar lista de clientes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAudienceOpen(false)} className="fixed inset-0 z-40 bg-aura-charcoal/35 backdrop-blur-sm" />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-aura-charcoal/10 bg-aura-cream shadow-2xl">
              <div className="flex items-center justify-between border-b border-aura-charcoal/5 bg-white/60 px-6 py-5">
                <div><p className="admin-kicker">Público da campanha</p><h2 className="mt-1 font-serif text-2xl">{campaign.target === 'vip' ? 'Clientes VIP' : campaign.target === 'inactive' ? 'Inativos há mais de 30 dias' : 'Todos os clientes'}</h2></div>
                <button type="button" onClick={() => setAudienceOpen(false)} className="rounded-full p-2 text-aura-charcoal/40 hover:bg-aura-soft-gray"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {audienceLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-aura-gold" /></div> : audienceCustomers.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-aura-charcoal/15 p-8 text-center"><Users className="mb-4 h-8 w-8 text-aura-gold" /><p className="font-serif text-xl">Nenhum cliente neste segmento.</p></div> : <div className="space-y-3">{audienceCustomers.map(customer => <article key={customer.id} className="rounded-2xl border border-aura-charcoal/5 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-aura-soft-gray font-serif text-lg text-aura-gold">{customer.name.charAt(0)}</div><div className="min-w-0"><p className="truncate text-sm font-bold text-aura-charcoal">{customer.name}</p><a href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 text-xs text-aura-charcoal/50 hover:text-aura-gold"><Phone className="h-3 w-3" />{customer.phone}</a></div></div>{customer.is_vip && <span className="rounded-full bg-aura-gold/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-aura-gold">VIP</span>}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-aura-charcoal/5 pt-3 text-[10px] text-aura-charcoal/45"><span>{customer.email || 'Sem e-mail'}</span><span>{customer.last_visit ? `Última visita: ${new Date(customer.last_visit).toLocaleDateString('pt-BR')}` : 'Ainda sem visita registrada'}</span></div></article>)}</div>}
              </div>
              <div className="border-t border-aura-charcoal/10 bg-white/60 p-6"><button type="button" onClick={() => setAudienceOpen(false)} className="aura-button aura-button-primary w-full">Usar este público ({audienceCustomers.length})</button></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
