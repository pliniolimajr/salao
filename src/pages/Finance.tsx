import React, { useState, useEffect } from 'react';
import { 
  getTransactions, calculateFinanceDashboard, createTransaction, updateTransactionStatus,
  getPendingCommissions, payCommission, Transaction, FinanceDashboard, PendingCommission 
} from '../services/api/finance';
import { cn } from '../utils/cn';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Loader2, X, 
  CreditCard, CheckCircle2, Clock, AlertCircle, Users, ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DrawerType = 'transaction' | 'commissions' | 'incomeDetails' | 'expenseDetails' | 'pendingDetails' | null;
const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';

const previewTransactions: Transaction[] = [
  { id: 'tx-1', description: 'Atendimentos do dia', amount: 680, type: 'income', category: 'Serviços', payment_method: 'PIX', status: 'pago', date: new Date().toISOString() },
  { id: 'tx-2', description: 'Venda de finalizadores', amount: 156, type: 'income', category: 'Revenda', payment_method: 'Cartão de Crédito', status: 'pago', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'tx-3', description: 'Reposição de produtos', amount: 248.5, type: 'expense', category: 'Fornecedores / Estoque', payment_method: 'PIX', status: 'pago', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 'tx-4', description: 'Pacote mensal de cliente', amount: 320, type: 'income', category: 'Serviços', payment_method: 'PIX', status: 'pendente', date: new Date(Date.now() - 259200000).toISOString() },
  { id: 'tx-5', description: 'Conta de energia', amount: 189.9, type: 'expense', category: 'Custos Fixos', payment_method: 'Débito', status: 'atrasado', date: new Date(Date.now() - 345600000).toISOString() },
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

export function Finance() {
  // Filtro de Data States
  const [filterMode, setFilterMode] = useState<'month' | 'custom'>('month');
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [customRange, setCustomRange] = useState({ 
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), 
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd') 
  });

  // Data States
  const [dashboard, setDashboard] = useState<FinanceDashboard>({ grossRevenue: 0, expenses: 0, netProfit: 0, pendingBalance: 0, pendingIncome: 0, pendingExpenses: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Drawer States
  const [drawerType, setDrawerType] = useState<DrawerType>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Forms States
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    type: 'income', category: 'Serviços', payment_method: 'PIX', status: 'pago', amount: 0, description: '', date: format(new Date(), 'yyyy-MM-dd')
  });
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);

  useEffect(() => { fetchData(); }, [currentMonthDate, filterMode, customRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      let start: Date, end: Date;
      
      if (filterMode === 'month') {
        start = startOfMonth(currentMonthDate);
        end = endOfMonth(currentMonthDate);
      } else {
        start = parseISO(customRange.start);
        end = parseISO(customRange.end);
      }

      if (isPreview) {
        setTransactions(previewTransactions);
        setDashboard(calculateFinanceDashboard(previewTransactions));
        return;
      }

      const txData = await getTransactions(start, end);
      setDashboard(calculateFinanceDashboard(txData));
      setTransactions(txData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const handleOpenCommissions = async () => {
    setDrawerType('commissions');
    try {
      if (isPreview) {
        setPendingCommissions([
          { professional_id: 'prof-1', professional_name: 'Carla Santos', pending_amount: 284, appointment_ids: ['appt-1', 'appt-2', 'appt-3'] },
          { professional_id: 'prof-2', professional_name: 'Jéssica Lima', pending_amount: 176.5, appointment_ids: ['appt-4', 'appt-5'] },
        ]);
        return;
      }
      const data = await getPendingCommissions();
      setPendingCommissions(data);
    } catch (error) { console.error(error); }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.description || !newTx.amount) return;
    setIsSaving(true);
    try {
      const dateStr = new Date(`${newTx.date}T12:00:00`).toISOString();
      if (isPreview) {
        const created = { ...newTx, id: `tx-${Date.now()}`, date: dateStr } as Transaction;
        setTransactions(prev => {
          const next = [created, ...prev];
          setDashboard(calculateFinanceDashboard(next));
          return next;
        });
      } else {
        await createTransaction({ ...newTx, date: dateStr });
        await fetchData();
      }
      setDrawerType(null);
      setNewTx({ type: 'income', category: 'Serviços', payment_method: 'PIX', status: 'pago', amount: 0, description: '', date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    } finally { setIsSaving(false); }
  };

  const handlePayCommission = async (comm: PendingCommission) => {
    if (!confirm(`Confirmar o pagamento de R$ ${comm.pending_amount.toFixed(2)} para ${comm.professional_name}?`)) return;
    setIsSaving(true);
    try {
      if (!isPreview) await payCommission(comm.professional_id, comm.professional_name, comm.pending_amount, comm.appointment_ids);
      setPendingCommissions(prev => prev.filter(c => c.professional_id !== comm.professional_id));
      if (!isPreview) await fetchData();
    } catch (error: any) {
      alert("Erro ao pagar comissão: " + error.message);
    } finally { setIsSaving(false); }
  };

  const toggleTxStatus = async (tx: Transaction) => {
    if (tx.status === 'pago') return;
    try {
      if (isPreview) {
        setTransactions(prev => {
          const next = prev.map(item => item.id === tx.id ? { ...item, status: 'pago' as const } : item);
          setDashboard(calculateFinanceDashboard(next));
          return next;
        });
      } else {
        await updateTransactionStatus(tx.id, 'pago');
        await fetchData();
      }
    } catch (error) { console.error("Erro ao atualizar status"); }
  };

  const filteredTx = transactions.filter(t => filterType === 'all' || t.type === filterType);

  // Auxiliares para o Drawer de Detalhes
  const incomeList = transactions.filter(t => t.type === 'income' && t.status === 'pago');
  const expenseList = transactions.filter(t => t.type === 'expense' && t.status === 'pago');
  const pendingList = transactions.filter(t => t.status !== 'pago');

  if (loading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-aura-gold" /></div>;

  return (
    <div className="space-y-6">
      
      {/* HEADER & CONTROLS DE PERÍODO */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 bg-aura-charcoal p-6 sm:p-8 rounded-3xl border border-aura-charcoal/5 shadow-xl text-white overflow-hidden relative">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-aura-gold/20 blur-3xl" />
        <div className="space-y-1 relative z-10">
          <p className="admin-kicker text-aura-gold">Decisões com clareza</p>
          <h3 className="text-3xl sm:text-4xl font-serif text-white">Gestão financeira.</h3>
          <p className="text-xs text-white/45 uppercase tracking-widest font-bold pt-2">
            {filterMode === 'month' ? `de ${format(currentMonthDate, 'MMMM yyyy', { locale: ptBR })}` : 'DRE de Período Personalizado'}
          </p>
        </div>

        {/* Controladores de Data */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-2 rounded-2xl border border-white/10 shadow-sm w-full xl:w-auto relative z-10">
          <div className="flex gap-1 w-full sm:w-auto p-1 bg-aura-soft-gray rounded-xl">
            <button onClick={() => setFilterMode('month')} className={cn("flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", filterMode === 'month' ? "bg-white shadow-sm text-aura-charcoal" : "text-aura-charcoal/40")}>Mensal</button>
            <button onClick={() => setFilterMode('custom')} className={cn("flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all", filterMode === 'custom' ? "bg-white shadow-sm text-aura-charcoal" : "text-aura-charcoal/40")}>Específico</button>
          </div>

          <div className="h-8 w-px bg-aura-charcoal/10 hidden sm:block"></div>

          {filterMode === 'month' ? (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between px-2">
              <button type="button" aria-label="Mês anterior" onClick={() => setCurrentMonthDate(subMonths(currentMonthDate, 1))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-soft-gray text-aura-charcoal transition-colors hover:bg-aura-gold hover:text-white">
                <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
              <span className="text-sm font-bold text-aura-charcoal uppercase tracking-widest min-w-[120px] text-center">
                {format(currentMonthDate, 'MMM yyyy', { locale: ptBR })}
              </span>
              <button type="button" aria-label="Próximo mês" onClick={() => setCurrentMonthDate(addMonths(currentMonthDate, 1))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-aura-soft-gray text-aura-charcoal transition-colors hover:bg-aura-gold hover:text-white">
                <ChevronRight className="h-5 w-5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto px-2">
              <input type="date" className="bg-aura-soft-gray border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none text-aura-charcoal" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} />
              <span className="text-aura-charcoal/40 text-xs">até</span>
              <input type="date" className="bg-aura-soft-gray border-none rounded-lg px-2 py-1.5 text-xs font-bold outline-none text-aura-charcoal" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto relative z-10">
          <button type="button" onClick={handleOpenCommissions} className="aura-button flex flex-1 items-center justify-center gap-2 whitespace-nowrap border border-white bg-white text-aura-charcoal shadow-md hover:bg-[#fff4f7] xl:flex-none">
            <Users className="h-4 w-4 shrink-0 text-aura-gold" /> <span className="text-aura-charcoal">Comissões</span>
          </button>
          <button type="button" onClick={() => setDrawerType('transaction')} className="aura-button flex flex-1 items-center justify-center gap-2 whitespace-nowrap border border-aura-clay bg-aura-clay text-aura-charcoal shadow-lg shadow-black/15 hover:bg-[#efa7ba] xl:flex-none">
            <Plus className="h-4 w-4 shrink-0" /> <span className="text-aura-charcoal">Lançamento</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS (AGORA CLICÁVEIS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => setDrawerType('incomeDetails')}
          className="glass-card min-h-48 p-6 border-t-4 border-green-500 cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-green-50 text-green-600 group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Receita Bruta</p>
          <p className="text-2xl font-serif text-aura-charcoal">R$ {dashboard.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] text-green-600 font-bold uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Ver Entradas <ArrowRight className="w-3 h-3"/></p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => setDrawerType('expenseDetails')}
          className="glass-card min-h-48 p-6 border-t-4 border-red-500 cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 group-hover:scale-110 transition-transform"><TrendingDown className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Despesas (Saídas)</p>
          <p className="text-2xl font-serif text-aura-charcoal">R$ {dashboard.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-[9px] text-red-600 font-bold uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Ver Saídas <ArrowRight className="w-3 h-3"/></p>
        </motion.div>

        {/* Lucro Líquido não precisa de Drill-down, é a diferença matemática */}
        <div className="glass-card min-h-48 p-6 border-t-4 border-aura-gold bg-aura-charcoal text-white shadow-xl relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-aura-gold/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-white/10 text-aura-gold"><DollarSign className="w-5 h-5" /></div>
            <span className="text-[9px] uppercase tracking-widest font-bold bg-white/10 px-2 py-1 rounded text-aura-gold">Seu Bolso</span>
          </div>
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold relative z-10">Lucro Líquido</p>
          <p className="text-3xl font-serif text-aura-gold relative z-10">R$ {dashboard.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          onClick={() => setDrawerType('pendingDetails')}
          className="glass-card min-h-48 p-6 border-t-4 border-orange-400 cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-500 group-hover:scale-110 transition-transform"><Clock className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest font-bold">Balanço Pendente</p>
          <p className="text-2xl font-serif text-aura-charcoal">R$ {dashboard.pendingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="mt-2 text-[10px] text-aura-charcoal/50">
            A receber R$ {dashboard.pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · A pagar R$ {dashboard.pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[9px] text-orange-500 font-bold uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Ver Pendências <ArrowRight className="w-3 h-3"/></p>
        </motion.div>
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="glass-card p-5 sm:p-8 border border-aura-charcoal/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-lg font-serif italic text-aura-charcoal flex items-center gap-2">
            <Wallet className="w-5 h-5 text-aura-gold" /> Fluxo de Caixa no Período
          </h3>
          <div className="flex gap-2 p-1 bg-aura-soft-gray rounded-full">
            <button onClick={() => setFilterType('all')} className={cn("px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", filterType === 'all' ? "bg-white text-aura-charcoal shadow-sm" : "text-aura-charcoal/40")}>Todas</button>
            <button onClick={() => setFilterType('income')} className={cn("px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", filterType === 'income' ? "bg-green-100 text-green-700 shadow-sm" : "text-aura-charcoal/40")}>Entradas</button>
            <button onClick={() => setFilterType('expense')} className={cn("px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", filterType === 'expense' ? "bg-red-100 text-red-700 shadow-sm" : "text-aura-charcoal/40")}>Saídas</button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredTx.length === 0 ? (
            <p className="text-sm text-aura-charcoal/40 text-center py-10">Nenhuma movimentação encontrada neste período.</p>
          ) : (
            filteredTx.map(tx => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-aura-charcoal/5 hover:border-aura-gold/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", tx.type === 'income' ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500")}>
                    {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-aura-charcoal text-sm">{tx.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-aura-charcoal/40 bg-aura-soft-gray px-2 py-0.5 rounded">{tx.category}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-aura-charcoal/40 flex items-center gap-1"><CreditCard className="w-3 h-3"/> {tx.payment_method}</span>
                      <span className="text-[9px] uppercase tracking-widest font-bold text-aura-charcoal/40 ml-2">{format(new Date(tx.date), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full border-t sm:border-t-0 border-aura-charcoal/5 pt-3 sm:pt-0">
                  <p className={cn("font-serif text-lg font-bold", tx.type === 'income' ? "text-green-600" : "text-red-500")}>
                    {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                  </p>
                  
                  {tx.status === 'pago' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1.5 rounded-lg"><CheckCircle2 className="w-3 h-3"/> Pago</span>
                  ) : (
                    <button 
                      onClick={() => toggleTxStatus(tx)}
                      className={cn(
                        "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-dashed transition-colors",
                        tx.status === 'atrasado' ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" : "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100"
                      )}
                    >
                      {tx.status === 'atrasado' ? <AlertCircle className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                      {tx.status} - Dar Baixa
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DRAWERS DINÂMICOS */}
      <Drawer 
        open={!!drawerType} 
        onClose={() => setDrawerType(null)} 
        title={
          drawerType === 'transaction' ? 'Novo Lançamento' : 
          drawerType === 'commissions' ? 'Acerto de Comissões' : 
          drawerType === 'incomeDetails' ? 'Detalhamento de Entradas' :
          drawerType === 'expenseDetails' ? 'Detalhamento de Saídas' :
          'Pendências Financeiras'
        }
      >
        
        {/* --- 1. MODO NOVO LANÇAMENTO --- */}
        {drawerType === 'transaction' && (
          <form onSubmit={handleCreateTransaction} className="space-y-6">
            <div className="flex gap-2 p-1 bg-aura-soft-gray rounded-xl">
              <button type="button" onClick={() => setNewTx({...newTx, type: 'income', category: 'Serviços'})} className={cn("flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2", newTx.type === 'income' ? "bg-green-500 text-white shadow-sm" : "text-aura-charcoal/40")}>
                <TrendingUp className="w-4 h-4"/> Entrada
              </button>
              <button type="button" onClick={() => setNewTx({...newTx, type: 'expense', category: 'Custos Fixos (Luz, Aluguel)'})} className={cn("flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex justify-center items-center gap-2", newTx.type === 'expense' ? "bg-red-500 text-white shadow-sm" : "text-aura-charcoal/40")}>
                <TrendingDown className="w-4 h-4"/> Saída
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Descrição</label>
                <input required className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-aura-gold/20" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} placeholder={newTx.type === 'income' ? "Ex: Venda de Shampoo" : "Ex: Conta de Luz"} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Valor (R$)</label>
                  <input type="number" step="0.01" required className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-lg font-bold outline-none" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Data</label>
                  <input type="date" required className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none text-aura-charcoal/60" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Categoria</label>
                  <select className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none" value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}>
                    {newTx.type === 'income' ? (
                      <><option>Serviços</option><option>Revenda</option><option>Outros</option></>
                    ) : (
                      <><option>Comissões</option><option>Custos Fixos (Luz, Aluguel)</option><option>Fornecedores / Estoque</option><option>Marketing</option></>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Pagamento</label>
                  <select className="w-full bg-white border border-aura-charcoal/10 rounded-xl px-4 py-3 text-sm outline-none" value={newTx.payment_method} onChange={e => setNewTx({...newTx, payment_method: e.target.value})}>
                    <option>PIX</option>
                    <option>Cartão de Crédito</option>
                    <option>Cartão de Débito</option>
                    <option>Dinheiro</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold mb-2 block">Status do Pagamento</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewTx({...newTx, status: 'pago'})} className={cn("flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all", newTx.status === 'pago' ? "bg-green-50 border-green-200 text-green-600" : "bg-white border-aura-charcoal/10 text-aura-charcoal/40")}>Pago</button>
                  <button type="button" onClick={() => setNewTx({...newTx, status: 'pendente'})} className={cn("flex-1 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all", newTx.status === 'pendente' ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-white border-aura-charcoal/10 text-aura-charcoal/40")}>Pendente</button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-aura-charcoal/10">
              <button type="button" onClick={() => setDrawerType(null)} className="flex-1 py-4 rounded-2xl bg-aura-soft-gray text-aura-charcoal font-bold text-xs uppercase tracking-widest">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 py-4 rounded-2xl bg-aura-charcoal text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Adicionar Lançamento
              </button>
            </div>
          </form>
        )}

        {/* --- 2. MODO PAGAMENTO DE COMISSÕES --- */}
        {drawerType === 'commissions' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-aura-gold/10 border border-aura-gold/20">
              <p className="text-xs text-aura-charcoal/70 leading-relaxed">
                Estas comissões são geradas automaticamente pelos serviços <strong>Concluídos</strong>. Ao clicar em "Pagar", o sistema gera uma despesa no fluxo de caixa.
              </p>
            </div>

            {pendingCommissions.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle2 className="w-12 h-12 text-aura-sage/30 mx-auto mb-3" />
                <p className="text-sm text-aura-charcoal/40">Nenhuma comissão pendente no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCommissions.map(comm => (
                  <div key={comm.professional_id} className="p-5 rounded-2xl bg-white border border-aura-charcoal/10 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-aura-soft-gray flex items-center justify-center text-aura-charcoal/40"><Users className="w-5 h-5"/></div>
                        <div>
                          <p className="font-serif text-lg text-aura-charcoal leading-tight">{comm.professional_name}</p>
                          <p className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">{comm.appointment_ids.length} serviços realizados</p>
                        </div>
                      </div>
                      <p className="text-xl font-serif text-aura-gold">R$ {comm.pending_amount.toFixed(2)}</p>
                    </div>
                    
                    <button 
                      onClick={() => handlePayCommission(comm)}
                      disabled={isSaving}
                      className="w-full py-2.5 rounded-xl bg-aura-charcoal text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-aura-gold transition-colors"
                    >
                      {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Aprovar Pagamento"} <ArrowRight className="w-3 h-3"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 3. MODO DETALHES (DRILL-DOWN DOS CARDS) --- */}
        {(drawerType === 'incomeDetails' || drawerType === 'expenseDetails' || drawerType === 'pendingDetails') && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-aura-charcoal/10 shadow-sm mb-6 text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-aura-charcoal/40 mb-1">
                Total {drawerType === 'incomeDetails' ? 'Faturado' : drawerType === 'expenseDetails' ? 'Gasto' : 'Pendente'}
              </p>
              <p className={cn("text-2xl font-serif font-bold", 
                drawerType === 'incomeDetails' ? "text-green-600" : 
                drawerType === 'expenseDetails' ? "text-red-500" : "text-orange-500"
              )}>
                R$ {
                  (drawerType === 'incomeDetails' ? dashboard.grossRevenue : 
                   drawerType === 'expenseDetails' ? dashboard.expenses : 
                   dashboard.pendingBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                }
              </p>
            </div>

            {/* Lista renderizada com base na escolha */}
            {(drawerType === 'incomeDetails' ? incomeList : drawerType === 'expenseDetails' ? expenseList : pendingList).map(tx => (
              <div key={tx.id} className="p-4 rounded-2xl bg-white border border-aura-charcoal/5 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-aura-charcoal text-sm">{tx.description}</p>
                  <p className="text-[10px] text-aura-charcoal/50 uppercase tracking-widest mt-1">{format(new Date(tx.date), "dd/MM/yyyy")} · {tx.payment_method}</p>
                </div>
                <p className={cn("font-bold", tx.type === 'income' ? "text-green-600" : "text-red-500")}>
                  {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                </p>
              </div>
            ))}

            {(drawerType === 'incomeDetails' ? incomeList : drawerType === 'expenseDetails' ? expenseList : pendingList).length === 0 && (
               <p className="text-center text-sm text-aura-charcoal/40 py-10 border border-dashed border-aura-charcoal/10 rounded-2xl">Nenhum registo encontrado.</p>
            )}
          </div>
        )}

      </Drawer>
    </div>
  );
}
