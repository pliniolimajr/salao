import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { ArrowLeft, LogIn, ShieldCheck, Sparkles } from 'lucide-react';

export function Login() {
  const { signInWithGoogle, isAuthorized } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLocalPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';

  // Se já estiver logado, manda direto pro painel
  React.useEffect(() => {
    if (isAuthorized) navigate('/admin/dashboard');
  }, [isAuthorized, navigate]);

  return (
    <div className="min-h-screen w-full overflow-hidden bg-aura-cream p-4 sm:p-8 lg:grid lg:grid-cols-2 lg:gap-8">
      <button 
        onClick={() => navigate('/')}
        className="absolute left-6 top-6 z-20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-aura-charcoal/45 transition-colors hover:text-aura-charcoal sm:left-10 sm:top-10"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o site
      </button>
      <section className="relative hidden overflow-hidden rounded-[2rem] bg-aura-charcoal p-12 text-white lg:flex lg:flex-col lg:justify-end">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-aura-gold/25 blur-3xl" />
        <div className="absolute bottom-28 left-12 h-px w-32 bg-aura-gold/50" />
        <div className="relative z-10 max-w-lg">
          <Sparkles className="mb-8 h-7 w-7 text-aura-gold" />
          <p className="admin-kicker text-aura-gold">Gestão com leveza</p>
          <h2 className="mt-4 font-serif text-5xl leading-tight">Tudo o que acontece no salão, em um só lugar.</h2>
          <p className="mt-6 text-sm leading-relaxed text-white/55">Agenda, clientes, equipe e resultados organizados para que o cuidado continue sendo o centro do trabalho.</p>
        </div>
      </section>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-md flex-col justify-center space-y-8 pt-16 text-center lg:min-h-0 lg:pt-0"
      >
        <div className="space-y-2">
          <p className="admin-kicker">Acesso reservado</p>
          <h1 className="text-4xl sm:text-5xl font-serif text-aura-charcoal">Studio Modesto</h1>
          <p className="text-aura-charcoal/50 tracking-widest uppercase text-xs">Portal de gestão</p>
        </div>
        
        <div className="glass-card border border-aura-charcoal/5 p-6 sm:p-10 space-y-6 shadow-xl shadow-aura-charcoal/5">
          {searchParams.get('error') === 'access_denied' && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              Sua conta ainda não possui acesso ao painel. Solicite a liberação à administradora.
            </p>
          )}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-aura-gold/10 text-aura-gold"><ShieldCheck className="h-5 w-5" /></div>
          <p className="text-sm leading-relaxed text-aura-charcoal/60">Entre com a conta autorizada para acessar a operação do salão.</p>
          <button 
            onClick={signInWithGoogle}
            className="aura-button aura-button-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Entrar com Google
          </button>
          {isLocalPreview && (
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
              className="aura-button aura-button-secondary w-full"
            >
              Visualizar painel sem banco
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
