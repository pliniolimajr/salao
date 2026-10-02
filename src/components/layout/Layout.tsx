import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell,
  Calendar as CalendarIcon,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Package,
  Scissors,
  User as UserIcon,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Appointment } from '../../types';
import { cn } from '../../utils/cn';

const menuItems = [
  { path: '/admin/dashboard', label: 'Visão geral', icon: LayoutDashboard },
  { path: '/admin/calendar', label: 'Agenda', icon: CalendarIcon },
  { path: '/admin/customers', label: 'Clientes', icon: Users },
  { path: '/admin/professionals', label: 'Equipe', icon: Users },
  { path: '/admin/services', label: 'Serviços', icon: Scissors },
  { path: '/admin/inventory', label: 'Estoque', icon: Package },
  { path: '/admin/finance', label: 'Financeiro', icon: Wallet },
  { path: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { path: '/admin/reports', label: 'Relatórios', icon: FileText },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const activeItem = menuItems.find(item => location.pathname.includes(item.path));

  useEffect(() => {
    const fetchPending = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setPendingAppointments(data);
    };

    void fetchPending();
    const subscription = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, fetchPending)
      .subscribe();

    const closeNotifications = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', closeNotifications);

    return () => {
      void supabase.removeChannel(subscription);
      document.removeEventListener('mousedown', closeNotifications);
    };
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-[100svh] overflow-hidden bg-[#f8f5f3]">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-aura-charcoal/35 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-aura-charcoal text-white transition-transform duration-300 lg:static lg:translate-x-0',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-start justify-between border-b border-white/10 px-7 pb-7 pt-8">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#efa7ba]">Portal de gestão</span>
            <h1 className="mt-2 font-serif text-[28px] font-semibold leading-none text-white">Studio Modesto</h1>
            <p className="mt-2 text-[11px] text-white/50">Perto de você. Acima das expectativas.</p>
          </div>
          <button type="button" aria-label="Fechar menu" onClick={() => setIsSidebarOpen(false)} className="-mr-2 p-2 text-white/60 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="admin-sidebar-scroll flex-1 space-y-1 overflow-y-auto px-4 py-6" aria-label="Navegação administrativa">
          {menuItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
                  isActive ? 'bg-aura-clay text-aura-charcoal' : 'text-white/60 hover:bg-white/10 hover:text-white',
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px]', isActive ? 'text-aura-charcoal' : 'text-white/40 group-hover:text-[#efa7ba]')} />
                <span className="text-[13px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-2 flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-white/10">
              {user?.user_metadata?.avatar_url ? (
                <img className="h-full w-full object-cover" src={user.user_metadata.avatar_url} alt="Avatar" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon className="h-full w-full p-2 text-white/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user?.user_metadata?.full_name || 'Usuário'}</p>
              <p className="truncate text-[10px] text-white/40">{user?.email}</p>
            </div>
          </div>
          <button type="button" onClick={() => navigate('/')} className="mb-1 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/55 transition-colors hover:bg-white/10 hover:text-white">
            <ExternalLink className="h-[18px] w-[18px]" /><span className="text-sm font-medium">Ver site</span>
          </button>
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-white/55 transition-colors hover:bg-white/10 hover:text-[#efa7ba]">
            <LogOut className="h-[18px] w-[18px]" /><span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-30 flex min-h-20 items-center justify-between gap-4 border-b border-aura-charcoal/10 bg-white/85 px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Abrir menu" onClick={() => setIsSidebarOpen(true)} className="-ml-2 p-2 text-aura-charcoal lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="admin-kicker hidden sm:block">Studio Modesto</p>
              <h2 className="truncate font-serif text-2xl font-semibold text-aura-charcoal">{activeItem?.label || 'Painel'}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationsRef}>
              <button type="button" aria-label="Abrir notificações" aria-expanded={isNotificationsOpen} onClick={() => setIsNotificationsOpen(value => !value)} className="relative rounded-full border border-aura-charcoal/10 bg-white p-2.5 text-aura-charcoal/55 transition-colors hover:text-aura-gold">
                <Bell className="h-[18px] w-[18px]" />
                {pendingAppointments.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-aura-clay" />}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-3 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-aura-charcoal/10 bg-white shadow-2xl">
                  <div className="border-b border-aura-charcoal/10 bg-aura-soft-gray/60 p-4">
                    <p className="admin-kicker">Atualizações</p>
                    <h3 className="mt-1 font-serif text-xl font-semibold">Notificações</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {pendingAppointments.length === 0 ? (
                      <p className="p-7 text-center text-sm text-aura-charcoal/45">Nenhuma pendência no momento.</p>
                    ) : pendingAppointments.map(appointment => (
                      <button type="button" key={appointment.id} onClick={() => { setIsNotificationsOpen(false); navigate('/admin/calendar'); }} className="block w-full border-b border-aura-charcoal/5 p-4 text-left transition-colors hover:bg-aura-soft-gray/50">
                        <p className="truncate text-sm font-semibold">{appointment.customer_name}</p>
                        <p className="mt-1 text-xs text-aura-charcoal/55">{format(new Date(appointment.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="hidden h-8 w-px bg-aura-charcoal/10 sm:block" />
            <div className="hidden text-right sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-aura-charcoal/40">Hoje</p>
              <p className="text-sm font-medium">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-7 lg:p-10">
          <div className="mx-auto w-full max-w-[1500px]"><Outlet /></div>
        </div>
      </main>
    </div>
  );
}
