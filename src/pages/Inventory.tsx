import React, { useState, useEffect } from 'react';
import { getInventory, adjustStock, getItemHistory, deleteInventoryItem, createInventoryItem, updateInventoryItem, InventoryItem, InventoryMovement } from '../services/api/inventory';
import { cn } from '../utils/cn';
import { 
  Package, Search, Plus, Loader2, X, AlertTriangle, 
  TrendingDown, TrendingUp, History, CalendarClock, DollarSign, ArrowRight, Trash2, Save, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';

const futureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const previewItems: InventoryItem[] = [
  { id: 'preview-1', name: 'Máscara de hidratação', category: 'Uso Interno', quantity: 2, min_quantity: 5, cost_price: 48, expiration_date: futureDate(18) },
  { id: 'preview-2', name: 'Shampoo profissional', category: 'Uso Interno', quantity: 8, min_quantity: 3, cost_price: 62, expiration_date: futureDate(160) },
  { id: 'preview-3', name: 'Óleo finalizador', category: 'Revenda', quantity: 5, min_quantity: 2, cost_price: 39, expiration_date: futureDate(90) },
  { id: 'preview-4', name: 'Esmalte nude clássico', category: 'Uso Interno', quantity: 1, min_quantity: 4, cost_price: 9.9, expiration_date: futureDate(240) },
  { id: 'preview-5', name: 'Leave-in proteção térmica', category: 'Revenda', quantity: 6, min_quantity: 3, cost_price: 44.5, expiration_date: futureDate(26) },
];

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

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'Todos' | 'Uso Interno' | 'Revenda'>('Todos');

  // Drawer States
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [history, setHistory] = useState<InventoryMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Adjustment States
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'in' | 'out'>('out');
  const [adjustReason, setAdjustReason] = useState<string>('Uso no Atendimento');
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Creation/Edit States
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({
    name: '', category: 'Uso Interno', quantity: 0, min_quantity: 5, cost_price: 0, expiration_date: ''
  });

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      if (isPreview) {
        setItems(previewItems);
        return;
      }
      const data = await getInventory();
      setItems(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setSelectedItem(null);
    setIsEditingItem(false);
    setIsCreatingItem(true);
    setItemForm({ name: '', category: 'Uso Interno', quantity: 0, min_quantity: 5, cost_price: 0, expiration_date: '' });
  };

  const handleOpenItem = async (item: InventoryItem) => {
    setIsCreatingItem(false);
    setIsEditingItem(false);
    setSelectedItem(item);
    setAdjustAmount(1);
    setAdjustType('out');
    setAdjustReason('Uso no Atendimento');
    setHistory([]);
    setIsConfirmingDelete(false);
    setLoadingHistory(true);

    if (isPreview) {
      setHistory([
        { id: `${item.id}-movement-1`, inventory_id: item.id, type: 'out', quantity: 1, reason: 'Uso no Atendimento', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: `${item.id}-movement-2`, inventory_id: item.id, type: 'in', quantity: 4, reason: 'Compra de Fornecedor', created_at: new Date(Date.now() - 604800000).toISOString() },
      ]);
      setLoadingHistory(false);
      return;
    }
    
    try {
      const data = await getItemHistory(item.id);
      setHistory(data);
    } catch (error) { console.error(error); } finally { setLoadingHistory(false); }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name) return;
    setIsSaving(true);
    try {
      if (isCreatingItem) {
        if (isPreview) {
          const createdItem: InventoryItem = {
            id: `preview-${Date.now()}`,
            name: itemForm.name,
            category: itemForm.category || 'Uso Interno',
            quantity: itemForm.quantity || 0,
            min_quantity: itemForm.min_quantity || 0,
            cost_price: itemForm.cost_price || 0,
            expiration_date: itemForm.expiration_date || null,
          };
          setItems(prev => [createdItem, ...prev]);
          setIsCreatingItem(false);
          return;
        }
        await createInventoryItem(itemForm);
        await fetchInventory();
        setIsCreatingItem(false);
      } else if (isEditingItem && selectedItem) {
        if (!isPreview) await updateInventoryItem(selectedItem.id, itemForm);
        const updatedItem = { ...selectedItem, ...itemForm } as InventoryItem;
        setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
        setSelectedItem(updatedItem);
        setIsEditingItem(false);
      }
    } catch (error: any) {
      alert("Erro ao salvar produto: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustSubmit = async () => {
    if (!selectedItem || adjustAmount <= 0) return;
    setIsSaving(true);
    try {
      const newQty = adjustType === 'in' ? selectedItem.quantity + adjustAmount : selectedItem.quantity - adjustAmount;
      if (newQty < 0) {
        alert('A saída não pode ser maior que a quantidade disponível.');
        return;
      }
      if (!isPreview) await adjustStock(selectedItem.id, selectedItem.quantity, adjustAmount, adjustType, adjustReason);
      const updatedItem = { ...selectedItem, quantity: newQty };
      
      setItems(prev => prev.map(i => i.id === selectedItem.id ? updatedItem : i));
      setSelectedItem(updatedItem);
      
      if (isPreview) {
        setHistory(prev => [{ id: `movement-${Date.now()}`, inventory_id: selectedItem.id, type: adjustType, quantity: adjustAmount, reason: adjustReason, created_at: new Date().toISOString() }, ...prev]);
      } else {
        const newHistory = await getItemHistory(selectedItem.id);
        setHistory(newHistory);
      }
      setAdjustAmount(1);
    } catch (error: any) {
      alert(error.message || "Erro ao ajustar estoque.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      if (!isPreview) await deleteInventoryItem(selectedItem.id);
      setItems(prev => prev.filter(i => i.id !== selectedItem.id));
      setSelectedItem(null);
    } catch (error: any) {
      alert("Erro ao excluir: " + (error.message || "Erro desconhecido"));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalValue = items.reduce((sum, item) => sum + (item.quantity * (item.cost_price || 0)), 0);
  const criticalItems = items.filter(i => i.quantity <= i.min_quantity).length;
  const expiringItems = items.filter(i => i.expiration_date && differenceInDays(new Date(i.expiration_date), new Date()) <= 30 && differenceInDays(new Date(i.expiration_date), new Date()) >= 0).length;

  if (loading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-aura-gold" /></div>;

  return (
    <div className="space-y-6">

      <section className="glass-card overflow-hidden border border-aura-charcoal/5">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="admin-kicker">Operação &amp; produtos</p>
            <h3 className="mt-2 font-serif text-3xl text-aura-charcoal sm:text-4xl">Estoque sob controle.</h3>
            <p className="mt-3 text-sm leading-relaxed text-aura-charcoal/55">Acompanhe insumos, produtos para revenda e alertas antes que eles interrompam a rotina do salão.</p>
          </div>
          <button onClick={handleOpenCreate} className="aura-button aura-button-primary flex w-full items-center justify-center gap-2 shadow-lg shadow-aura-charcoal/10 sm:w-auto">
            <Plus className="w-4 h-4" /> Novo produto
          </button>
        </div>
        <div className="border-t border-aura-charcoal/5 bg-aura-charcoal px-6 py-4 text-white sm:px-8">
          <p className="text-xs leading-relaxed text-white/65"><span className="font-bold text-white">Visão rápida:</span> {criticalItems > 0 ? `${criticalItems} ${criticalItems === 1 ? 'item precisa' : 'itens precisam'} de reposição.` : 'nenhum item precisa de reposição.'}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <div className="glass-card p-6 flex items-center gap-4 border border-aura-charcoal/5 min-h-32">
          <div className="p-4 rounded-full bg-aura-gold/10 text-aura-gold"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Valor em estoque</p>
            <p className="text-2xl font-serif text-aura-charcoal">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border border-aura-charcoal/5 min-h-32">
          <div className="p-4 rounded-full bg-red-50 text-red-500"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Abaixo do Mínimo</p>
            <p className="text-2xl font-serif text-aura-charcoal">{criticalItems} produtos</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4 border border-aura-charcoal/5 min-h-32">
          <div className="p-4 rounded-full bg-orange-50 text-orange-500"><CalendarClock className="w-6 h-6" /></div>
          <div>
            <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Vence em 30 dias</p>
            <p className="text-2xl font-serif text-aura-charcoal">{expiringItems} produtos</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/55 p-4 sm:p-5 rounded-3xl border border-aura-charcoal/5 shadow-sm">
        <div className="flex gap-1 overflow-x-auto p-1 bg-aura-soft-gray rounded-full">
          {['Todos', 'Uso Interno', 'Revenda'].map(cat => (
            <button 
              key={cat}
              onClick={() => setCategoryFilter(cat as any)}
              className={cn("px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", categoryFilter === cat ? "bg-aura-charcoal text-white shadow-sm" : "text-aura-charcoal/40 hover:text-aura-charcoal")}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aura-charcoal/40" />
            <input 
              placeholder="Buscar produto..." 
              className="w-full bg-white border border-aura-charcoal/10 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-aura-gold/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredItems.map((item, i) => {
          const isCritical = item.quantity <= item.min_quantity;
          const daysToExpire = item.expiration_date ? differenceInDays(new Date(item.expiration_date), new Date()) : 999;
          const isExpiring = daysToExpire <= 30 && daysToExpire >= 0;

          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => handleOpenItem(item)}
              className={cn(
                "glass-card min-h-64 p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg border",
                isCritical ? "border-red-200 bg-red-50/30" : "border-aura-charcoal/5 hover:border-aura-gold/30"
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", isCritical ? "bg-red-100 text-red-600" : "bg-aura-soft-gray text-aura-charcoal")}>
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex gap-2">
                  {isExpiring && <span className="text-[9px] px-2 py-1 rounded bg-orange-100 text-orange-600 font-bold uppercase tracking-widest flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Vence em {daysToExpire}d</span>}
                  {isCritical && <span className="text-[9px] px-2 py-1 rounded bg-red-100 text-red-600 font-bold uppercase tracking-widest">Estoque Baixo</span>}
                </div>
              </div>

              <h4 className="font-serif text-lg text-aura-charcoal truncate">{item.name}</h4>
              <p className="text-[10px] text-aura-charcoal/50 mt-0.5 uppercase tracking-widest font-bold">{item.category}</p>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Quantidade</p>
                  <p className="text-3xl font-serif text-aura-charcoal">{item.quantity} <span className="text-sm font-sans text-aura-charcoal/40 ml-1">un</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Custo</p>
                  <p className="text-sm font-bold text-aura-sage">R$ {item.cost_price || 0}</p>
                </div>
              </div>
            </motion.div>
          )
        })}
        {filteredItems.length === 0 && (
          <div className="glass-card col-span-full flex min-h-64 flex-col items-center justify-center border border-dashed border-aura-charcoal/15 p-8 text-center">
            <Package className="mb-4 h-8 w-8 text-aura-gold" />
            <h4 className="font-serif text-xl text-aura-charcoal">Nenhum produto por aqui.</h4>
            <p className="mt-2 text-sm text-aura-charcoal/50">Ajuste a busca ou cadastre um novo item.</p>
          </div>
        )}
      </div>

      <Drawer 
        open={!!selectedItem || isCreatingItem} 
        onClose={() => { setSelectedItem(null); setIsCreatingItem(false); setIsEditingItem(false); }} 
        title={isCreatingItem ? "Novo Produto" : isEditingItem ? "Editar Produto" : "Gestão do Produto"}
      >
        {/* --- MODO CRIAÇÃO OU EDIÇÃO --- */}
        {(isCreatingItem || isEditingItem) ? (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Nome do Produto</label>
                <input required className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-aura-gold/20" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} placeholder="Ex: Shampoo L'Oréal 500ml" />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Categoria</label>
                <div className="flex gap-2 p-1 bg-aura-soft-gray rounded-xl">
                  <button type="button" onClick={() => setItemForm({...itemForm, category: 'Uso Interno'})} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", itemForm.category === 'Uso Interno' ? "bg-white shadow-sm" : "text-aura-charcoal/40")}>Uso Interno</button>
                  <button type="button" onClick={() => setItemForm({...itemForm, category: 'Revenda'})} className={cn("flex-1 py-2 rounded-lg text-xs font-bold transition-all", itemForm.category === 'Revenda' ? "bg-white shadow-sm" : "text-aura-charcoal/40")}>Revenda</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isCreatingItem ? (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Qtd. Inicial</label>
                    <input type="number" required className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none" value={itemForm.quantity} onChange={e => setItemForm({...itemForm, quantity: Number(e.target.value)})} />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Qtd. em Estoque</label>
                    <input type="number" disabled className="w-full bg-aura-soft-gray border border-transparent rounded-xl px-4 py-3 text-sm outline-none opacity-60 cursor-not-allowed" value={selectedItem?.quantity || 0} title="Use a aba de Movimentação para alterar a quantidade." />
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold text-red-500">Alerta Mínimo</label>
                  <input type="number" required className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 text-sm outline-none" value={itemForm.min_quantity} onChange={e => setItemForm({...itemForm, min_quantity: Number(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold text-aura-sage">Preço de Custo (R$)</label>
                  <input type="number" step="0.01" className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-sm outline-none" value={itemForm.cost_price} onChange={e => setItemForm({...itemForm, cost_price: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Data Validade</label>
                  <input type="date" className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none text-aura-charcoal/60" value={itemForm.expiration_date} onChange={e => setItemForm({...itemForm, expiration_date: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-aura-charcoal/10">
              <button type="button" onClick={() => { setIsCreatingItem(false); setIsEditingItem(false); }} className="flex-1 py-4 rounded-2xl bg-aura-soft-gray text-aura-charcoal font-bold text-xs uppercase tracking-widest">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 py-4 rounded-2xl bg-aura-charcoal text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {isCreatingItem ? "Criar Produto" : "Salvar Alterações"}
              </button>
            </div>
          </form>
        ) : (
          /* --- MODO GESTÃO --- */
          selectedItem && (
            <div className="space-y-8 pb-10">
              <div className="text-center relative group">
                <button 
                  onClick={() => { setIsEditingItem(true); setItemForm(selectedItem); }}
                  className="absolute top-0 right-0 p-2 bg-white rounded-xl shadow-sm border border-aura-charcoal/5 text-aura-gold hover:bg-aura-gold hover:text-white transition-all"
                  title="Editar Produto"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <h3 className="text-2xl font-serif text-aura-charcoal">{selectedItem.name}</h3>
                <p className="text-xs text-aura-charcoal/60 uppercase tracking-widest font-bold mt-1">Atual: {selectedItem.quantity} un (Mín: {selectedItem.min_quantity})</p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-aura-charcoal/10 shadow-sm space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-aura-charcoal/40 flex items-center gap-2">
                  <ArrowRight className="w-3 h-3" /> Registar Movimentação
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setAdjustType('out')} className={cn("py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2", adjustType === 'out' ? "bg-red-50 border-red-200 text-red-600" : "bg-white text-aura-charcoal/40 border-aura-charcoal/10")}>
                    <TrendingDown className="w-4 h-4" /> SAÍDA
                  </button>
                  <button onClick={() => setAdjustType('in')} className={cn("py-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2", adjustType === 'in' ? "bg-green-50 border-green-200 text-green-600" : "bg-white text-aura-charcoal/40 border-aura-charcoal/10")}>
                    <TrendingUp className="w-4 h-4" /> ENTRADA
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Qtd</label>
                    <input type="number" min="1" className="w-full bg-aura-soft-gray border-none rounded-xl px-3 py-2 text-sm outline-none font-bold text-center" value={adjustAmount} onChange={e => setAdjustAmount(Number(e.target.value))} />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Motivo (Obrigatório)</label>
                    <select className="w-full bg-aura-soft-gray border-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-aura-gold/20" value={adjustReason} onChange={e => setAdjustReason(e.target.value)}>
                      {adjustType === 'out' ? (
                        <>
                          <option>Uso no Atendimento</option>
                          <option>Venda ao Cliente</option>
                          <option>Vencimento/Avaria</option>
                          <option>Ajuste de Inventário</option>
                        </>
                      ) : (
                        <>
                          <option>Compra de Fornecedor</option>
                          <option>Devolução de Cliente</option>
                          <option>Ajuste de Inventário</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAdjustSubmit} 
                  disabled={isSaving}
                  className="w-full py-3 bg-aura-charcoal text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-aura-gold transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Lançamento"}
                </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-aura-charcoal/10">
                <p className="text-lg font-serif italic text-aura-charcoal flex items-center gap-2">
                  <History className="w-5 h-5 text-aura-gold" /> Log de Movimentações
                </p>
                
                {loadingHistory ? (
                  <div className="py-4 text-center"><Loader2 className="w-5 h-5 animate-spin text-aura-gold mx-auto" /></div>
                ) : history.length === 0 ? (
                  <p className="text-sm text-aura-charcoal/40 text-center py-6 bg-white rounded-2xl border border-dashed border-aura-charcoal/10">Sem movimentações recentes.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((log) => (
                      <div key={log.id} className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-aura-charcoal/5 shadow-sm">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold", log.type === 'in' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>
                          {log.type === 'in' ? '+' : '-'}{log.quantity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-aura-charcoal truncate">{log.reason}</p>
                          <p className="text-[10px] text-aura-charcoal/50 uppercase tracking-widest">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</p>
                        </div>
                        <div className="text-[9px] px-2 py-1 bg-aura-soft-gray rounded-md font-bold text-aura-charcoal/40">
                          Sistema
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-8 mt-8 border-t border-red-100">
                <AnimatePresence mode="wait">
                  {!isConfirmingDelete ? (
                    <motion.button 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setIsConfirmingDelete(true)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all text-xs font-bold uppercase tracking-widest"
                    >
                      <Trash2 className="w-4 h-4" /> Apagar Produto
                    </motion.button>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3"
                    >
                      <p className="text-xs text-red-700 text-center font-bold">
                        Tem a certeza? Todo o histórico deste produto será apagado permanentemente.
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsConfirmingDelete(false)} 
                          disabled={isSaving}
                          className="flex-1 py-2.5 rounded-xl bg-white border border-red-200 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleDeleteItem} 
                          disabled={isSaving}
                          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 flex items-center justify-center gap-2"
                        >
                          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Sim, Apagar"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        )}
      </Drawer>
    </div>
  );
}
