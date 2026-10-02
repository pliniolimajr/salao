import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Sparkles, Phone, Award, Award as Crown, ArrowRight, Loader2, Calendar, Star } from 'lucide-react';
import { getCustomerByPhone, PublicLoyaltyCustomer, CustomerCRMData } from '../services/api/customers';
import { LOYALTY_POINTS_PER_APPOINTMENT, LOYALTY_REWARD_POINTS, loyaltyProgress } from '../config/loyalty';

const isPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoyaltyModal({ isOpen, onClose }: LoyaltyModalProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<PublicLoyaltyCustomer | null>(null);
  const [crmData] = useState<CustomerCRMData | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Formata o telefone em tempo real: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    
    setPhone(value);
    setError('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Por favor, insira um telefone válido com DDD.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = isPreview
        ? { name: 'Ana Souza', loyalty_points: 72, is_vip: true, last_visit: new Date(Date.now() - 12 * 86400000).toISOString() } as PublicLoyaltyCustomer
        : await getCustomerByPhone(cleanPhone);
      if (data) {
        setCustomer(data);
      } else {
        setCustomer(null);
      }
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao consultar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setCustomer(null);
    setSearched(false);
    setPhone('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-aura-charcoal/40 backdrop-blur-sm"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg bg-aura-cream border border-white/60 rounded-[2rem] shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="min-h-20 border-b border-aura-charcoal/5 flex items-center justify-between px-5 py-4 sm:px-8 bg-white/60 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 text-aura-charcoal">
            <Award className="w-5 h-5 text-aura-gold" />
            <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-aura-gold">Seu cuidado conta</p><h3 className="text-xl font-serif">Clube de fidelidade</h3></div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-aura-charcoal/5 text-aura-charcoal/40 hover:text-aura-charcoal transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {!searched ? (
              // STEP 1: Phone Search Input
              <motion.div
                key="search"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h4 className="text-2xl font-serif italic text-aura-charcoal">
                    Acompanhe sua pontuação
                  </h4>
                  <p className="text-xs text-aura-charcoal/60 leading-relaxed max-w-sm mx-auto">
                    A cada atendimento concluído, você acumula {LOYALTY_POINTS_PER_APPOINTMENT} pontos. Complete {LOYALTY_REWARD_POINTS} pontos e resgate uma hidratação ou pé &amp; mão especial de brinde!
                  </p>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-aura-charcoal/40 font-bold block">
                      Celular / WhatsApp
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-aura-charcoal/30" />
                      <input
                        type="text"
                        required
                        placeholder="(71) 99999-9999"
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={loading}
                        className="w-full bg-white border border-aura-charcoal/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-aura-gold/50 focus:ring-1 focus:ring-aura-gold/30 transition-all text-aura-charcoal font-medium placeholder:text-aura-charcoal/30"
                      />
                    </div>
                    {error && (
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full bg-aura-charcoal text-aura-cream hover:bg-aura-gold hover:text-aura-charcoal aura-button flex items-center justify-center gap-3 rounded-2xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        Ver Meus Pontos
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : customer ? (
              // STEP 2A: Found Loyalty Portal Card
              <motion.div
                key="result-found"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                {/* Golden Club Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-aura-charcoal to-[#2E2823] text-aura-cream p-8 rounded-3xl border border-aura-gold/30 shadow-xl space-y-6">
                  {/* Absolute subtle background sparkles */}
                  <div className="absolute right-0 top-0 w-32 h-32 bg-aura-gold/5 rounded-full blur-3xl" />
                  
                  {/* Card Header Info */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[8px] uppercase tracking-[0.25em] text-aura-gold font-bold">
                        Studio Modesto Loyalty Club
                      </span>
                      <h4 className="text-2xl font-serif font-light text-white tracking-wide">
                        {customer.name}
                      </h4>
                    </div>
                    
                    {/* VIP/Loyalty Badge */}
                    {customer.is_vip ? (
                      <div className="flex items-center gap-1 bg-aura-gold/20 border border-aura-gold/40 text-aura-gold text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                        <Crown className="w-3 h-3" /> VIP
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-white/5 border border-white/10 text-aura-cream/60 text-[9px] uppercase tracking-widest font-medium px-3 py-1 rounded-full">
                        <Star className="w-3 h-3" /> Especial
                      </div>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-white/60 tracking-wider">Progresso do Prêmio</span>
                      <span className="font-serif text-lg text-aura-gold font-medium">
                        {customer.loyalty_points} <span className="text-xs text-white/40">/ {LOYALTY_REWARD_POINTS} pts</span>
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${loyaltyProgress(customer.loyalty_points)}%` }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-gradient-to-r from-aura-gold via-[#D8BC8C] to-aura-gold rounded-full"
                      />
                    </div>
                  </div>

                  {/* Dynamic Motivational Copy */}
                  <div className="text-center pt-2">
                    {customer.loyalty_points >= LOYALTY_REWARD_POINTS ? (
                      <p className="text-xs text-aura-gold font-semibold flex items-center justify-center gap-1">
                        <Sparkles className="w-4 h-4 animate-bounce" /> Meta completa! Seu brinde está disponível.
                      </p>
                    ) : (
                      <p className="text-[11px] text-white/50 leading-relaxed font-light">
                        Faltam apenas <strong className="text-aura-gold font-bold">{LOYALTY_REWARD_POINTS - customer.loyalty_points} pontos</strong> para resgatar sua recompensa gratuita!
                      </p>
                    )}
                  </div>
                </div>

                {/* Bespoke CRM Insights Box */}
                {crmData && (
                  <div className="border border-aura-charcoal/10 rounded-2xl bg-white/40 p-6 space-y-4">
                    <h5 className="text-[10px] uppercase tracking-[0.2em] text-aura-charcoal/40 font-bold">
                      Seu Perfil de Beleza
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-aura-charcoal/60">
                          <Calendar className="w-3.5 h-3.5 text-aura-gold" />
                          <span>Última Visita</span>
                        </div>
                        <p className="text-sm font-medium text-aura-charcoal">
                          {customer.last_visit 
                            ? new Date(customer.last_visit).toLocaleDateString('pt-BR') 
                            : 'Nenhum registro'}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-aura-charcoal/60">
                          <Crown className="w-3.5 h-3.5 text-aura-gold" />
                          <span>Estilista Favorito</span>
                        </div>
                        <p className="text-sm font-medium text-aura-charcoal truncate">
                          {crmData.favoriteProfessional || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={resetSearch}
                    className="flex-1 aura-button aura-button-secondary text-center rounded-2xl cursor-pointer"
                  >
                    Consultar outro número
                  </button>
                </div>
              </motion.div>
            ) : (
              // STEP 2B: Not Found Screen
              <motion.div
                key="result-not-found"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center space-y-6 py-4"
              >
                <div className="w-16 h-16 bg-aura-gold/10 rounded-full flex items-center justify-center mx-auto text-aura-gold">
                  <Phone className="w-6 h-6" />
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-2xl font-serif italic text-aura-charcoal">
                    Cadastro não encontrado
                  </h4>
                  <p className="text-xs text-aura-charcoal/60 max-w-xs mx-auto leading-relaxed">
                    Não localizamos o telefone <strong className="text-aura-charcoal">{phone}</strong>. Se você é novo(a) por aqui, inicie sua jornada para acumular pontos!
                  </p>
                </div>

                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  <a
                    href={`https://wa.me/5571992106043?text=${encodeURIComponent(`Olá! Gostaria de me cadastrar no clube de fidelidade do Studio Modesto. Meu número é ${phone}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-aura-charcoal text-aura-cream hover:bg-aura-gold hover:text-aura-charcoal aura-button rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    Cadastrar via WhatsApp <ArrowRight className="w-4 h-4" />
                  </a>
                  
                  <button
                    onClick={resetSearch}
                    className="aura-button aura-button-secondary rounded-xl cursor-pointer"
                  >
                    Tentar outro telefone
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
