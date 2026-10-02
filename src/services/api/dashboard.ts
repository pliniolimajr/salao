import { supabase } from '../supabase';
import { differenceInCalendarDays, endOfDay, format, parseISO, startOfDay, startOfMonth, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardData {
  stats: {
    revenue: number;
    appointments: number;
    newCustomers: number;
    stockAlerts: number;
  };
  pendingAppointments: any[];
  todayAppointments: any[];
  birthdays: any[];
  newCustomers: any[];
  inventory: any[];
  chartData: { name: string; value: number }[];
  topProfessional: any;
}

export type DashboardPeriod = 'today' | 'week' | 'month';

export async function getDashboardData(period: DashboardPeriod = 'week'): Promise<DashboardData> {
  const today = new Date();
  const endDate = endOfDay(today);
  const startDate = period === 'today'
    ? startOfDay(today)
    : period === 'month'
      ? startOfMonth(today)
      : startOfDay(subDays(today, 6));
  const daysRange = differenceInCalendarDays(endDate, startDate) + 1;
  const thirtyDaysAgo = startOfDay(subDays(today, 30));

  // 1. Buscar Agendamentos do período (para contar pendentes e faturamento do Top Profissional)
  const { data: appointments, error: apptError } = await supabase
    .from('appointments')
    .select('*')
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: true });

  if (apptError) throw new Error(apptError.message);

  // Separar Agendamentos de HOJE para a lista principal
  const startOfToday = startOfDay(today);
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const todayAppointments = appointments?.filter(a =>
    new Date(a.start_time) >= startOfToday &&
    new Date(a.start_time) < endOfToday &&
    (a.status === 'scheduled' || a.status === 'confirmed')
  ) || [];

  // Manter a contagem e a listagem baseadas exatamente nos mesmos registros.
  const pendingAppointments = appointments?.filter(a =>
    a.status === 'scheduled' || a.status === 'confirmed'
  ) || [];
  const pendingAppointmentsCount = pendingAppointments.length;


  // 2. Transações (Para calcular a Receita real do período e o Gráfico)
  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .eq('type', 'income')
    .eq('status', 'pago');

  if (transactionsError) throw new Error(transactionsError.message);

  const totalRevenue = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;


  // 3. Novos Clientes (Últimos 30 dias - conforme a regra de negócio da UI)
  const { data: newCustomersData } = await supabase
    .from('customers')
    .select('*')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });


  // 4. Aniversariantes do Mês Atual
  const currentMonthStr = format(today, 'MM');
  const { data: allCustomers } = await supabase.from('customers').select('*');

  const birthdays = allCustomers?.filter(c => {
    if (!c.birthday) return false;
    // Identifica se a data vem do Supabase (YYYY-MM-DD) ou digitada manual (DD/MM/YYYY)
    const month = c.birthday.includes('-')
      ? c.birthday.split('-')[1]
      : c.birthday.split('/')[1];

    return month === currentMonthStr;
  }) || [];


  // 5. Estoque Crítico
  const { data: inventory } = await supabase.from('inventory').select('*');
  const criticalStock = inventory?.filter(item => item.quantity <= item.min_quantity) || [];


  // 6. Profissional da Semana (Cálculo Automático)
  const { data: professionals } = await supabase.from('professionals').select('*');
  let topProf = null;

  if (professionals && appointments && appointments.length > 0) {
    const profRevenue: Record<string, { revenue: number, count: number }> = {};

    // Agrupa o faturamento apenas dos serviços "Concluídos" no período
    appointments.filter(a => a.status === 'completed').forEach(appt => {
      if (!profRevenue[appt.professional_id]) {
        profRevenue[appt.professional_id] = { revenue: 0, count: 0 };
      }
      profRevenue[appt.professional_id].revenue += Number(appt.price || 0);
      profRevenue[appt.professional_id].count += 1;
    });

    let maxRev = -1;
    let bestProfId = null;

    Object.entries(profRevenue).forEach(([profId, data]) => {
      if (data.revenue > maxRev) {
        maxRev = data.revenue;
        bestProfId = profId;
      }
    });

    if (bestProfId) {
      const profDetails = professionals.find(p => p.id === bestProfId);
      if (profDetails) {
        topProf = {
          name: profDetails.name,
          role: profDetails.role,
          appointments: profRevenue[bestProfId].count,
          revenue: maxRev
        };
      }
    }
  }

  // Fallback caso não haja serviços concluídos nesta semana
  if (!topProf && professionals && professionals.length > 0) {
    topProf = {
      name: professionals[0].name,
      role: professionals[0].role,
      appointments: 0,
      revenue: 0
    };
  }


  // 7. Dados do Gráfico de Área (Agrupar receita por dia)
  const chartMap = new Map();

  // Criar os pontos no eixo X (Dias)
  for (let i = daysRange - 1; i >= 0; i--) {
    const d = subDays(today, i);
    const dateKey = format(d, 'yyyy-MM-dd');

    // Se o filtro for de 7 dias, mostra "Seg, Ter...", se for mais, mostra a data "15/04"
    const label = daysRange <= 7
      ? format(d, 'EEE', { locale: ptBR }).replace('.', '') // "seg", "ter"
      : format(d, 'dd/MM');

    chartMap.set(dateKey, { name: label.charAt(0).toUpperCase() + label.slice(1), value: 0 });
  }

  // Preencher os valores com as transações
  transactions?.forEach(tx => {
    const dateKey = format(parseISO(tx.date), 'yyyy-MM-dd');
    if (chartMap.has(dateKey)) {
      const current = chartMap.get(dateKey);
      current.value += Number(tx.amount);
    }
  });

  const chartData = Array.from(chartMap.values());


  // 8. Retornar tudo estruturado para o Dashboard.tsx
  return {
    stats: {
      revenue: totalRevenue,
      appointments: pendingAppointmentsCount,
      newCustomers: newCustomersData?.length || 0,
      stockAlerts: criticalStock.length
    },
    pendingAppointments,
    todayAppointments,
    birthdays,
    newCustomers: newCustomersData || [],
    inventory: criticalStock,
    chartData,
    topProfessional: topProf
  };
}
