import React, { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointmentFull, deleteAppointment } from '../services/api/appointments';
import { getProfessionals } from '../services/api/professionals';
import { getActiveServices, createService } from '../services/api/services'; // ✅ Novas importações
import { Appointment, Professional, AppointmentStatus, Service } from '../types';
import { cn } from '../utils/cn';
import {
  Plus, ChevronLeft, ChevronRight, Ban, Loader2,
  Clock, User, CheckCircle2, XCircle, MessageCircle, Edit2, Trash2, Check, Scissors
} from 'lucide-react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_APPT = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  customer_birthday: '',
  service_name: '',
  professional_id: '',
  start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  price: 0,
  is_blocked: false,
  status: 'scheduled' as AppointmentStatus
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]); // ✅ Estado para os serviços do banco
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [selectedProf, setSelectedProf] = useState<string>('all');

  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<AppointmentStatus | null>(null);
  const [formAppt, setFormAppt] = useState<Partial<Appointment>>(INITIAL_APPT);

  // ✅ Estados para Multi-Serviços e Criação de Novo
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [newService, setNewService] = useState({ name: '', price: 0, duration_minutes: 60 });
  const [isSavingService, setIsSavingService] = useState(false);

  const fetchData = useCallback(async () => {
    const isLocalPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';
    if (isLocalPreview) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const at = (dayOffset: number, hour: number, minute = 0) => {
        const date = addDays(weekStart, dayOffset);
        date.setHours(hour, minute, 0, 0);
        return date.toISOString();
      };
      const previewProfessionals: Professional[] = [
        { id: 'preview-ana', name: 'Ana Modesto', role: 'Cabeleireira', active: true, commission_rate: 35, goals_monthly_revenue: 8000, goals_appointments: 60, off_days: [0], created_at: new Date().toISOString() },
        { id: 'preview-julia', name: 'Júlia Santos', role: 'Manicure', active: true, commission_rate: 30, goals_monthly_revenue: 5000, goals_appointments: 70, off_days: [1], created_at: new Date().toISOString() },
      ];
      const previewServices: Service[] = [
        { id: 'preview-cut', name: 'Corte e escova', price: 120, duration_minutes: 90, category: 'Cabelo', active: true },
        { id: 'preview-nails', name: 'Manicure', price: 55, duration_minutes: 60, category: 'Mãos e pés', active: true },
        { id: 'preview-care', name: 'Tratamento facial', price: 150, duration_minutes: 60, category: 'Pele', active: true },
      ];
      setProfessionals(previewProfessionals);
      setServices(previewServices);
      setAppointments([
        { id: 'preview-a1', professional_id: 'preview-ana', customer_name: 'Mariana Souza', customer_phone: '71999999999', service_name: 'Corte e escova', price: 120, start_time: at(2, 10), end_time: at(2, 11, 30), status: 'confirmed', is_blocked: false, created_at: new Date().toISOString() },
        { id: 'preview-a2', professional_id: 'preview-julia', customer_name: 'Cláudia Santos', customer_phone: '71988888888', service_name: 'Manicure', price: 55, start_time: at(2, 13, 30), end_time: at(2, 14, 30), status: 'scheduled', is_blocked: false, created_at: new Date().toISOString() },
        { id: 'preview-a3', professional_id: 'preview-ana', customer_name: 'Rafaela Lima', service_name: 'Tratamento facial', price: 150, start_time: at(4, 15), end_time: at(4, 16), status: 'confirmed', is_blocked: false, created_at: new Date().toISOString() },
        { id: 'preview-block', professional_id: 'preview-julia', customer_name: 'HORÁRIO BLOQUEADO', service_name: 'Almoço', price: 0, start_time: at(5, 12), end_time: at(5, 13), status: 'blocked', is_blocked: true, created_at: new Date().toISOString() },
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const start = viewMode === 'week' ? startOfWeek(currentDate, { weekStartsOn: 0 }) : startOfDay(currentDate);
      const end = viewMode === 'week' ? addDays(start, 7) : endOfDay(currentDate);

      const [apptData, profData, servData] = await Promise.all([
        getAppointments(start, end),
        getProfessionals(),
        getActiveServices() // ✅ Busca os serviços reais
      ]);

      setAppointments(apptData);
      setProfessionals(profData);
      setServices(servData);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Lógica de Multi-Select de Serviços
  const toggleService = (service: Service) => {
    const isSelected = selectedServices.find(s => s.id === service.id);
    let newSelected: Service[];

    if (isSelected) {
      newSelected = selectedServices.filter(s => s.id !== service.id);
    } else {
      newSelected = [...selectedServices, service];
    }

    setSelectedServices(newSelected);

    // Atualiza automaticamente o nome final e soma os preços
    const finalName = newSelected.map(s => s.name).join(' + ');
    const finalPrice = newSelected.reduce((sum, s) => sum + Number(s.price), 0);

    setFormAppt(prev => ({
      ...prev,
      service_name: finalName,
      price: finalPrice
    }));
  };

  // ✅ Função para criar serviço na hora
  const handleCreateNewService = async () => {
    if (!newService.name) return;
    if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true') {
      const created: Service = { id: `preview-service-${Date.now()}`, ...newService, category: 'Personalizado', active: true };
      setServices(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setIsCreatingService(false);
      setNewService({ name: '', price: 0, duration_minutes: 60 });
      toggleService(created);
      return;
    }
    setIsSavingService(true);
    try {
      const created = await createService({ ...newService, active: true });
      setServices(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setIsCreatingService(false);
      setNewService({ name: '', price: 0, duration_minutes: 60 });
      toggleService(created); // Já seleciona o recém-criado
    } catch (error) {
      alert("Erro ao criar serviço.");
    } finally {
      setIsSavingService(false);
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (originalStatus === 'completed' && formAppt.status !== 'completed') {
      alert('Um atendimento concluído não pode voltar para outro status, pois já gerou faturamento e fidelidade.');
      return;
    }
    try {
      const start = new Date(formAppt.start_time as string);

      // ✅ Duração dinâmica baseada nos serviços escolhidos (ou 60 min se não houver)
      const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_minutes || 60), 0) || 60;
      const end = new Date(start.getTime() + totalDuration * 60000);

      const apptData = {
        ...formAppt,
        customer_name: formAppt.is_blocked ? 'HORÁRIO BLOQUEADO' : formAppt.customer_name,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: formAppt.is_blocked ? 'blocked' : formAppt.status
      } as Appointment;

      if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true') {
        if (editingApptId) {
          setAppointments(prev => prev.map(item => item.id === editingApptId ? { ...item, ...apptData } : item));
        } else {
          setAppointments(prev => [...prev, { ...apptData, id: `preview-appt-${Date.now()}`, created_at: new Date().toISOString() }]);
        }
        setIsModalOpen(false);
        return;
      }

      if (editingApptId) {
        await updateAppointmentFull(editingApptId, apptData);
      } else {
        await createAppointment(apptData);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.includes('appointments_no_overlap') || message.includes('exclusion')) {
        alert('Este profissional já possui um compromisso nesse horário. Escolha outro horário.');
      } else {
        alert("Não foi possível salvar o agendamento. Confira os dados e tente novamente.");
      }
    }
  };

  const handleDelete = async () => {
    if (!editingApptId) return;
    if (originalStatus === 'completed') {
      alert('Atendimentos concluídos não podem ser excluídos, pois possuem movimentações financeiras e de fidelidade vinculadas.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir este agendamento?')) {
      if (import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true') {
        setAppointments(prev => prev.filter(item => item.id !== editingApptId));
        setIsModalOpen(false);
        return;
      }
      try {
        await deleteAppointment(editingApptId);
        setIsModalOpen(false);
        fetchData();
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };

  const openModalForNew = () => {
    setEditingApptId(null);
    setOriginalStatus(null);
    setFormAppt(INITIAL_APPT);
    setSelectedServices([]); // Limpa seleção
    setIsModalOpen(true);
  };

  const openModalForEdit = (appt: Appointment) => {
    setEditingApptId(appt.id);
    setOriginalStatus(appt.status);
    setFormAppt({
      ...appt,
      start_time: format(new Date(appt.start_time), "yyyy-MM-dd'T'HH:mm")
    });

    // ✅ Tenta adivinhar quais serviços estavam selecionados pelo texto
    if (appt.service_name) {
      const names = appt.service_name.split(' + ');
      const matched = services.filter(s => names.includes(s.name));
      setSelectedServices(matched);
    } else {
      setSelectedServices([]);
    }

    setIsModalOpen(true);
  };

  const sendWhatsAppConfirmation = () => {
    // Usa o telefone cadastrado. Se não tiver, avisa.
    if (!formAppt.customer_phone) {
      alert("Este agendamento não possui número de WhatsApp registado.");
      return;
    }
    const phone = formAppt.customer_phone.replace(/\D/g, ""); // Limpa formatação
    const date = format(new Date(formAppt.start_time as string), "dd/MM");
    const time = format(new Date(formAppt.start_time as string), "HH:mm");
    const msg = `Olá ${formAppt.customer_name}! Recebemos a sua solicitação para ${formAppt.service_name || 'um serviço'} no dia ${date} às ${time}. Podemos confirmar a sua marcação no Studio Modesto?`;

    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const weekDays = viewMode === 'week'
    ? Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), i))
    : [currentDate];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 text-aura-sage" />;
      case 'cancelled': return <XCircle className="w-3 h-3 text-red-400" />;
      case 'blocked': return <Ban className="w-3 h-3 text-aura-charcoal/40" />;
      case 'confirmed': return <CheckCircle2 className="w-3 h-3 text-[#25D366]" />;
      default: return <Clock className="w-3 h-3 text-aura-gold" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed': return 'border-l-aura-sage bg-aura-sage/10 opacity-70 grayscale-[30%]';
      case 'cancelled': return 'border-l-red-400 bg-red-50 opacity-50 grayscale';
      case 'blocked': return 'border-l-aura-charcoal bg-aura-soft-gray border-dashed';
      case 'confirmed': return 'border-l-[#25D366] bg-[#25D366]/5 shadow-sm';
      default: return 'border-l-aura-gold bg-aura-gold/5 shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-aura-gold/20 relative overflow-hidden';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'scheduled': 'Pendente',
      'confirmed': 'Confirmado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
      'blocked': 'Bloqueado'
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header da Agenda */}
      <div className="glass-card flex flex-col justify-between gap-6 p-5 sm:p-7 xl:flex-row xl:items-center">
        <div className="space-y-5">
          <div>
            <p className="admin-kicker">Organização do dia</p>
            <h2 className="mt-1 font-serif text-3xl font-semibold">Agenda do salão</h2>
            <p className="mt-1 text-sm text-aura-charcoal/50">Visualize atendimentos, bloqueios e disponibilidade da equipe.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-aura-soft-gray rounded-full p-1">
            <button onClick={() => setViewMode('day')} className={cn("px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all", viewMode === 'day' ? "bg-aura-charcoal text-white shadow-md" : "text-aura-charcoal/40 hover:text-aura-charcoal")}>
              Dia
            </button>
            <button onClick={() => setViewMode('week')} className={cn("px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all", viewMode === 'week' ? "bg-aura-charcoal text-white shadow-md" : "text-aura-charcoal/40 hover:text-aura-charcoal")}>
              Semana
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => setCurrentDate(viewMode === 'week' ? subWeeks(currentDate, 1) : addDays(currentDate, -1))} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-aura-charcoal/5">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="min-w-[150px] text-center font-serif text-lg font-semibold sm:min-w-[200px] sm:text-xl">
              {format(currentDate, viewMode === 'week' ? "MMMM yyyy" : "dd 'de' MMMM", { locale: ptBR })}
            </h3>
            <button onClick={() => setCurrentDate(viewMode === 'week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1))} className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-aura-charcoal/5">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-aura-charcoal/40" />
            <select
              className="w-full bg-white border border-aura-charcoal/10 rounded-lg pl-8 pr-4 py-3 text-xs outline-none cursor-pointer sm:w-auto"
              value={selectedProf}
              onChange={(e) => setSelectedProf(e.target.value)}
            >
              <option value="all">Todas as Profissionais</option>
              {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={openModalForNew} className="aura-button aura-button-primary flex items-center justify-center gap-2 rounded-lg shadow-lg shadow-aura-charcoal/10">
            <Plus className="w-4 h-4" /> Novo Agendamento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[500px] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-aura-gold" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-3">
        <div className={cn("grid gap-4", viewMode === 'week' ? "grid-cols-7 min-w-[1050px]" : "grid-cols-1 max-w-3xl mx-auto")}>
          {weekDays.map((day, i) => {
            const profObj = selectedProf !== 'all' ? professionals.find(p => p.id === selectedProf) : null;
            const isOffDayForProf = profObj?.off_days?.includes(day.getDay());

            return (
              <div key={i} className="space-y-4">
                <div className={cn(
                  "text-center p-4 rounded-3xl border transition-all relative overflow-hidden",
                  isOffDayForProf ? "bg-aura-gold/5 border-aura-gold/20" : 
                  isSameDay(day, new Date()) ? "bg-aura-charcoal text-white border-aura-charcoal shadow-md scale-105" : "bg-white/50 border-aura-charcoal/5"
                )}>
                  <p className={cn("text-[10px] uppercase tracking-widest", isOffDayForProf ? "text-aura-gold" : isSameDay(day, new Date()) ? "text-aura-gold" : "text-aura-charcoal/40")}>
                    {format(day, "EEE", { locale: ptBR })}
                  </p>
                  <p className="text-xl font-serif mt-1">{format(day, "d")}</p>
                  {isOffDayForProf && (
                    <div className="absolute top-0 right-0 w-2 h-2 mt-1 mr-1 rounded-full bg-aura-gold opacity-50" />
                  )}
                </div>

                <div className="space-y-3 min-h-[500px]">
                  {isOffDayForProf && (
                    <div className="p-4 border border-dashed border-aura-gold/20 bg-linear-to-tr from-aura-gold/[0.03] to-transparent rounded-2xl flex flex-col items-center justify-center text-center space-y-1.5 py-10 relative overflow-hidden">
                      <Ban className="w-4 h-4 text-aura-gold/50" />
                      <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-aura-gold">FOLGA RECORRENTE</span>
                      <span className="text-[8px] text-aura-charcoal/30 uppercase tracking-wider">Stylist Inativo</span>
                    </div>
                  )}

                  {appointments
                    .filter(a => isSameDay(new Date(a.start_time), day))
                    .filter(a => selectedProf === 'all' || a.professional_id === selectedProf)
                    .map((appt) => (
                      <motion.div
                        layout
                        key={appt.id}
                        onClick={() => openModalForEdit(appt)}
                        className={cn(
                          "glass-card p-4 border-l-4 transition-all cursor-pointer hover:scale-[1.02]",
                          getStatusStyles(appt.status)
                        )}
                      >
                        {appt.status === 'scheduled' && (
                          <div className="absolute top-0 right-0 w-2 h-2 mt-2 mr-2 rounded-full bg-aura-gold animate-ping opacity-75"></div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-aura-charcoal/60 flex items-center gap-1">
                            {getStatusIcon(appt.status)}
                            {format(new Date(appt.start_time), "HH:mm")}
                          </span>
                          {appt.price > 0 && <span className="text-[10px] font-bold text-aura-sage">R$ {appt.price}</span>}
                        </div>

                        <p className="font-serif text-sm mb-1 truncate leading-tight text-aura-charcoal">{appt.customer_name}</p>
                        <p className="text-[10px] text-aura-charcoal/50 uppercase tracking-wider truncate mb-2" title={appt.service_name}>
                          {appt.service_name || (appt.is_blocked ? 'INDISPONÍVEL' : 'Serviço')}
                        </p>

                        <div className="inline-block mt-1 px-2 py-0.5 rounded bg-white/50 border border-white/20">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-aura-charcoal/60">
                            {getStatusLabel(appt.status)}
                          </span>
                        </div>
                      </motion.div>
                    ))}

                  {appointments
                    .filter(a => isSameDay(new Date(a.start_time), day))
                    .filter(a => selectedProf === 'all' || a.professional_id === selectedProf).length === 0 && !isOffDayForProf && (
                    <div className="h-20 border-2 border-dashed border-aura-charcoal/5 rounded-2xl flex items-center justify-center">
                      <span className="text-[10px] uppercase tracking-widest text-aura-charcoal/20">Vazio</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}

      {/* Modal de Edição/Criação Total */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-aura-charcoal/45 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card max-h-[92vh] w-full max-w-2xl space-y-6 overflow-y-auto bg-white p-5 sm:p-8"
            >
              <div className="flex justify-between items-center pb-2 border-b border-aura-charcoal/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-aura-soft-gray rounded-xl text-aura-charcoal">
                    {editingApptId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <h3 className="text-xl font-serif italic text-aura-charcoal">
                    {editingApptId ? 'Gerir Agendamento' : 'Novo Agendamento'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-aura-charcoal/40 hover:text-aura-charcoal transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {editingApptId && formAppt.status === 'scheduled' && !formAppt.is_blocked && (
                <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/20 flex flex-col gap-3">
                  <p className="text-xs text-aura-charcoal/70 leading-relaxed">
                    Este agendamento precisa de confirmação.
                  </p>
                  <button onClick={sendWhatsAppConfirmation} type="button" className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs uppercase tracking-widest hover:bg-[#20b857] transition-colors shadow-sm">
                    <MessageCircle className="w-4 h-4" /> WhatsApp Cliente
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveAppointment} className="space-y-5">
                {!editingApptId && (
                  <div className="flex gap-2 p-1 bg-aura-soft-gray rounded-full">
                    <button type="button" onClick={() => setFormAppt({ ...formAppt, is_blocked: false })} className={cn("flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", !formAppt.is_blocked ? "bg-white text-aura-charcoal shadow-sm" : "text-aura-charcoal/40")}>Cliente</button>
                    <button type="button" onClick={() => setFormAppt({ ...formAppt, is_blocked: true })} className={cn("flex-1 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all", formAppt.is_blocked ? "bg-aura-charcoal text-white shadow-sm" : "text-aura-charcoal/40")}>Bloqueio</button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">
                      {formAppt.is_blocked ? 'Motivo do Bloqueio' : 'Nome do Cliente'}
                    </label>
                    <input required className="w-full bg-aura-soft-gray border-none rounded-xl px-4 py-3 outline-none text-sm focus:ring-2 ring-aura-gold/20" value={formAppt.customer_name} onChange={e => setFormAppt({ ...formAppt, customer_name: e.target.value })} />
                  </div>

                  {/* NOVOS CAMPOS AQUI */}
                  {!formAppt.is_blocked && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">WhatsApp</label>
                        <input className="w-full bg-aura-soft-gray border-none rounded-xl px-4 py-3 outline-none text-sm" value={formAppt.customer_phone || ''} onChange={e => setFormAppt({...formAppt, customer_phone: e.target.value})} placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Aniversário</label>
                        <input className="w-full bg-aura-soft-gray border-none rounded-xl px-4 py-3 outline-none text-sm" value={formAppt.customer_birthday || ''} onChange={e => setFormAppt({...formAppt, customer_birthday: e.target.value})} placeholder="DD/MM" />
                      </div>
                    </div>
                  )}

                  {/* ✅ NOVA ÁREA DE MULTI-SERVIÇOS */}
                  {!formAppt.is_blocked && (
                    <div className="space-y-2 p-4 rounded-2xl border border-aura-charcoal/10 bg-white/50">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold flex items-center gap-2">
                        <Scissors className="w-3 h-3" /> Serviços Solicitados
                      </label>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {services.map(s => {
                          const isSelected = selectedServices.some(sel => sel.id === s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggleService(s)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border",
                                isSelected
                                  ? "bg-aura-gold text-white border-aura-gold shadow-md"
                                  : "bg-aura-soft-gray text-aura-charcoal/60 border-transparent hover:border-aura-gold/30"
                              )}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              {s.name}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setIsCreatingService(!isCreatingService)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-dashed border-aura-charcoal/20 text-aura-charcoal/40 hover:text-aura-gold hover:border-aura-gold"
                        >
                          + Novo Serviço
                        </button>
                      </div>

                      {/* ✅ MINI FORMULÁRIO PARA CRIAR SERVIÇO NA HORA */}
                      <AnimatePresence>
                        {isCreatingService && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-3 overflow-hidden">
                            <div className="p-3 bg-aura-soft-gray rounded-xl space-y-3 border border-aura-charcoal/5">
                              <input
                                placeholder="Nome do Serviço"
                                className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs outline-none"
                                value={newService.name}
                                onChange={e => setNewService({ ...newService, name: e.target.value })}
                              />
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <span className="text-[9px] uppercase tracking-widest text-aura-charcoal/40 mb-1 block">Preço (R$)</span>
                                  <input type="number" className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs outline-none" value={newService.price} onChange={e => setNewService({ ...newService, price: Number(e.target.value) })} />
                                </div>
                                <div className="flex-1">
                                  <span className="text-[9px] uppercase tracking-widest text-aura-charcoal/40 mb-1 block">Duração (Min)</span>
                                  <input type="number" className="w-full bg-white border-none rounded-lg px-3 py-2 text-xs outline-none" value={newService.duration_minutes} onChange={e => setNewService({ ...newService, duration_minutes: Number(e.target.value) })} />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={handleCreateNewService}
                                disabled={isSavingService || !newService.name}
                                className="w-full py-2 bg-aura-charcoal text-white rounded-lg text-xs font-bold disabled:opacity-50"
                              >
                                {isSavingService ? 'Salvando...' : 'Salvar e Selecionar'}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Profissional</label>
                      <select required className="w-full bg-aura-soft-gray border-none rounded-xl px-4 py-3 outline-none text-sm focus:ring-2 ring-aura-gold/20" value={formAppt.professional_id} onChange={e => setFormAppt({ ...formAppt, professional_id: e.target.value })}>
                        <option value="">Selecionar...</option>
                        {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {(() => {
                        const selectedDateTime = formAppt.start_time ? new Date(formAppt.start_time) : null;
                        const selectedProfObj = professionals.find(p => p.id === formAppt.professional_id);
                        const isOffDayForSelectedProf = selectedDateTime && selectedProfObj?.off_days?.includes(selectedDateTime.getDay());
                        if (isOffDayForSelectedProf) {
                          return (
                            <p className="text-[9px] text-aura-gold font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                              ⚠️ Folga recorrente deste profissional!
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold flex justify-between">
                        Preço Final (R$)
                        {selectedServices.length > 0 && <span className="text-aura-gold normal-case text-[9px]">(Soma automática)</span>}
                      </label>
                      <input type="number" className="w-full bg-aura-soft-gray border-none rounded-xl px-4 py-3 outline-none text-sm focus:ring-2 ring-aura-gold/20" value={formAppt.price} onChange={e => setFormAppt({ ...formAppt, price: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Data e Horário Inicial</label>
                    <input type="datetime-local" required className="w-full bg-aura-soft-gray border-none rounded-xl px-4 py-3 outline-none text-sm focus:ring-2 ring-aura-gold/20" value={formAppt.start_time as string} onChange={e => setFormAppt({ ...formAppt, start_time: e.target.value })} />
                  </div>

                  {!formAppt.is_blocked && (
                    <div className="space-y-1 pt-2">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold">Status do Agendamento</label>
                      <select
                        required
                        className={cn(
                          "w-full border border-transparent rounded-xl px-4 py-3 outline-none text-sm font-bold transition-all shadow-sm focus:ring-2 ring-aura-charcoal/10 cursor-pointer",
                          formAppt.status === 'scheduled' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            formAppt.status === 'confirmed' ? "bg-[#25D366]/10 text-[#20b857] border-[#25D366]/30" :
                              formAppt.status === 'completed' ? "bg-aura-sage/10 text-aura-sage border-aura-sage/30" :
                                "bg-red-50 text-red-500 border-red-200"
                        )}
                        value={formAppt.status}
                        onChange={e => setFormAppt({ ...formAppt, status: e.target.value as AppointmentStatus })}
                      >
                        {originalStatus === 'completed' ? (
                          <option value="completed">⚪ Concluído (faturamento já gerado)</option>
                        ) : (
                          <>
                            <option value="scheduled">🟡 Pendente (a confirmar)</option>
                            <option value="confirmed">🟢 Confirmado pelo salão</option>
                            <option value="completed">⚪ Concluído (gera faturamento)</option>
                            <option value="cancelled">🔴 Cancelado</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-aura-charcoal/5">
                  {editingApptId && originalStatus !== 'completed' && (
                    <button type="button" onClick={handleDelete} className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors border border-red-100" title="Excluir Agendamento">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button type="submit" className="aura-button aura-button-primary flex-1 shadow-lg shadow-aura-charcoal/20">
                    {editingApptId ? 'Salvar Alterações' : 'Confirmar Reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
