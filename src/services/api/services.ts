import { supabase } from '../supabase';
import { Service } from '../../types';

export async function getActiveServices(signal?: AbortSignal): Promise<Service[]> {
  const query = supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  const { data, error } = await (signal ? query.abortSignal(signal) : query);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*').order('category').order('name');
  if (error) throw new Error(error.message);
  return data || [];
}

// Futuramente, podes usar estas para criar um ecrã de "Gestão de Serviços" no teu painel Admin
export async function createService(service: Omit<Service, 'id'>): Promise<Service> {
  const { data, error } = await supabase.from('services').insert([service]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateService(id: string, updates: Partial<Service>): Promise<Service> {
  const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
