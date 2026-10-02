import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Scissors,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "../utils/cn"; // Ajusta o caminho se necessário

// Importações dos nossos serviços API
import { getActiveServices } from "../services/api/services";
import { getBookingProfessionals } from "../services/api/professionals";
import { createPublicAppointment, getPublicBookedIntervals, BookedInterval } from "../services/api/appointments";
import { getCustomerByPhone } from "../services/api/customers";
import { Service, Professional } from "../types";

interface BookingFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === "true";

const previewServices: Service[] = [
  { id: "service-1", name: "Escova", price: 55, duration_minutes: 60, category: "Cabelo", active: true },
  { id: "service-2", name: "Corte feminino", price: 70, duration_minutes: 60, category: "Cabelo", active: true },
  { id: "service-3", name: "Hidratação", price: 65, duration_minutes: 60, category: "Tratamento", active: true },
  { id: "service-4", name: "Coloração", price: 150, duration_minutes: 120, category: "Cabelo", active: true },
  { id: "service-5", name: "Manicure", price: 35, duration_minutes: 60, category: "Unhas", active: true },
  { id: "service-6", name: "Pé e mão", price: 65, duration_minutes: 90, category: "Unhas", active: true },
];

const previewProfessionals: Professional[] = [
  { id: "professional-1", name: "Carla Santos", role: "Cabeleireira", active: true, commission_rate: 40, goals_monthly_revenue: 8000, goals_appointments: 80, service_ids: ["service-1", "service-2", "service-3", "service-4"], off_days: [0, 1], created_at: new Date().toISOString() },
  { id: "professional-2", name: "Jéssica Lima", role: "Manicure", active: true, commission_rate: 35, goals_monthly_revenue: 6000, goals_appointments: 100, service_ids: ["service-5", "service-6"], off_days: [0, 2], created_at: new Date().toISOString() },
];

const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export function BookingFlow({ isOpen, onClose }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [bookedIntervals, setBookedIntervals] = useState<BookedInterval[]>([]);
  const [bookingError, setBookingError] = useState("");
  const [initialLoadError, setInitialLoadError] = useState("");

  // Dados do banco
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);

  // Estado do Agendamento
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    startOfDay(addDays(new Date(), 1)),
  );
  const [selectedTime, setSelectedTime] = useState("");
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '', birthday: '' });

  // Estados do CRM e Fidelidade
  const [pointsFound, setPointsFound] = useState<number | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const eligibleProfessionals = selectedService
    ? professionals.filter(professional => !Array.isArray(professional.service_ids) || professional.service_ids.includes(selectedService.id))
    : [];

  // Formata o telefone em tempo real: (XX) XXXXX-XXXX
  const formatPhone = (val: string) => {
    let value = val.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      return `(${value}`;
    }
    return value;
  };

  useEffect(() => {
    const cleanPhone = customerInfo.phone.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      const lookup = async () => {
        setSearchLoading(true);
        try {
          if (isPreview) {
            setPointsFound(72);
            setWelcomeName("Ana");
            setCustomerInfo(prev => ({ ...prev, name: prev.name || "Ana Souza" }));
            return;
          }
          const customer = await getCustomerByPhone(cleanPhone);
          if (customer) {
            setPointsFound(customer.loyalty_points);
            setWelcomeName(customer.name);
            // Preenche automaticamente os campos que estão em branco
            setCustomerInfo(prev => ({
              ...prev,
              name: prev.name || customer.name,
            }));
          } else {
            setPointsFound(null);
            setWelcomeName(null);
          }
        } catch (err) {
          console.error("Erro ao buscar fidelidade:", err);
        } finally {
          setSearchLoading(false);
        }
      };
      lookup();
    } else {
      setPointsFound(null);
      setWelcomeName(null);
    }
  }, [customerInfo.phone]);

  // Carrega os dados quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const fetchInitialData = async () => {
        try {
          setLoading(true);
          setInitialLoadError("");
          if (isPreview) {
            setServices(previewServices);
            setProfessionals(previewProfessionals);
            return;
          }
          const timeout = new Promise<never>((_, reject) => {
            window.setTimeout(() => reject(new Error("INITIAL_LOAD_TIMEOUT")), 10000);
          });
          const [servicesData, profsData] = await Promise.race([
            Promise.all([getActiveServices(), getBookingProfessionals()]),
            timeout,
          ]);
          setServices(servicesData);
          setProfessionals(profsData);
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
          setInitialLoadError("Não foi possível carregar a agenda agora. Feche esta janela e tente novamente.");
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    } else {
      // Reseta o estado quando fecha
      setStep(1);
      setSelectedService(null);
      setSelectedProf(null);
      setSelectedTime("");
      setBookingError("");
      setInitialLoadError("");
      setBookedIntervals([]);
      setCustomerInfo({ name: "", phone: "", email: "", birthday: "" });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedProf || !selectedService) {
      setBookedIntervals([]);
      return;
    }

    let cancelled = false;
    setAvailabilityLoading(true);
    setBookingError("");

    if (isPreview) {
      const occupiedStart = new Date(selectedDate);
      occupiedStart.setHours(14, 0, 0, 0);
      setBookedIntervals([{ start_time: occupiedStart.toISOString(), end_time: new Date(occupiedStart.getTime() + 60 * 60000).toISOString() }]);
      setAvailabilityLoading(false);
      return;
    }

    getPublicBookedIntervals(selectedProf.id, format(selectedDate, "yyyy-MM-dd"))
      .then((intervals) => {
        if (!cancelled) setBookedIntervals(intervals);
      })
      .catch(() => {
        if (!cancelled) setBookingError("Não foi possível carregar os horários. Tente novamente.");
      })
      .finally(() => {
        if (!cancelled) setAvailabilityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedProf, selectedService, selectedDate]);

  const isTimeUnavailable = (time: string) => {
    if (!selectedService) return true;
    const [hours, minutes] = time.split(":").map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + selectedService.duration_minutes * 60000);
    const closingTime = new Date(selectedDate);
    closingTime.setHours(18, 0, 0, 0);

    if (slotEnd > closingTime) return true;
    return bookedIntervals.some((interval) => (
      slotStart < new Date(interval.end_time) && slotEnd > new Date(interval.start_time)
    ));
  };

  const handleBooking = async () => {
    if (
      !selectedService ||
      !selectedProf ||
      !selectedTime ||
      !customerInfo.name ||
      !customerInfo.phone
    )
      return;

    setIsSubmitting(true);
    setBookingError("");
    try {
      if (isPreview) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setStep(5);
        return;
      }
      // Combina a data selecionada com a hora
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      // Calcula o tempo de fim baseado na duração do serviço (ou 60min por defeito)
      await createPublicAppointment({
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,       // NOVO
        customer_email: customerInfo.email,       // NOVO
        customer_birthday: customerInfo.birthday, // NOVO
        professional_id: selectedProf.id,
        service_id: selectedService.id,
        start_time: startTime.toISOString(),
      });

      setStep(5); // Ecrã de Sucesso
    } catch (error) {
      console.error("Erro ao agendar:", error);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("TIME_SLOT_UNAVAILABLE")) {
        setBookingError("Esse horário acabou de ser ocupado. Escolha outra opção.");
        setSelectedTime("");
        setStep(3);
        if (selectedProf) {
          try {
            const intervals = await getPublicBookedIntervals(selectedProf.id, format(selectedDate, "yyyy-MM-dd"));
            setBookedIntervals(intervals);
          } catch {
            setBookedIntervals([]);
          }
        }
      } else if (message.includes("OUTSIDE_BUSINESS_HOURS")) {
        setBookingError("O horário escolhido está fora do funcionamento do salão.");
        setStep(3);
      } else {
        setBookingError("Não foi possível concluir o agendamento. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-aura-charcoal/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        className="w-full max-w-4xl bg-aura-cream rounded-[2rem] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh] border border-white/60"
      >
        {/* Header do Modal */}
        <div className="min-h-20 border-b border-aura-charcoal/5 flex items-center justify-between gap-4 px-5 py-4 sm:px-8 bg-white/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-4">
            {step > 1 && step < 5 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-2 -ml-2 rounded-full hover:bg-aura-charcoal/5 text-aura-charcoal/40 hover:text-aura-charcoal transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-aura-gold">Studio Modesto</p>
              <h3 className="text-xl font-serif text-aura-charcoal">Agendar horário</h3>
            </div>
          </div>
          {step < 5 && (
            <div className="hidden items-center gap-1 sm:flex" aria-label={`Etapa ${step} de 4`}>
              {[1, 2, 3, 4].map(item => <span key={item} className={cn("h-1.5 rounded-full transition-all", item === step ? "w-8 bg-aura-gold" : item < step ? "w-4 bg-aura-gold/45" : "w-4 bg-aura-charcoal/10")} />)}
            </div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-aura-charcoal/5 text-aura-charcoal/40 hover:text-aura-charcoal transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {bookingError && (
            <p role="alert" className="mb-5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              {bookingError}
            </p>
          )}
          {initialLoadError && !loading && (
            <div role="alert" className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50/60 p-8 text-center">
              <p className="font-serif text-xl text-aura-charcoal">A agenda demorou para responder.</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-aura-charcoal/55">{initialLoadError}</p>
              <button type="button" onClick={onClose} className="aura-button aura-button-primary mt-6">Fechar e tentar novamente</button>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-aura-gold" />
              <p className="text-xs text-aura-charcoal/40 uppercase tracking-widest font-bold">
                A preparar o salão...
              </p>
            </div>
          ) : !initialLoadError ? (
            <AnimatePresence mode="wait">
              {/* PASSO 1: SERVIÇO */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-aura-charcoal/40 font-bold mb-6">
                    1. Selecione o Serviço
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedProf(null);
                          setStep(2);
                        }}
                        className={cn(
                          "flex items-start gap-4 p-6 rounded-2xl border transition-all text-left group",
                          selectedService?.id === service.id
                            ? "bg-white border-aura-gold shadow-md"
                            : "bg-white/50 border-aura-charcoal/5 hover:border-aura-gold/30 hover:bg-white",
                        )}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-xl transition-colors",
                            selectedService?.id === service.id
                              ? "bg-aura-gold/10 text-aura-gold"
                              : "bg-aura-charcoal/5 text-aura-charcoal/40 group-hover:text-aura-gold",
                          )}
                        >
                          <Scissors className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-serif text-lg text-aura-charcoal">
                            {service.name}
                          </h5>
                          <p className="text-xs text-aura-charcoal/40 mt-1">
                            {service.duration_minutes} min
                          </p>
                        </div>
                        <p className="font-medium text-aura-charcoal text-lg">
                          R$ {Number(service.price).toFixed(2)}
                        </p>
                      </button>
                    ))}
                    {services.length === 0 && (
                      <p className="col-span-full text-center text-sm text-aura-charcoal/40 py-10">
                        Nenhum serviço disponível no momento.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* PASSO 2: PROFISSIONAL */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-aura-charcoal/40 font-bold mb-6">
                    2. Selecione o Profissional
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Opção Qualquer Profissional (Pega o primeiro da lista) */}
                    <button
                      onClick={() => {
                        const prof = eligibleProfessionals[0];
                        if (!prof) return;
                        setSelectedProf(prof);
                        // Se a data atual for folga do profissional, avança para o próximo dia ativo
                        let checkDate = startOfDay(addDays(new Date(), 1));
                        while (prof?.off_days?.includes(checkDate.getDay())) {
                          checkDate = addDays(checkDate, 1);
                        }
                        setSelectedDate(checkDate);
                        setStep(3);
                      }}
                      className="flex items-center gap-4 p-6 rounded-2xl border bg-white/50 border-aura-charcoal/5 hover:border-aura-gold/30 hover:bg-white transition-all text-left group"
                    >
                      <div className="w-12 h-12 rounded-full bg-aura-charcoal/5 flex items-center justify-center text-aura-charcoal/20 group-hover:text-aura-gold transition-colors">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="font-serif text-lg text-aura-charcoal">
                          Qualquer profissional
                        </h5>
                        <p className="text-xs text-aura-charcoal/40 mt-1">
                          O primeiro disponível
                        </p>
                      </div>
                    </button>

                    {eligibleProfessionals.map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setSelectedProf(prof);
                          // Se a data atual for folga do profissional, avança para o próximo dia ativo
                          let checkDate = startOfDay(addDays(new Date(), 1));
                          while (prof.off_days?.includes(checkDate.getDay())) {
                            checkDate = addDays(checkDate, 1);
                          }
                          setSelectedDate(checkDate);
                          setStep(3);
                        }}
                        className={cn(
                          "flex items-center gap-4 p-6 rounded-2xl border transition-all text-left group",
                          selectedProf?.id === prof.id
                            ? "bg-white border-aura-gold shadow-md"
                            : "bg-white/50 border-aura-charcoal/5 hover:border-aura-gold/30 hover:bg-white",
                        )}
                      >
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                            selectedProf?.id === prof.id
                              ? "bg-aura-gold/10 text-aura-gold"
                              : "bg-aura-charcoal/5 text-aura-charcoal/20 group-hover:text-aura-gold",
                          )}
                        >
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h5 className="font-serif text-lg text-aura-charcoal">
                            {prof.name}
                          </h5>
                          <p className="text-xs text-aura-charcoal/40 mt-1">
                            {prof.role}
                          </p>
                        </div>
                      </button>
                    ))}
                    {eligibleProfessionals.length === 0 && (
                      <div className="col-span-full rounded-2xl border border-dashed border-aura-charcoal/15 bg-white/50 p-6 text-center text-sm text-aura-charcoal/50">
                        Nenhuma profissional está vinculada a este serviço no momento.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* PASSO 3: DATA E HORA */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-aura-charcoal/40 font-bold">
                    3. Data e Horário
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Seleção de Data Simples (Pode evoluir para um calendário real depois) */}
                    <div className="space-y-4">
                      <p className="text-xs font-medium text-aura-charcoal/60 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" /> Dias Disponíveis
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const date = addDays(new Date(), i + 1);
                          const isOffDay = date.getDay() === 0 || selectedProf?.off_days?.includes(date.getDay());
                          return (
                            <button
                              key={i}
                              disabled={isOffDay}
                              onClick={() => {
                                setSelectedDate(startOfDay(date));
                                setSelectedTime("");
                                setBookingError("");
                              }}
                              className={cn(
                                "p-3 rounded-xl border text-center transition-all relative overflow-hidden",
                                isOffDay
                                  ? "bg-aura-charcoal/5 border-dashed border-aura-charcoal/10 text-aura-charcoal/20 cursor-not-allowed"
                                  : isSameDay(selectedDate, date)
                                  ? "bg-aura-charcoal text-white border-aura-charcoal shadow-md"
                                  : "bg-white border-aura-charcoal/5 hover:border-aura-gold/30",
                              )}
                            >
                              <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">
                                {format(date, "EEE", { locale: ptBR })}
                              </p>
                              <p className="font-serif text-lg">
                                {isOffDay ? "Folga" : format(date, "d")}
                              </p>
                              {isOffDay && (
                                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-aura-charcoal/[0.03] to-transparent pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-medium text-aura-charcoal/60 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Horários
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => {
                          const unavailable = availabilityLoading || isTimeUnavailable(time);
                          return (
                            <button
                              key={time}
                              disabled={unavailable}
                              aria-label={unavailable ? `${time}, indisponível` : `${time}, disponível`}
                              onClick={() => {
                                setSelectedTime(time);
                                setBookingError("");
                              }}
                              className={cn(
                                "py-3 px-2 rounded-xl border text-sm font-medium transition-all",
                                unavailable
                                  ? "bg-aura-charcoal/5 border-aura-charcoal/5 text-aura-charcoal/25 line-through cursor-not-allowed"
                                  : selectedTime === time
                                  ? "bg-aura-gold text-white border-aura-gold shadow-md"
                                  : "bg-white border-aura-charcoal/5 hover:border-aura-gold/30",
                              )}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                      {availabilityLoading && (
                        <p className="text-[10px] text-aura-charcoal/45 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Atualizando disponibilidade...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button
                      onClick={() => setStep(4)}
                      disabled={!selectedTime}
                      className="aura-button aura-button-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* PASSO 4: SEUS DADOS */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h4 className="text-[10px] uppercase tracking-[0.2em] text-aura-charcoal/40 font-bold">
                    4. Confirme os seus dados
                  </h4>

                  <div className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white/50">
                    <div className="space-y-1">
                      <p className="font-serif text-lg">
                        {selectedService?.name}
                      </p>
                      <p className="text-xs text-aura-charcoal/60">
                        com {selectedProf?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}{" "}
                        às {selectedTime}
                      </p>
                      <p className="text-aura-gold font-bold mt-1">
                        R$ {Number(selectedService?.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleBooking();
                    }}
                  >
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40">
                        Nome Completo
                      </label>
                      <input
                        required
                        className="w-full bg-white border border-aura-charcoal/5 rounded-xl px-4 py-3 outline-none focus:border-aura-gold/50 transition-colors"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40">
                          Telefone / WhatsApp
                        </label>
                        <input
                          required
                          placeholder="(71) 99999-9999"
                          className="w-full bg-white border border-aura-charcoal/5 rounded-xl px-4 py-3 outline-none focus:border-aura-gold/50 transition-colors"
                          value={customerInfo.phone}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              phone: formatPhone(e.target.value),
                            })
                          }
                        />
                        {searchLoading && (
                          <p className="text-[9px] text-aura-gold flex items-center gap-1.5 mt-1 font-medium tracking-wide uppercase">
                            <Loader2 className="w-3 h-3 animate-spin" /> Verificando cadastro...
                          </p>
                        )}
                        {!searchLoading && pointsFound !== null && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-aura-gold/20 shadow-sm rounded-xl p-3 mt-2 flex items-center justify-between"
                          >
                            <div className="flex flex-col">
                              <span className="text-[9px] text-aura-gold uppercase tracking-widest font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 animate-pulse" /> Membro Fidelidade
                              </span>
                              {welcomeName && (
                                <span className="text-xs font-serif font-light text-aura-charcoal mt-0.5">
                                  Olá, {welcomeName.split(' ')[0]}!
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-serif font-bold text-aura-gold bg-aura-gold/5 px-2.5 py-1 rounded-full border border-aura-gold/20">
                              {pointsFound} Pts
                            </span>
                          </motion.div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40">
                          E-mail (Opcional)
                        </label>
                        <input
                          type="email"
                          className="w-full bg-white border border-aura-charcoal/5 rounded-xl px-4 py-3 outline-none focus:border-aura-gold/50 transition-colors"
                          value={customerInfo.email}
                          onChange={(e) =>
                            setCustomerInfo({
                              ...customerInfo,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40">Data de Aniversário</label>
                        <input 
                          type="date"
                          className="w-full bg-white border border-aura-charcoal/5 rounded-xl px-4 py-3 outline-none focus:border-aura-gold/50 transition-colors"
                          value={customerInfo.birthday}
                          onChange={e => setCustomerInfo({...customerInfo, birthday: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          !customerInfo.name ||
                          !customerInfo.phone
                        }
                        className="aura-button aura-button-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Confirmar Agendamento"
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* PASSO 5: SUCESSO */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8 py-12"
                >
                  <div className="w-24 h-24 bg-aura-gold/10 rounded-full flex items-center justify-center mx-auto text-aura-gold">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-3xl font-serif italic text-aura-charcoal">
                      Tudo pronto!
                    </h4>
                    <p className="text-aura-charcoal/60 max-w-sm mx-auto">
                      O seu horário foi reservado com sucesso no Studio Modesto.
                      Estamos ansiosos para recebê-lo(a).
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="aura-button aura-button-primary px-12"
                  >
                    Voltar ao Site
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
