import { supabase } from '../supabase';
import { Customer, Appointment } from '../../types';

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function adjustCustomerLoyaltyPoints(customerId: string, points: number): Promise<void> {
  const { error } = await supabase.rpc('increment_loyalty_points', {
    cust_id: customerId,
    points,
  });

  if (error) throw new Error(error.message);
}

// Nova função monstro de CRM
export interface CustomerCRMData {
  completedHistory: Appointment[];
  upcomingAppointment: Appointment | null;
  ltv: number;
  favoriteProfessional: string;
}

export type PublicLoyaltyCustomer = Pick<Customer, 'id' | 'name' | 'loyalty_points' | 'is_vip'> & {
  last_visit?: string;
};

export async function getCustomerCRMData(customerId: string, customerName: string): Promise<CustomerCRMData> {
  // Puxa os agendamentos pelo ID ou pelo Nome exato (para garantir que pega os legados)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('*, professionals(name)')
    .order('start_time', { ascending: false });

  if (error) throw new Error(error.message);

  const appts = appointments?.filter(a => a.customer_id === customerId || a.customer_name === customerName) || [];
  const now = new Date();

  // Histórico Concluído
  const completed = appts.filter(a => a.status === 'completed');
  
  // Próximos Agendamentos (Pendentes ou Confirmados no futuro)
  const upcomingList = appts.filter(a => 
    (a.status === 'scheduled' || a.status === 'confirmed') && new Date(a.start_time) >= now
  );
  // Pega o agendamento futuro mais próximo
  const upcomingAppointment = upcomingList.length > 0 ? upcomingList[upcomingList.length - 1] : null;

  // LTV (Lifetime Value) - Soma de tudo o que gastou
  const ltv = completed.reduce((sum, a) => sum + Number(a.price || 0), 0);

  // Profissional Favorito (O que mais vezes a atendeu)
  const profCounts: Record<string, number> = {};
  completed.forEach(a => {
    // @ts-ignore - a junção do supabase traz o objeto professionals
    const profName = a.professionals?.name || 'Desconhecido';
    profCounts[profName] = (profCounts[profName] || 0) + 1;
  });

  let favoriteProfessional = '-';
  let maxCount = 0;
  Object.entries(profCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteProfessional = name;
    }
  });

  return {
    completedHistory: completed,
    upcomingAppointment,
    ltv,
    favoriteProfessional
  };
}

export async function getCustomerByPhone(phone: string): Promise<PublicLoyaltyCustomer | null> {
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return null;

  const { data, error } = await supabase.rpc('get_public_loyalty', { phone_input: cleanPhone });

  if (error) throw new Error(error.message);

  // Normalização robusta para comparar números brasileiros (ignora DDI 55 ou zero à esquerda)
  return (data?.[0] as PublicLoyaltyCustomer | undefined) || null;
}
