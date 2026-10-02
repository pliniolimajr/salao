import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
    console.warn('Supabase não configurado: site público disponível, mas dados, login e agendamentos exigem um arquivo .env.');
}

// A configuração local ausente não deve derrubar a landing page inteira.
// O cliente de fallback mantém os módulos importáveis; operações remotas
// ainda falham de forma normal até as credenciais reais serem fornecidas.
export const supabase = createClient(
    supabaseUrl || 'http://127.0.0.1:54321',
    supabaseAnonKey || 'supabase-not-configured',
);
