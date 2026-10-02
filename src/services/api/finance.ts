import { supabase } from '../supabase';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  payment_method: string;
  status: 'pago' | 'pendente' | 'atrasado';
  date: string;
}

export interface FinanceDashboard {
  grossRevenue: number;
  expenses: number;
  netProfit: number;
  pendingBalance: number; // O que falta entrar - o que falta sair
  pendingIncome: number;
  pendingExpenses: number;
}

export function calculateFinanceDashboard(transactions: Transaction[]): FinanceDashboard {
  let grossRevenue = 0;
  let expenses = 0;
  let pendingIncome = 0;
  let pendingExpenses = 0;

  transactions.forEach(transaction => {
    const amount = Number(transaction.amount);
    if (transaction.status === 'pago') {
      if (transaction.type === 'income') grossRevenue += amount;
      else expenses += amount;
    } else if (transaction.type === 'income') {
      pendingIncome += amount;
    } else {
      pendingExpenses += amount;
    }
  });

  return {
    grossRevenue,
    expenses,
    netProfit: grossRevenue - expenses,
    pendingBalance: pendingIncome - pendingExpenses,
    pendingIncome,
    pendingExpenses,
  };
}

export interface PendingCommission {
  professional_id: string;
  professional_name: string;
  pending_amount: number;
  appointment_ids: string[];
}

export async function getTransactions(startDate: Date, endDate: Date): Promise<Transaction[]> {
  // Garante que pega desde as 00:00 do dia inicial até as 23:59 do dia final
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', start.toISOString())
    .lte('date', end.toISOString())
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getFinanceDashboard(startDate: Date, endDate: Date): Promise<FinanceDashboard> {
  const transactions = await getTransactions(startDate, endDate);
  return calculateFinanceDashboard(transactions);
}

export async function createTransaction(transaction: Partial<Transaction>): Promise<void> {
  const { error } = await supabase.from('transactions').insert([transaction]);
  if (error) throw new Error(error.message);
}

export async function updateTransactionStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase.from('transactions').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}

// --- INTEGRAÇÃO COM RH: COMISSÕES ---

export async function getPendingCommissions(): Promise<PendingCommission[]> {
  // Puxa agendamentos concluídos que ainda não tiveram comissão paga
  const { data, error } = await supabase
    .from('appointments')
    .select('id, price, professional_id, professionals(name, commission_rate)')
    .eq('status', 'completed')
    .eq('commission_paid', false);

  if (error) throw new Error(error.message);

  const commissionsMap: Record<string, PendingCommission> = {};

  data?.forEach(appt => {
    if (!appt.professional_id || !appt.price) return;
    // @ts-ignore
    const profName = appt.professionals?.name || 'Desconhecido';
    // @ts-ignore
    const rate = appt.professionals?.commission_rate || 0;
    
    const comValue = (Number(appt.price) * rate) / 100;

    if (!commissionsMap[appt.professional_id]) {
      commissionsMap[appt.professional_id] = {
        professional_id: appt.professional_id,
        professional_name: profName,
        pending_amount: 0,
        appointment_ids: []
      };
    }

    commissionsMap[appt.professional_id].pending_amount += comValue;
    commissionsMap[appt.professional_id].appointment_ids.push(appt.id);
  });

  return Object.values(commissionsMap).filter(c => c.pending_amount > 0);
}

export async function payCommission(professionalId: string, professionalName: string, amount: number, appointmentIds: string[]): Promise<void> {
  void professionalName;
  void amount;
  void appointmentIds;
  const { error } = await supabase.rpc('pay_professional_commission', {
    professional_id_input: professionalId,
  });
  if (error) throw new Error(error.message);
}
