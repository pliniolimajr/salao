import { useEffect, useMemo, useState } from "react";
import { getReportData, ReportData } from "../services/api/reports";
import { Download, TrendingUp, TrendingDown, Users, CalendarDays, Loader2, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === "true";
const COLORS = ["#b84f70", "#36454f", "#d86f8d", "#6d8b79", "#d6a96c"];

const previewReports: Record<string, ReportData> = {
  week: {
    performanceData: [
      { name: "Seg", revenue: 520, expenses: 90 }, { name: "Ter", revenue: 680, expenses: 140 },
      { name: "Qua", revenue: 430, expenses: 70 }, { name: "Qui", revenue: 790, expenses: 220 },
      { name: "Sex", revenue: 980, expenses: 160 }, { name: "Sáb", revenue: 1240, expenses: 180 },
    ],
    serviceDistribution: [{ name: "Escova", value: 18 }, { name: "Manicure", value: 14 }, { name: "Corte", value: 10 }, { name: "Coloração", value: 7 }],
    stats: { averageTicket: 112.4, cancellationRate: 6.8, totalAppointments: 53 },
  },
  month: {
    performanceData: [
      { name: "Sem 1", revenue: 3420, expenses: 980 }, { name: "Sem 2", revenue: 4180, expenses: 1240 },
      { name: "Sem 3", revenue: 3890, expenses: 830 }, { name: "Sem 4", revenue: 4760, expenses: 1190 },
    ],
    serviceDistribution: [{ name: "Escova", value: 64 }, { name: "Manicure", value: 48 }, { name: "Corte", value: 37 }, { name: "Coloração", value: 29 }, { name: "Hidratação", value: 23 }],
    stats: { averageTicket: 118.7, cancellationRate: 5.4, totalAppointments: 214 },
  },
  year: {
    performanceData: [
      { name: "Jan", revenue: 12400, expenses: 4250 }, { name: "Fev", revenue: 13900, expenses: 4680 },
      { name: "Mar", revenue: 14800, expenses: 4920 }, { name: "Abr", revenue: 15300, expenses: 5100 },
      { name: "Mai", revenue: 16150, expenses: 5280 }, { name: "Jun", revenue: 17200, expenses: 5450 },
    ],
    serviceDistribution: [{ name: "Escova", value: 342 }, { name: "Manicure", value: 281 }, { name: "Corte", value: 236 }, { name: "Coloração", value: 172 }, { name: "Hidratação", value: 148 }],
    stats: { averageTicket: 121.3, cancellationRate: 4.9, totalAppointments: 1246 },
  },
};

const ranges = [{ id: "week", label: "Semana" }, { id: "month", label: "Mês" }, { id: "year", label: "Ano" }];

export function Reports() {
  const [timeRange, setTimeRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setReportData(isPreview ? previewReports[timeRange] : await getReportData());
      } catch (error) {
        console.error("Erro ao carregar relatórios:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [timeRange]);

  const totals = useMemo(() => {
    const rows = reportData?.performanceData || [];
    const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
    const expenses = rows.reduce((sum, row) => sum + row.expenses, 0);
    return { revenue, expenses, margin: revenue ? ((revenue - expenses) / revenue) * 100 : 0 };
  }, [reportData]);

  if (loading || !reportData) return <div className="flex h-full flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-aura-gold" /></div>;

  const stats = [
    { label: "Ticket médio", value: `R$ ${reportData.stats.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-aura-sage", background: "bg-aura-sage/10" },
    { label: "Agendamentos", value: reportData.stats.totalAppointments, icon: CalendarDays, color: "text-aura-gold", background: "bg-aura-gold/10" },
    { label: "Cancelamentos", value: `${reportData.stats.cancellationRate.toFixed(1)}%`, icon: TrendingDown, color: "text-red-500", background: "bg-red-50" },
    { label: "Margem estimada", value: `${totals.margin.toFixed(1)}%`, icon: Sparkles, color: "text-aura-clay", background: "bg-aura-clay/10" },
  ];

  return (
    <div className="space-y-6 print:m-0 print:space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-aura-charcoal p-6 text-white shadow-xl sm:p-8 print:bg-white print:p-0 print:text-aura-charcoal print:shadow-none">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-aura-gold/20 blur-3xl print:hidden" />
        <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="admin-kicker text-aura-gold">Inteligência do negócio</p>
            <h3 className="mt-2 font-serif text-3xl sm:text-4xl">O salão em perspectiva.</h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55 print:text-aura-charcoal/60">Indicadores para entender o movimento, proteger a margem e tomar decisões com mais segurança.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row print:hidden">
            <div className="flex rounded-full bg-white/10 p-1 backdrop-blur-sm">
              {ranges.map(range => <button key={range.id} onClick={() => setTimeRange(range.id)} className={`flex-1 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${timeRange === range.id ? "bg-white text-aura-charcoal shadow-sm" : "text-white/55 hover:text-white"}`}>{range.label}</button>)}
            </div>
            <button onClick={() => window.print()} className="aura-button flex items-center justify-center gap-2 bg-aura-gold text-white hover:brightness-105"><Download className="h-4 w-4" /> Exportar PDF</button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-4">
        {stats.map(stat => <div key={stat.label} className="glass-card min-h-36 border border-aura-charcoal/5 p-6 print:shadow-none"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-2xl ${stat.background}`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div><p className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/40">{stat.label}</p><p className="mt-1 font-serif text-2xl text-aura-charcoal">{stat.value}</p></div>)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 print:block print:space-y-6">
        <section className="glass-card border border-aura-charcoal/5 p-5 sm:p-8 xl:col-span-2 print:shadow-none">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="admin-kicker">Resultado do período</p><h4 className="mt-1 font-serif text-xl text-aura-charcoal">Receita e despesas</h4></div><p className="text-xs text-aura-charcoal/45">Receita <span className="font-bold text-aura-charcoal">R$ {totals.revenue.toLocaleString("pt-BR")}</span></p></div>
          <div className="h-[330px] w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><BarChart data={reportData.performanceData} barGap={8}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eadfe2" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7a7476" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#7a7476" }} /><Tooltip cursor={{ fill: "#f4eef0" }} contentStyle={{ borderRadius: 16, border: "1px solid #eadfe2", boxShadow: "0 14px 30px rgba(54,69,79,.1)" }} /><Bar dataKey="revenue" fill="#b84f70" radius={[8, 8, 0, 0]} name="Receita" /><Bar dataKey="expenses" fill="#36454f" radius={[8, 8, 0, 0]} name="Despesas" /></BarChart></ResponsiveContainer></div>
        </section>

        <section className="glass-card flex flex-col border border-aura-charcoal/5 p-5 sm:p-8 print:shadow-none">
          <p className="admin-kicker">Preferências</p><h4 className="mt-1 font-serif text-xl text-aura-charcoal">Serviços realizados</h4>
          <div className="relative h-[250px] w-full"><ResponsiveContainer width="100%" height="100%" minWidth={0}><PieChart><Pie data={reportData.serviceDistribution} innerRadius={62} outerRadius={88} paddingAngle={4} dataKey="value" stroke="none">{reportData.serviceDistribution.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex items-center justify-center"><div className="text-center"><p className="font-serif text-2xl text-aura-charcoal">{reportData.serviceDistribution.reduce((sum, item) => sum + item.value, 0)}</p><p className="text-[9px] font-bold uppercase tracking-widest text-aura-charcoal/40">serviços</p></div></div></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">{reportData.serviceDistribution.map((item, index) => <div key={item.name} className="flex items-center justify-between rounded-xl bg-white/70 px-3 py-2"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><span className="text-xs text-aura-charcoal/65">{item.name}</span></div><span className="text-xs font-bold text-aura-charcoal">{item.value}</span></div>)}</div>
        </section>
      </div>

      <section className="grid gap-4 rounded-3xl border border-aura-gold/15 bg-aura-gold/5 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aura-gold text-white"><Users className="h-5 w-5" /></div>
        <div><p className="font-serif text-lg text-aura-charcoal">Leitura do período</p><p className="mt-1 text-sm leading-relaxed text-aura-charcoal/55">A margem estimada está em {totals.margin.toFixed(1)}%. Escova e manicure concentram boa parte da procura e podem orientar combos, campanhas e horários da equipe.</p></div>
      </section>
    </div>
  );
}
