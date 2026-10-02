// src/types/index.ts

export type Role = 'ADMIN' | 'PROFESSIONAL';

export interface UserProfile {
  id: string; // UUID vindo do Supabase Auth
  email: string;
  name: string;
  role: Role;
  active: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Professional {
  id: string; // UUID
  name: string;
  role: string; // Ex: Cabelereira, Manicure
  active: boolean;
  commission_rate: number;
  goals_monthly_revenue: number;
  goals_appointments: number;
  specialties?: string[];
  service_ids?: string[];
  off_days?: number[]; // Dias de folga recorrentes (0 = Domingo, 1 = Segunda, etc.)
  created_at: string;
}

export interface Service {
  id: string; // UUID
  name: string;
  price: number;
  duration_minutes: number;
  category: string; // Ex: Cabelo, Unhas
  active: boolean;
  price_type?: 'fixed' | 'from' | 'assessment';
}

export interface Customer {
  id: string; // UUID
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
  notes?: string;
  loyalty_points: number;
  is_vip: boolean;
  total_spent: number;
  last_visit?: string;
  technical_file_allergies?: string;
  technical_file_formulas?: string;
  created_at: string;
}

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'waiting' | 'in_service' | 'completed' | 'cancelled' | 'no_show' | 'blocked';

export interface Appointment {
  id: string; // UUID
  customer_id?: string; // Foreign Key para Customer (Opcional se for bloqueio)
  professional_id: string; // Foreign Key para Professional
  service_id?: string; // Foreign Key para Service
  
  // Dados desnormalizados para facilitar leitura rápida (opcional, mas comum)
  customer_name: string; 
  service_name?: string;
  price: number;
  
  start_time: string; // Timestamp TZ
  end_time: string; // Timestamp TZ
  status: AppointmentStatus;
  is_blocked: boolean;
  block_reason?: string;
  created_at: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string; // UUID
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // Timestamp TZ
  appointment_id?: string; // Relacionamento opcional se a entrada veio de um serviço
  created_at: string;
}

export interface InventoryItem {
  id: string; // UUID
  name: string;
  category: string;
  quantity: number;
  min_quantity: number;
  unit_price: number;
  created_at: string;
}
