import React, { useState, useEffect } from 'react';
import { getCustomers, getCustomerCRMData, updateCustomer, createCustomer, adjustCustomerLoyaltyPoints, CustomerCRMData } from '../services/api/customers';
import { LOYALTY_REWARD_POINTS, loyaltyProgress } from '../config/loyalty';
import { Customer } from '../types';
import { cn } from '../utils/cn';
import {
  Users, Search, Plus, Loader2, X, MessageCircle, Mail,
  Calendar as CalendarIcon, Clock, Star, TrendingUp, Gift, Heart, Edit3, Save, CheckCircle2, User, Phone, Cake
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- DRAWER COMPONENT ---
function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div key="drawer" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }} className="fixed right-0 top-0 h-full w-full max-w-xl bg-aura-cream shadow-2xl z-50 flex flex-col border-l border-aura-charcoal/10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-aura-charcoal/5 bg-white/50 backdrop-blur-md">
              <h2 className="font-serif text-xl italic">{title}</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-aura-soft-gray transition-colors text-aura-charcoal/40 hover:text-aura-charcoal">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- HELPER DE ANIVERSÁRIO ---
function formatBirthday(dateStr?: string) {
  if (!dateStr) return 'Não informado';
  try {
    let day, month;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      day = parts[2]; month = parts[1];
    } else {
      const parts = dateStr.split('/');
      day = parts[0]; month = parts[1];
    }
    const date = new Date(2024, Number(month) - 1, Number(day));
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  } catch {
    return dateStr;
  }
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Drawer & CRM States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [crmData, setCrmData] = useState<CustomerCRMData | null>(null);
  const [loadingCrm, setLoadingCrm] = useState(false);

  // Edit Mode States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRedeemingReward, setIsRedeemingReward] = useState(false);

  useEffect(() => { fetchCustomers(); }, []);

  useEffect(() => {
    const cleanSearch = search.replace(/\D/g, '');
    setFiltered(
      customers.filter(c => {
        const matchesName = c.name.toLowerCase().includes(search.toLowerCase());
        const cleanPhone = (c.phone || '').replace(/\D/g, '');
        const matchesPhone = cleanPhone && (
          cleanPhone.includes(cleanSearch) || 
          (c.phone && c.phone.includes(search))
        );
        return matchesName || matchesPhone;
      })
    );
  }, [search, customers]);

  const fetchCustomers = async () => {
    if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true') {
      const now = new Date().toISOString();
      setCustomers([
        { id: 'preview-c1', name: 'Mariana Souza', phone: '(71) 99921-4408', email: 'mariana@email.com', birthday: '1991-04-15', notes: 'Prefere horários pela manhã. Cabelo sensível a químicas fortes.', loyalty_points: 82, is_vip: true, total_spent: 1840, last_visit: now, created_at: now },
        { id: 'preview-c2', name: 'Cláudia Santos', phone: '(71) 98842-1030', email: 'claudia@email.com', birthday: '1987-09-22', loyalty_points: 35, is_vip: false, total_spent: 620, created_at: now },
        { id: 'preview-c3', name: 'Rafaela Lima', phone: '(71) 99710-6654', email: 'rafaela@email.com', loyalty_points: 260, is_vip: true, total_spent: 2210, created_at: now },
        { id: 'preview-c4', name: 'Aline Oliveira', phone: '(71) 99118-3072', birthday: '1994-11-08', loyalty_points: 20, is_vip: false, total_spent: 280, created_at: now },
        { id: 'preview-c5', name: 'Daniela Costa', phone: '(71) 98456-7721', email: 'daniela@email.com', loyalty_points: 64, is_vip: false, total_spent: 970, created_at: now },
      ]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleOpenProfile = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditForm(customer); // Inicializa o form com os dados atuais
    setNotes(customer.notes || '');
    setIsEditingProfile(false);
    setCrmData(null);
    setLoadingCrm(true);

    if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true') {
      setCrmData({
        completedHistory: [
          { id: 'preview-history-1', customer_id: customer.id, professional_id: 'preview-ana', customer_name: customer.name, service_name: 'Corte e escova', price: 120, start_time: new Date().toISOString(), end_time: new Date().toISOString(), status: 'completed', is_blocked: false, created_at: new Date().toISOString() },
          { id: 'preview-history-2', customer_id: customer.id, professional_id: 'preview-julia', customer_name: customer.name, service_name: 'Manicure', price: 55, start_time: new Date(Date.now() - 12096e5).toISOString(), end_time: new Date(Date.now() - 12096e5).toISOString(), status: 'completed', is_blocked: false, created_at: new Date().toISOString() },
        ],
        upcomingAppointment: null,
        ltv: customer.total_spent,
        favoriteProfessional: 'Ana Modesto',
      });
      setLoadingCrm(false);
      return;
    }

    try {
      const data = await getCustomerCRMData(customer.id, customer.name);
      setCrmData(data);
    } catch (error) { console.error(error); } finally { setLoadingCrm(false); }
  };

  const handleSaveCustomer = async () => {
    if (!isCreating && !selectedCustomer) return;
    if ((editForm.name || '').trim().length < 2) {
      alert('Informe o nome da cliente.');
      return;
    }
    if ((editForm.phone || '').replace(/\D/g, '').length < 10) {
      alert('Informe um telefone válido com DDD.');
      return;
    }
    setIsSaving(true);
    try {
      const isLocalPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';
      if (isCreating) {
        const payload = {
          name: editForm.name || '',
          phone: editForm.phone || '',
          email: editForm.email || '',
          birthday: editForm.birthday || undefined,
          is_vip: editForm.is_vip || false,
          loyalty_points: 0,
          total_spent: 0,
          notes: notes || ''
        };
        const newCust = isLocalPreview
          ? { ...payload, id: `preview-customer-${Date.now()}`, created_at: new Date().toISOString() }
          : await createCustomer(payload);
        setCustomers(prev => [newCust, ...prev]);
        setSelectedCustomer(newCust);
        setIsCreating(false);
        setIsEditingProfile(false);
      } else if (selectedCustomer) {
        const updates = { ...editForm, birthday: editForm.birthday || undefined, notes };
        if (!isLocalPreview) await updateCustomer(selectedCustomer.id, updates);

        // Atualiza a lista local
        setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, ...updates } : c));
        setSelectedCustomer({ ...selectedCustomer, ...updates } as Customer);
        setIsEditingProfile(false);
      }
    } catch (error) {
      alert("Erro ao salvar cliente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setIsCreating(true);
    setIsEditingProfile(true);
    setEditForm({ name: '', phone: '', email: '', birthday: '', is_vip: false, loyalty_points: 0 });
    setNotes('');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    try {
      if (!(import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true')) {
        await updateCustomer(selectedCustomer.id, { notes });
      }
      setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? { ...c, notes } : c));
      setSelectedCustomer(prev => prev ? { ...prev, notes } : null);
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
    }
  };

  const handleRedeemReward = async () => {
    if (!selectedCustomer || selectedCustomer.loyalty_points < LOYALTY_REWARD_POINTS) return;
    if (!confirm(`Confirmar o resgate de ${LOYALTY_REWARD_POINTS} pontos de ${selectedCustomer.name}?`)) return;

    setIsRedeemingReward(true);
    try {
      if (!(import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true')) {
        await adjustCustomerLoyaltyPoints(selectedCustomer.id, -LOYALTY_REWARD_POINTS);
      }
      const loyaltyPoints = selectedCustomer.loyalty_points - LOYALTY_REWARD_POINTS;
      setCustomers(previous => previous.map(customer => customer.id === selectedCustomer.id ? { ...customer, loyalty_points: loyaltyPoints } : customer));
      setSelectedCustomer(previous => previous ? { ...previous, loyalty_points: loyaltyPoints } : null);
    } catch {
      alert('Não foi possível registrar o resgate. Tente novamente.');
    } finally {
      setIsRedeemingReward(false);
    }
  };

  const whatsappLink = (phone?: string) => {
    const num = phone ? phone.replace(/\D/g, "") : "00000000000";
    return `https://wa.me/55${num}`;
  };

  if (loading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-aura-gold" /></div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="glass-card flex flex-col justify-between gap-6 p-5 sm:p-7 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <p className="admin-kicker">Relacionamento</p>
          <h3 className="font-serif text-3xl font-semibold text-aura-charcoal">Clientes</h3>
          <p className="text-sm text-aura-charcoal/40">{customers.length} clientes registados</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aura-charcoal/40" />
            <input
              placeholder="Buscar por nome ou telemóvel..."
              className="w-full bg-white border border-aura-charcoal/10 rounded-lg pl-10 pr-4 py-3 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="aura-button aura-button-primary flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-aura-charcoal/10"
          >
            <Plus className="w-4 h-4" /> Novo
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((customer, i) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => handleOpenProfile(customer)}
            className="glass-card group flex min-h-[150px] cursor-pointer items-start gap-4 p-5 transition-all hover:-translate-y-1 hover:border-aura-gold/30 hover:shadow-xl sm:p-6"
          >
            <div className="w-12 h-12 rounded-full bg-aura-soft-gray flex items-center justify-center text-aura-charcoal/20 group-hover:text-aura-gold group-hover:bg-aura-gold/10 transition-all shrink-0">
              {customer.is_vip ? <Star className="w-5 h-5 fill-aura-gold text-aura-gold" /> : <Users className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-serif text-lg text-aura-charcoal truncate">{customer.name}</h4>
              <p className="text-xs text-aura-charcoal/50 mt-0.5">{customer.phone || 'Sem contacto'}</p>
              <div className="flex gap-2 mt-3">
                {customer.loyalty_points > 0 && <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-aura-gold/10 text-aura-gold border border-aura-gold/20 flex items-center gap-1"><Gift className="w-3 h-3" /> {customer.loyalty_points} pts</span>}
                {customer.birthday && <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-aura-clay/10 text-aura-clay border border-aura-clay/20">🎂 {formatBirthday(customer.birthday)}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-aura-charcoal/20" />
          <p className="mt-4 font-serif text-xl">Nenhum cliente encontrado</p>
          <p className="mt-1 text-sm text-aura-charcoal/45">Tente outro nome ou telefone.</p>
        </div>
      )}

      {/* CRM DRAWER */}
      <Drawer open={!!selectedCustomer || isCreating} onClose={() => { setSelectedCustomer(null); setIsCreating(false); }} title={isEditingProfile ? (isCreating ? "Novo Cliente" : "Editar Dados do Cliente") : "Perfil do Cliente"}>
        {(selectedCustomer || isCreating) && (
          <div className="space-y-8 pb-10">

            {/* MODO EDIÇÃO VS VISUALIZAÇÃO */}
            {!isEditingProfile && selectedCustomer ? (
              <>
                <div className="text-center space-y-2 relative group">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="absolute top-0 right-0 p-2 bg-white rounded-xl shadow-sm border border-aura-charcoal/5 text-aura-gold hover:bg-aura-gold hover:text-white transition-all"
                    title="Editar Perfil"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="w-20 h-20 mx-auto rounded-full bg-white border border-aura-charcoal/10 shadow-sm flex items-center justify-center text-aura-gold">
                    {selectedCustomer.is_vip ? <Star className="w-10 h-10 fill-aura-gold" /> : <Heart className="w-10 h-10" />}
                  </div>
                  <h3 className="text-2xl font-serif text-aura-charcoal">{selectedCustomer.name}</h3>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-aura-charcoal/60 flex items-center gap-2"><Phone className="w-3 h-3" /> {selectedCustomer.phone || 'Nenhum telemóvel'}</p>
                    <p className="text-xs text-aura-charcoal/60 flex items-center gap-2"><Mail className="w-3 h-3" /> {selectedCustomer.email || 'Nenhum e-mail'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a href={whatsappLink(selectedCustomer.phone)} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 bg-[#25D366]/10 text-[#20b857] rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest border border-[#25D366]/20">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                </div>

                {loadingCrm ? (
                  <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-aura-gold mx-auto" /></div>
                ) : crmData && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white border border-aura-charcoal/5 shadow-sm text-center">
                        <TrendingUp className="w-4 h-4 mx-auto text-aura-sage mb-2" />
                        <p className="text-lg font-serif text-aura-charcoal">R$ {crmData.ltv.toFixed(2)}</p>
                        <p className="text-[9px] text-aura-charcoal/40 uppercase tracking-widest">Total Gasto (LTV)</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white border border-aura-charcoal/5 shadow-sm text-center">
                        <Star className="w-4 h-4 mx-auto text-aura-gold mb-2" />
                        <p className="text-sm font-bold text-aura-charcoal truncate">{crmData.favoriteProfessional}</p>
                        <p className="text-[9px] text-aura-charcoal/40 uppercase tracking-widest mt-1">Prof. Favorito</p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-aura-gold/5 border border-aura-gold/20">
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-xs font-bold text-aura-charcoal uppercase tracking-widest flex items-center gap-2"><Gift className="w-4 h-4 text-aura-gold" /> Fidelidade</p>
                        <span className="text-lg font-serif text-aura-gold">{selectedCustomer.loyalty_points || 0} / {LOYALTY_REWARD_POINTS}</span>
                      </div>
                      <div className="h-2 bg-aura-gold/20 rounded-full overflow-hidden">
                        <div className="h-full bg-aura-gold rounded-full" style={{ width: `${loyaltyProgress(selectedCustomer.loyalty_points || 0)}%` }} />
                      </div>
                      <p className="mt-2 text-[10px] text-aura-charcoal/50">
                        {selectedCustomer.loyalty_points >= LOYALTY_REWARD_POINTS ? 'Recompensa disponível para resgate.' : `Faltam ${LOYALTY_REWARD_POINTS - selectedCustomer.loyalty_points} pontos para a recompensa.`}
                      </p>
                      {selectedCustomer.loyalty_points >= LOYALTY_REWARD_POINTS && (
                        <button type="button" onClick={handleRedeemReward} disabled={isRedeemingReward} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-aura-gold px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-aura-clay disabled:opacity-50">
                          {isRedeemingReward ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />} Resgatar {LOYALTY_REWARD_POINTS} pontos
                        </button>
                      )}
                    </div>

                    {crmData.upcomingAppointment && (
                      <div className="rounded-2xl border border-aura-charcoal/10 bg-white p-5">
                        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/50"><CalendarIcon className="h-4 w-4 text-aura-gold" /> Próximo horário</p>
                        <p className="mt-3 font-serif text-lg text-aura-charcoal">{crmData.upcomingAppointment.service_name || 'Atendimento'}</p>
                        <p className="mt-1 text-xs text-aura-charcoal/55">{format(new Date(crmData.upcomingAppointment.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-aura-charcoal/10 bg-white p-4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-aura-charcoal/40">Alergias e sensibilidades</p>
                        <p className="mt-2 text-xs leading-relaxed text-aura-charcoal/65">{selectedCustomer.technical_file_allergies || 'Nenhuma informação registrada.'}</p>
                      </div>
                      <div className="rounded-2xl border border-aura-charcoal/10 bg-white p-4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-aura-charcoal/40">Fórmulas e observações técnicas</p>
                        <p className="mt-2 text-xs leading-relaxed text-aura-charcoal/65">{selectedCustomer.technical_file_formulas || 'Nenhuma informação registrada.'}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] text-aura-charcoal/60 uppercase tracking-widest font-bold flex items-center gap-2"><Edit3 className="w-3 h-3" /> Notas Privadas</p>
                      <textarea
                        className="w-full h-24 bg-white border border-aura-charcoal/10 rounded-2xl p-4 text-sm outline-none resize-none"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        onBlur={handleSaveNotes} // Salva ao sair do campo
                        placeholder="Clique para adicionar notas..."
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-aura-charcoal/10">
                      <p className="text-lg font-serif italic text-aura-charcoal">Histórico</p>
                      {crmData.completedHistory.map((appt) => (
                        <div key={appt.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-aura-charcoal/5">
                          <CheckCircle2 className="w-5 h-5 text-aura-sage" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{appt.service_name}</p>
                            <p className="text-[10px] text-aura-charcoal/40 uppercase">{format(new Date(appt.start_time), "dd/MM/yyyy")}</p>
                          </div>
                          <span className="text-sm font-bold text-aura-charcoal">R$ {appt.price}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              /* FORMULÁRIO DE EDIÇÃO */
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Nome do Cliente</label>
                    <input className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-aura-gold/20" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">WhatsApp / Telemóvel</label>
                    <input className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">E-mail</label>
                    <input className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Aniversário (DD/MM)</label>
                      <input className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none" value={editForm.birthday} onChange={e => setEditForm({ ...editForm, birthday: e.target.value })} placeholder="Ex: 15/04" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Status VIP</label>
                      <button
                        onClick={() => setEditForm({ ...editForm, is_vip: !editForm.is_vip })}
                        className={cn("w-full py-3 rounded-xl text-xs font-bold transition-all border", editForm.is_vip ? "bg-aura-gold text-white border-aura-gold" : "bg-white text-aura-charcoal/40 border-aura-charcoal/10")}
                      >
                        {editForm.is_vip ? "CLIENTE VIP" : "CLIENTE PADRÃO"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Alergias e sensibilidades</label>
                      <textarea className="h-28 w-full resize-none rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 text-sm outline-none" value={editForm.technical_file_allergies || ''} onChange={e => setEditForm({ ...editForm, technical_file_allergies: e.target.value })} placeholder="Ex: sensibilidade no couro cabeludo" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Fórmulas e observações técnicas</label>
                      <textarea className="h-28 w-full resize-none rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 text-sm outline-none" value={editForm.technical_file_formulas || ''} onChange={e => setEditForm({ ...editForm, technical_file_formulas: e.target.value })} placeholder="Ex: coloração, oxidante e tempo de pausa" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setIsEditingProfile(false); setIsCreating(false); }} className="flex-1 py-4 rounded-2xl bg-aura-soft-gray text-aura-charcoal font-bold text-xs uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleSaveCustomer} disabled={isSaving} className="flex-1 py-4 rounded-2xl bg-aura-charcoal text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isCreating ? "Salvar Cliente" : "Salvar Alterações"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
