import React, { useState, useEffect, useRef } from "react";
import { getDashboardData } from "../services/api/dashboard";
import { Appointment, Customer } from "../types";
import { cn } from "../utils/cn";
import {
  TrendingUp,
  Users,
  Calendar as CalendarIcon,
  AlertCircle,
  Cake,
  Clock,
  ChevronRight,
  Loader2,
  X,
  MessageCircle,
  Gift,
  Package,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type DrawerType =
  | "appointments"
  | "newCustomers"
  | "stockAlerts"
  | "professional"
  | "birthday"
  | null;

type DateFilter = "today" | "week" | "month";

interface DateRange {
  from: Date;
  to: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getDateRange(filter: DateFilter): DateRange {
  const now = new Date();
  switch (filter) {
    case "today":
      return { from: now, to: now };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
    case "month":
      return { from: startOfMonth(now), to: now };
    default:
      return { from: subDays(now, 30), to: now };
  }
}

function filterLabel(filter: DateFilter): string {
  return (
    { today: "Hoje", week: "Esta semana", month: "Este mês" }[
    filter
    ] ?? "Hoje"
  );
}

// ---------------------------------------------------------------------------
// Drawer component
// ---------------------------------------------------------------------------
function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-aura-charcoal/5">
              <h2 className="font-serif text-xl">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-aura-soft-gray transition-colors text-aura-charcoal/40 hover:text-aura-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Date Filter Dropdown
// ---------------------------------------------------------------------------
function DateFilterButton({
  value,
  onChange,
}: {
  value: DateFilter;
  onChange: (v: DateFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { id: DateFilter; label: string; description: string }[] = [
    { id: "today", label: "Hoje", description: "Somente o movimento de hoje" },
    { id: "week", label: "Últimos 7 dias", description: "Uma leitura rápida da semana" },
    { id: "month", label: "Este mês", description: "Do primeiro dia até agora" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-w-32 items-center justify-between gap-2 rounded-xl bg-aura-soft-gray px-4 py-2.5 text-xs font-semibold text-aura-charcoal/70 transition-all hover:bg-aura-gold/10 hover:text-aura-gold"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
        {filterLabel(value)}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute right-0 top-full z-50 mt-3 min-w-[280px] overflow-hidden rounded-2xl border border-aura-charcoal/10 bg-white p-2 text-aura-charcoal shadow-2xl shadow-aura-charcoal/15"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-aura-soft-gray",
                  value === opt.id ? "bg-aura-gold/8" : "text-aura-charcoal/70"
                )}
              >
                <span><strong className={cn("block text-sm", value === opt.id ? "text-aura-gold" : "text-aura-charcoal")}>{opt.label}</strong><small className="mt-1 block text-[10px] font-normal text-aura-charcoal/45">{opt.description}</small></span>
                <span className={cn("h-2 w-2 shrink-0 rounded-full", value === opt.id ? "bg-aura-gold" : "bg-aura-charcoal/10")} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------
export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // States para os dados da API
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [birthdays, setBirthdays] = useState<Customer[]>([]);
  const [newCustomers, setNewCustomers] = useState<Customer[]>([]);
  const [criticalStock, setCriticalStock] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topProfessional, setTopProfessional] = useState<any>({
    name: "Aguardando dados...", role: "-", appointments: 0, revenue: 0
  });
  const [stats, setStats] = useState({
    revenue: 0, appointments: 0, newCustomers: 0, stockAlerts: 0
  });

  // UI States
  const [drawerType, setDrawerType] = useState<DrawerType>(null);
  const [selectedBirthday, setSelectedBirthday] = useState<Customer | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");

  const cards = [
    {
      label: "Receita",
      value: `R$ ${stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      trend: "Faturamento",
      color: "text-aura-sage",
      drawer: null as DrawerType,
      description: "Total faturado no período selecionado",
    },
    {
      label: "Agendamentos",
      value: stats.appointments,
      icon: CalendarIcon,
      trend: "Pendentes",
      color: "text-aura-gold",
      drawer: "appointments" as DrawerType,
      description: "Agendamentos pendentes (não concluídos)",
    },
    {
      label: "Novos Clientes",
      value: stats.newCustomers,
      icon: Users,
      trend: "Novos",
      color: "text-aura-clay",
      drawer: "newCustomers" as DrawerType,
      description: "Cadastrados nos últimos 30 dias",
    },
    {
      label: "Alertas de Estoque",
      value: stats.stockAlerts,
      icon: AlertCircle,
      trend: "Crítico",
      color: "text-red-500",
      drawer: "stockAlerts" as DrawerType,
      description: "Produtos abaixo do estoque mínimo",
    },
  ];

  useEffect(() => {
    const isLocalPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === "true";
    if (isLocalPreview) {
      const today = new Date();
      const at = (hour: number, minute = 0) => {
        const date = new Date(today);
        date.setHours(hour, minute, 0, 0);
        return date.toISOString();
      };
      const previewAppointments: Appointment[] = [
        { id: "preview-1", professional_id: "preview", customer_name: "Mariana Souza", service_name: "Corte e escova", price: 120, start_time: at(10), end_time: at(11, 30), status: "confirmed", is_blocked: false, created_at: today.toISOString() },
        { id: "preview-2", professional_id: "preview", customer_name: "Cláudia Santos", service_name: "Manicure", price: 55, start_time: at(13, 30), end_time: at(14, 30), status: "scheduled", is_blocked: false, created_at: today.toISOString() },
        { id: "preview-3", professional_id: "preview", customer_name: "Rafaela Lima", service_name: "Tratamento facial", price: 150, start_time: at(16), end_time: at(17), status: "confirmed", is_blocked: false, created_at: today.toISOString() },
      ];
      setStats({ revenue: 4280, appointments: previewAppointments.length, newCustomers: 12, stockAlerts: 3 });
      setUpcomingAppointments(previewAppointments);
      setPendingAppointments(previewAppointments);
      setBirthdays([{ id: "preview-customer", name: "Aline Oliveira", phone: "71999999999", loyalty_points: 72, is_vip: true, total_spent: 940, created_at: today.toISOString() }]);
      setNewCustomers([]);
      setCriticalStock([{ id: "preview-stock", name: "Máscara de hidratação", quantity: 1, min_quantity: 3 }]);
      setChartData([
        { name: "Seg", value: 520 }, { name: "Ter", value: 780 }, { name: "Qua", value: 640 },
        { name: "Qui", value: 910 }, { name: "Sex", value: 760 }, { name: "Sáb", value: 670 },
      ]);
      setTopProfessional({ name: "Ana Modesto", role: "Cabeleireira", appointments: 18, revenue: 2860 });
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      try {
        setLoading(true);

        const data = await getDashboardData(dateFilter);

        setUpcomingAppointments(data.todayAppointments);
        setPendingAppointments(data.pendingAppointments);
        setBirthdays(data.birthdays);
        setNewCustomers(data.newCustomers);
        setStats(data.stats);
        setCriticalStock(data.inventory);
        setChartData(data.chartData);
        if (data.topProfessional) setTopProfessional(data.topProfessional);

      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [dateFilter]);

  const openDrawer = (type: DrawerType) => {
    if (!type) return;
    setDrawerType(type);
  };

  const handleBirthdayAction = (customer: Customer) => {
    setSelectedBirthday(customer);
    setDrawerType("birthday");
  };

  const whatsappLink = (phone: string, name: string) => {
    const msg = encodeURIComponent(
      `Olá ${name}! 🎂 A equipe do salão deseja um feliz aniversário! Como presente especial, você ganhou um cupom de 15% de desconto no seu próximo agendamento. Use o código: ANIVER15 💛`
    );
    return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${msg}`;
  };

  const renderDrawerContent = () => {
    switch (drawerType) {
      // ---- Agendamentos ----
      case "appointments":
        return (
          <div className="space-y-3">
            <p className="text-xs text-aura-charcoal/40 uppercase tracking-widest font-semibold mb-4">
              Agendamentos não concluídos · {filterLabel(dateFilter)}
            </p>
            {pendingAppointments.length === 0 ? (
              <div className="text-center py-12 text-aura-charcoal/30">
                <CalendarIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum agendamento pendente</p>
              </div>
            ) : (
              pendingAppointments.map((appt, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl border border-aura-charcoal/5 hover:border-aura-gold/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-serif text-base">{appt.customer_name}</p>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                          appt.status === "confirmed"
                            ? "bg-green-100 text-green-700"
                            : appt.status === "scheduled"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-aura-soft-gray text-aura-charcoal/50"
                        )}
                      >
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-aura-charcoal/40">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">
                        {format(new Date(appt.start_time), "HH:mm · dd/MM")}
                      </span>
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        );

      // ---- Novos Clientes ----
      case "newCustomers":
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-aura-gold/5 border border-aura-gold/10 mb-6">
              <p className="text-xs text-aura-charcoal/60 leading-relaxed">
                <strong className="text-aura-charcoal">O que é um novo cliente?</strong>
                <br />
                Clientes cujo cadastro foi criado nos{" "}
                <strong>últimos 30 dias</strong>. Independente de já terem agendado ou não.
              </p>
            </div>
            <p className="text-xs text-aura-charcoal/40 uppercase tracking-widest font-semibold">
              {stats.newCustomers} novos clientes · últimos 30 dias
            </p>

            {newCustomers.length === 0 ? (
              <div className="text-center py-10 text-aura-charcoal/40">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum cliente novo neste período.</p>
              </div>
            ) : (
              newCustomers.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl border border-aura-charcoal/5 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-aura-soft-gray flex items-center justify-center text-aura-charcoal/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-aura-charcoal/40">
                      {c.phone || "Sem telefone"}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        );

      // ---- Alertas de Estoque ----
      case "stockAlerts":
        return (
          <div className="space-y-3">
            <p className="text-xs text-aura-charcoal/40 uppercase tracking-widest font-semibold mb-4">
              {criticalStock.length} produtos em estado crítico
            </p>
            {criticalStock.length === 0 ? (
              <p className="text-center text-sm text-aura-charcoal/40 py-10">Estoque regularizado.</p>
            ) : (
              criticalStock.map((item, i) => {
                const min = item.min_quantity || 1;
                const pct = Math.round((item.quantity / min) * 100);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-4 rounded-2xl border border-red-100 bg-red-50/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-red-100 text-red-500">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-aura-charcoal/40">
                            Mínimo exigido: {item.min_quantity}
                          </p>
                        </div>
                      </div>
                      <span className="text-lg font-serif text-red-500 font-bold">
                        {item.quantity}
                        <span className="text-xs font-sans text-red-400 ml-1">un</span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-red-400 mt-1 text-right">
                      {pct}% do mínimo
                    </p>
                  </motion.div>
                );
              })
            )}
          </div>
        );

      // ---- Profissional da semana ----
      case "professional":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-gray-900 text-white">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-aura-gold">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="font-serif text-xl">{topProfessional.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-aura-gold mt-0.5">
                  {topProfessional.role}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-aura-gold/5 border border-aura-gold/10">
              <p className="text-xs text-aura-charcoal/60 leading-relaxed">
                <strong className="text-aura-charcoal">Como é definido?</strong>
                <br />O profissional com <strong>maior faturamento gerado</strong>{" "}
                no período selecionado. Serviços concluídos e pagos contam.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Faturamento", value: `R$ ${topProfessional.revenue.toLocaleString("pt-BR")}`, icon: TrendingUp },
                { label: "Atendimentos", value: topProfessional.appointments, icon: CheckCircle2 },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-2xl border border-aura-charcoal/5 text-center"
                >
                  <stat.icon className="w-4 h-4 text-aura-gold mx-auto mb-2" />
                  <p className="font-serif text-lg">{stat.value}</p>
                  <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      // ---- Birthday action ----
      case "birthday":
        if (!selectedBirthday) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-aura-clay/5 border border-aura-clay/10">
              <div className="w-14 h-14 rounded-full bg-aura-clay/10 flex items-center justify-center text-aura-clay">
                <Cake className="w-7 h-7" />
              </div>
              <div>
                <p className="font-serif text-lg">{selectedBirthday.name}</p>
                <p className="text-xs text-aura-charcoal/40">Aniversariante do Mês</p>
              </div>
            </div>

            <p className="text-xs text-aura-charcoal/50 leading-relaxed">
              Envie uma mensagem de parabéns com um cupom de desconto. O link
              vai abrir o WhatsApp com a mensagem pronta — é só enviar!
            </p>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-aura-gold/10 to-aura-clay/10 border border-aura-gold/20">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-4 h-4 text-aura-gold" />
                <span className="text-xs font-bold text-aura-gold uppercase tracking-widest">
                  Cupom gerado
                </span>
              </div>
              <p className="font-serif text-2xl">ANIVER15</p>
              <p className="text-xs text-aura-charcoal/50">15% de desconto · próximo agendamento</p>
            </div>

            <a
              href={whatsappLink(
                (selectedBirthday as any).phone ?? "00000000000",
                selectedBirthday.name
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20b857] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Enviar parabéns no WhatsApp
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  const drawerTitles: Record<NonNullable<DrawerType>, string> = {
    appointments: "Agendamentos Pendentes",
    newCustomers: "Novos Clientes",
    stockAlerts: "Alertas de Estoque",
    professional: "Profissional em Destaque",
    birthday: `Parabéns, ${selectedBirthday?.name?.split(" ")[0] ?? ""}! 🎂`,
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-aura-gold" />
      </div>
    );
  }

  return (
    <>
      <Drawer
        open={!!drawerType}
        onClose={() => {
          setDrawerType(null);
          setSelectedBirthday(null);
        }}
        title={drawerType ? drawerTitles[drawerType] : ""}
      >
        {renderDrawerContent()}
      </Drawer>

      <div className="space-y-7 lg:space-y-9">
        <section className="relative rounded-[28px] bg-aura-charcoal px-6 py-7 text-white sm:px-9 sm:py-9">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-aura-clay/20" />
            <div className="absolute -bottom-28 right-40 h-56 w-56 rounded-full border border-white/10" />
          </div>
          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div className="[&>div>button]:border-white/10 [&>div>button]:bg-white/10 [&>div>button]:text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#efa7ba]">Resumo do salão</p>
              <h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-[0.95] sm:text-5xl">
                Tudo o que importa,<br /><em className="font-normal text-[#efa7ba]">logo no começo do dia.</em>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
                Acompanhe a agenda, o movimento e os pontos que precisam da sua atenção.
              </p>
            </div>
            <div>
              <DateFilterButton value={dateFilter} onChange={setDateFilter} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => openDrawer(card.drawer)}
              className={cn(
                "glass-card min-h-[180px] p-5 sm:p-6 flex flex-col justify-between",
                card.drawer
                  ? "cursor-pointer hover:-translate-y-1 hover:border-aura-gold/30 hover:shadow-xl transition-all group"
                  : ""
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`p-3 rounded-xl bg-aura-soft-gray ${card.color} ${card.drawer ? "group-hover:scale-105 transition-transform" : ""
                    }`}
                >
                  <card.icon className="w-6 h-6" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full",
                    card.trend === "Crítico"
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  )}
                >
                  {card.trend}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-aura-charcoal/40 text-xs uppercase tracking-widest">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-3xl font-semibold">{card.value}</p>
                {card.drawer && (
                  <p className="text-[10px] text-aura-gold/70 mt-2 flex items-center gap-1 group-hover:text-aura-gold transition-colors">
                    Ver detalhes <ChevronRight className="w-3 h-3" />
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 glass-card p-5 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div><p className="admin-kicker">Movimento financeiro</p><h3 className="mt-1 text-2xl font-serif font-semibold">Fluxo de receita</h3></div>
              <p className="text-xs uppercase tracking-widest text-aura-charcoal/40 font-bold">
                {filterLabel(dateFilter)}
              </p>
            </div>
            <div className="h-[300px] min-w-0 w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 720, height: 300 }}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d86f8d" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#d86f8d" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#999" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#999" }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#b84f70"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-8">
            {/* Top Professional — CLICÁVEL, HARMONIZADO COM O TEMA CLARO */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              onClick={() => openDrawer("professional")}
              className="group cursor-pointer rounded-2xl border border-aura-charcoal/10 bg-aura-clay p-6 text-aura-charcoal shadow-[0_18px_55px_rgba(54,69,79,0.08)] transition-all"
            >
              <div className="flex items-center justify-between mb-5 border-b border-aura-charcoal/15 pb-4">
                <h4 className="text-sm font-serif italic text-aura-gold font-bold">
                  Profissional da Semana
                </h4>
                <TrendingUp className="w-5 h-5 text-aura-charcoal" />
              </div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-aura-charcoal flex items-center justify-center text-white">
                  <Users className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  {/* Nome em cor escura padrão */}
                  <p className="font-serif text-xl text-aura-charcoal font-bold leading-tight">
                    {topProfessional.name}
                  </p>
                  {/* Cargo em cor escura com opacidade para hierarquia */}
                  <p className="text-[10px] uppercase tracking-[0.2em] text-aura-charcoal/60 font-bold mt-1">
                    {topProfessional.role}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-serif text-aura-charcoal leading-none">R$ {topProfessional.revenue.toLocaleString("pt-BR")}</p>
                  <p className="text-[10px] text-aura-charcoal/40 uppercase tracking-widest mt-1">
                    {topProfessional.appointments} atendimentos
                  </p>
                </div>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/65 mt-6 text-right flex items-center justify-end gap-1.5 border-t border-aura-charcoal/15 pt-4">
                Ver desempenho completo <ChevronRight className="w-3.5 h-3.5" />
              </p>
            </motion.div>

            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-serif italic">Aniversariantes</h4>
                <Cake className="w-4 h-4 text-aura-clay" />
              </div>
              <div className="space-y-4">
                {birthdays.length > 0 ? (
                  birthdays.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between group cursor-pointer"
                      onClick={() => handleBirthdayAction(b)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-aura-soft-gray flex items-center justify-center text-aura-charcoal/30">
                          <Users className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-medium group-hover:text-aura-gold transition-colors">
                          {b.name}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Impede de abrir o Drawer e já manda pro Zap direto
                          window.open(whatsappLink((b as any).phone ?? "00000000000", b.name), '_blank');
                        }}
                        className="p-1.5 rounded-full bg-aura-soft-gray text-aura-charcoal/40 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-aura-charcoal/40 text-center py-2">
                    Nenhum aniversariante neste mês.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-serif">Próximos Agendamentos de Hoje</h3>
            <button onClick={() => navigate('/admin/calendar')} className="text-[10px] uppercase tracking-widest text-aura-gold font-bold hover:underline">
              Ver Agenda Completa
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-2xl border border-aura-charcoal/5 hover:border-aura-gold/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-aura-gold">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-bold">
                        {format(new Date(appt.start_time), "HH:mm")}
                      </span>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold",
                      appt.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-aura-soft-gray text-aura-charcoal/60"
                    )}>
                      {appt.status === "confirmed" ? "Confirmado" : "Pendente"}
                    </span>
                  </div>
                  <p className="font-serif text-lg mb-1">{appt.customer_name}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-aura-charcoal/40">{appt.service_name || 'Serviço Agendado'}</p>
                    <div className="w-6 h-6 rounded-full bg-aura-soft-gray flex items-center justify-center text-aura-charcoal/20">
                      <Users className="w-3 h-3" />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-aura-charcoal/30">
                Nenhum agendamento pendente para hoje. Aproveite para organizar o salão! ✨
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
