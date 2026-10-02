import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Clock, Edit3, Loader2, Plus, Search, Scissors, Sparkles, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Service } from '../types';
import { createService, deleteService, getServices, updateService } from '../services/api/services';
import { cn } from '../utils/cn';

const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';
const previewServices: Service[] = [
  { id: 'service-1', name: 'Escova', price: 55, duration_minutes: 60, category: 'Cabelo', active: true },
  { id: 'service-2', name: 'Corte feminino', price: 70, duration_minutes: 60, category: 'Cabelo', active: true },
  { id: 'service-3', name: 'Hidratação profunda', price: 65, duration_minutes: 60, category: 'Tratamentos', active: true },
  { id: 'service-4', name: 'Coloração', price: 150, duration_minutes: 120, category: 'Cabelo', active: true },
  { id: 'service-5', name: 'Manicure', price: 35, duration_minutes: 60, category: 'Mãos e pés', active: true },
  { id: 'service-6', name: 'Pé e mão', price: 65, duration_minutes: 90, category: 'Mãos e pés', active: true },
  { id: 'service-7', name: 'Spa dos pés', price: 48, duration_minutes: 60, category: 'Mãos e pés', active: false },
];

const blankService: Omit<Service, 'id'> = { name: '', price: 0, duration_minutes: 60, category: 'Cabelo', active: true, price_type: 'fixed' };

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, 'id'>>(blankService);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try { setServices(isPreview ? previewServices : await getServices()); }
      catch (error) { console.error('Erro ao carregar serviços:', error); }
      finally { setLoading(false); }
    };
    void load();
  }, []);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(services.map(item => item.category)))], [services]);
  const filtered = services.filter(item => (category === 'Todos' || item.category === category) && item.name.toLowerCase().includes(search.toLowerCase()));
  const averageTicket = services.length ? services.reduce((sum, item) => sum + Number(item.price), 0) / services.length : 0;

  const openCreate = () => { setSelected(null); setForm(blankService); setDrawerOpen(true); };
  const openEdit = (service: Service) => { setSelected(service); setForm({ name: service.name, price: service.price, duration_minutes: service.duration_minutes, category: service.category, active: service.active, price_type: service.price_type || 'fixed' }); setDrawerOpen(true); };
  const closeDrawer = () => { setDrawerOpen(false); setSelected(null); setForm(blankService); };

  const saveService = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (selected) {
        const updated = isPreview ? { ...selected, ...form } : await updateService(selected.id, form);
        setServices(current => current.map(item => item.id === selected.id ? updated : item));
      } else {
        const created = isPreview ? { ...form, id: `service-${Date.now()}` } : await createService(form);
        setServices(current => [created, ...current]);
      }
      closeDrawer();
    } catch (error) { alert(error instanceof Error ? error.message : 'Não foi possível salvar o serviço.'); }
    finally { setSaving(false); }
  };

  const removeService = async () => {
    if (!selected || !confirm(`Excluir o serviço “${selected.name}”?`)) return;
    setSaving(true);
    try {
      if (!isPreview) await deleteService(selected.id);
      setServices(current => current.filter(item => item.id !== selected.id));
      closeDrawer();
    } catch (error) { alert(error instanceof Error ? error.message : 'Não foi possível excluir o serviço.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-aura-gold" /></div>;

  return (
    <div className="space-y-6">
      <section className="glass-card overflow-hidden border border-aura-charcoal/5">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl"><p className="admin-kicker">Catálogo &amp; experiência</p><h3 className="mt-2 font-serif text-3xl text-aura-charcoal sm:text-4xl">Serviços com clareza.</h3><p className="mt-3 text-sm leading-relaxed text-aura-charcoal/55">Organize valores, duração e disponibilidade do que aparece na agenda e no agendamento online.</p></div>
          <button onClick={openCreate} className="aura-button aura-button-primary flex w-full items-center justify-center gap-2 sm:w-auto"><Plus className="h-4 w-4" /> Novo serviço</button>
        </div>
        <div className="grid border-t border-aura-charcoal/5 bg-aura-charcoal text-white sm:grid-cols-3">
          <div className="p-5 sm:px-8"><p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Serviços ativos</p><p className="mt-1 font-serif text-2xl">{services.filter(item => item.active).length}</p></div>
          <div className="border-white/10 p-5 sm:border-l sm:px-8"><p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Ticket médio</p><p className="mt-1 font-serif text-2xl text-aura-gold">R$ {averageTicket.toFixed(2)}</p></div>
          <div className="border-white/10 p-5 sm:border-l sm:px-8"><p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Categorias</p><p className="mt-1 font-serif text-2xl">{Math.max(categories.length - 1, 0)}</p></div>
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-3xl border border-aura-charcoal/5 bg-white/55 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1 overflow-x-auto rounded-full bg-aura-soft-gray p-1">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={cn('whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all', category === item ? 'bg-aura-charcoal text-white shadow-sm' : 'text-aura-charcoal/40 hover:text-aura-charcoal')}>{item}</button>)}</div>
        <div className="relative w-full lg:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-aura-charcoal/35" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar serviço..." className="w-full rounded-full border border-aura-charcoal/10 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-aura-gold/20" /></div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((service, index) => <motion.button key={service.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} onClick={() => openEdit(service)} className="glass-card group min-h-56 border border-aura-charcoal/5 p-6 text-left transition-all hover:-translate-y-1 hover:border-aura-gold/30 hover:shadow-lg">
          <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-aura-gold/10 text-aura-gold"><Scissors className="h-5 w-5" /></div><span className={cn('rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest', service.active ? 'bg-aura-sage/10 text-aura-sage' : 'bg-aura-soft-gray text-aura-charcoal/40')}>{service.active ? 'Disponível' : 'Pausado'}</span></div>
          <p className="mt-5 text-[9px] font-bold uppercase tracking-widest text-aura-charcoal/40">{service.category}</p><h4 className="mt-1 font-serif text-xl text-aura-charcoal">{service.name}</h4>
          <div className="mt-6 flex items-end justify-between"><p className="font-serif text-2xl text-aura-charcoal">R$ {Number(service.price).toFixed(2)}</p><span className="flex items-center gap-1.5 text-xs text-aura-charcoal/45"><Clock className="h-3.5 w-3.5" /> {service.duration_minutes} min</span></div>
        </motion.button>)}
        {filtered.length === 0 && <div className="glass-card col-span-full flex min-h-60 flex-col items-center justify-center border border-dashed border-aura-charcoal/15 p-8 text-center"><Sparkles className="mb-4 h-8 w-8 text-aura-gold" /><h4 className="font-serif text-xl">Nenhum serviço encontrado.</h4><p className="mt-2 text-sm text-aura-charcoal/45">Ajuste os filtros ou crie um novo serviço.</p></div>}
      </div>

      <AnimatePresence>{drawerOpen && <><motion.button aria-label="Fechar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDrawer} className="fixed inset-0 z-40 bg-aura-charcoal/35 backdrop-blur-sm" /><motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-aura-charcoal/10 bg-aura-cream shadow-2xl">
        <div className="flex items-center justify-between border-b border-aura-charcoal/5 bg-white/60 px-6 py-5"><div><p className="admin-kicker">Catálogo</p><h2 className="mt-1 font-serif text-xl">{selected ? 'Editar serviço' : 'Novo serviço'}</h2></div><button onClick={closeDrawer} className="rounded-full p-2 text-aura-charcoal/40 hover:bg-aura-soft-gray"><X className="h-4 w-4" /></button></div>
        <form onSubmit={saveService} className="flex flex-1 flex-col overflow-y-auto p-6"><div className="flex-1 space-y-5">
          <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/40">Nome</span><input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ex: Corte feminino" className="w-full rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-aura-gold/20" /></label>
          <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/40">Categoria</span><input required value={form.category} onChange={event => setForm({ ...form, category: event.target.value })} placeholder="Ex: Cabelo" className="w-full rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-aura-gold/20" /></label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/40">Valor (R$)</span><input required min="0" step="0.01" type="number" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} className="w-full rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 outline-none" /></label><label className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/40">Duração</span><select value={form.duration_minutes} onChange={event => setForm({ ...form, duration_minutes: Number(event.target.value) })} className="w-full rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 outline-none"><option value={30}>30 min</option><option value={45}>45 min</option><option value={60}>1 hora</option><option value={90}>1h30</option><option value={120}>2 horas</option><option value={180}>3 horas</option></select></label></div>
          <label className="block space-y-1"><span className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/40">Como exibir o preço</span><select value={form.price_type || 'fixed'} onChange={event => setForm({ ...form, price_type: event.target.value as Service['price_type'] })} className="w-full rounded-xl border border-aura-charcoal/10 bg-white px-4 py-3 outline-none"><option value="fixed">Preço fixo</option><option value="from">A partir de</option><option value="assessment">Sob avaliação</option></select></label>
          <button type="button" onClick={() => setForm({ ...form, active: !form.active })} className="flex w-full items-center justify-between rounded-2xl border border-aura-charcoal/10 bg-white p-4 text-left"><div><p className="text-sm font-bold text-aura-charcoal">Disponível para agendamento</p><p className="mt-1 text-xs text-aura-charcoal/45">Controla a exibição deste serviço no fluxo público.</p></div><span className={cn('relative h-7 w-12 rounded-full transition-colors', form.active ? 'bg-aura-gold' : 'bg-aura-charcoal/15')}><span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform', form.active ? 'translate-x-6' : 'translate-x-1')} /></span></button>
        </div><div className="mt-8 flex flex-col gap-3 border-t border-aura-charcoal/10 pt-5 sm:flex-row">{selected && <button type="button" onClick={removeService} disabled={saving} className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Excluir</button>}<button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-aura-charcoal py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-aura-gold">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : selected ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}{selected ? 'Salvar alterações' : 'Criar serviço'}</button></div></form>
      </motion.aside></>}</AnimatePresence>
    </div>
  );
}
