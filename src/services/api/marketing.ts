import { supabase } from '../supabase';
import { Customer } from '../../types';

export interface CampaignStats {
  totalCustomers: number;
  vipCustomers: number;
  inactiveCustomers: number; // Clientes que não vêm há mais de 30 dias
}

export interface MarketingCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  last_visit?: string;
  is_vip: boolean;
}

export async function getMarketingStats(): Promise<CampaignStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Total de clientes
  const { count: total } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  
  // 2. Clientes VIP
  const { count: vips } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('is_vip', true);

  // 3. Inativos (Última visita nula ou anterior a 30 dias)
  const { count: inactives } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .or(`last_visit.is.null,last_visit.lt.${thirtyDaysAgo.toISOString()}`);

  return {
    totalCustomers: total || 0,
    vipCustomers: vips || 0,
    inactiveCustomers: inactives || 0
  };
}

export async function getTargetEmails(segment: 'all' | 'vip' | 'inactive'): Promise<string[]> {
  let query = supabase.from('customers').select('email');

  if (segment === 'vip') query = query.eq('is_vip', true);
  if (segment === 'inactive') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.or(`last_visit.is.null,last_visit.lt.${thirtyDaysAgo.toISOString()}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  
  return data.map(c => c.email).filter(Boolean) as string[];
}

export async function getTargetCustomers(segment: 'all' | 'vip' | 'inactive'): Promise<MarketingCustomer[]> {
  let query = supabase
    .from('customers')
    .select('id, name, phone, email, last_visit, is_vip')
    .order('name');

  if (segment === 'vip') query = query.eq('is_vip', true);
  if (segment === 'inactive') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.or(`last_visit.is.null,last_visit.lt.${thirtyDaysAgo.toISOString()}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}
