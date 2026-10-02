import { supabase } from '../supabase';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  cost_price: number;
  expiration_date: string;
  category: string;
}

export interface InventoryMovement {
  id: string;
  inventory_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  created_at: string;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from('inventory').select('*').order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// NOVO: Função para criar o produto e dar entrada no log inicial
export async function createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from('inventory')
    .insert([item])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Se o produto já começar com quantidade, regista a entrada no histórico
  if (data && data.quantity > 0) {
    await supabase.from('inventory_movements').insert([{
      inventory_id: data.id,
      type: 'in',
      quantity: data.quantity,
      reason: 'Estoque Inicial'
    }]);
  }

  return data;
}

export async function getItemHistory(inventoryId: string): Promise<InventoryMovement[]> {
  const { data, error } = await supabase.from('inventory_movements').select('*').eq('inventory_id', inventoryId).order('created_at', { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return data || [];
}

export async function adjustStock(inventoryId: string, currentQuantity: number, changeAmount: number, type: 'in' | 'out', reason: string): Promise<void> {
  void currentQuantity;
  const { error } = await supabase.rpc('adjust_inventory_stock', {
    inventory_id_input: inventoryId,
    quantity_input: changeAmount,
    movement_type_input: type,
    reason_input: reason,
  });
  if (error) throw new Error(error.message);
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const { error } = await supabase.from('inventory').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getConsumptionReport() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data, error } = await supabase.from('inventory_movements').select('quantity, inventory_id, inventory(name)').eq('type', 'out').gte('created_at', thirtyDaysAgo.toISOString());
  if (error) throw new Error(error.message);
  const consumption: Record<string, { name: string, total: number }> = {};
  data?.forEach(log => {
    const id = log.inventory_id;
    // @ts-ignore
    const name = log.inventory?.name || 'Desconhecido';
    if (!consumption[id]) consumption[id] = { name, total: 0 };
    consumption[id].total += log.quantity;
  });
  return Object.values(consumption).sort((a, b) => b.total - a.total);
}

// Adicione esta função no final do arquivo inventory.ts
export async function updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<void> {
  // Removemos a quantidade do objeto de atualização por segurança.
  // A quantidade SÓ DEVE ser alterada pela função adjustStock (que gera o log).
  const safeUpdates = { ...updates };
  delete safeUpdates.quantity; 

  const { error } = await supabase
    .from('inventory')
    .update(safeUpdates)
    .eq('id', id);

  if (error) throw new Error(error.message);
}
