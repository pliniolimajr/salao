import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { FloatingWhatsApp } from '../FloatingWhatsApp';
import '../../pages/LandingPage.css';
import '../../pages/PublicSite.css';

const BookingFlow = lazy(() => import('../../pages/BookingFlow').then(m => ({ default: m.BookingFlow })));
const LoyaltyModal = lazy(() => import('../LoyaltyModal').then(m => ({ default: m.LoyaltyModal })));
const PublicActions = createContext({ openBooking: (_serviceId?: string) => {}, openLoyalty: () => {} });
export const usePublicActions = () => useContext(PublicActions);
const links = [['/', 'Início'], ['/o-studio', 'O Studio'], ['/servicos', 'Serviços'], ['/contato', 'Contato']];

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [booking, setBooking] = useState<{ serviceId?: string } | null>(null);
  const [loyalty, setLoyalty] = useState(false);
  const location = useLocation();
  const navigationType = useNavigationType();
  const mainRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const previousPath = useRef(location.pathname);
  const scrollPositions = useRef(new Map<string, number>());

  useEffect(() => {
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => { history.scrollRestoration = previousRestoration; };
  }, []);

  useEffect(() => {
    const changed = previousPath.current !== location.pathname;
    previousPath.current = location.pathname;
    setMenuOpen(false);
    const frame = requestAnimationFrame(() => {
      if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
      else window.scrollTo(0, navigationType === 'POP' ? scrollPositions.current.get(location.key) || 0 : 0);
      if (changed) mainRef.current?.focus({ preventScroll: true });
    });
    const remember = () => scrollPositions.current.set(location.key, window.scrollY);
    window.addEventListener('scroll', remember, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', remember); };
  }, [location.key, location.pathname, location.hash, navigationType]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const background = document.querySelectorAll<HTMLElement>('.site-main, .site-invitation, .site-footer, .studio-whatsapp');
    background.forEach(element => { element.inert = true; });
    const frame = requestAnimationFrame(() => document.querySelector<HTMLElement>('#site-navigation a')?.focus());
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuRef.current?.focus(); }
      if (event.key === 'Tab') {
        const controls = [...document.querySelectorAll<HTMLElement>('#site-navigation a, #site-navigation button, .pt-menu')].filter(element => element.getClientRects().length);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const desktop = matchMedia('(min-width: 801px)');
    const resize = () => { if (desktop.matches) setMenuOpen(false); };
    window.addEventListener('keydown', close);
    desktop.addEventListener('change', resize);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      background.forEach(element => { element.inert = false; });
      window.removeEventListener('keydown', close);
      desktop.removeEventListener('change', resize);
    };
  }, [menuOpen]);

  const openBooking = (serviceId?: string) => { setMenuOpen(false); setBooking({ serviceId }); };
  const openLoyalty = () => { setMenuOpen(false); setLoyalty(true); };
  return <PublicActions.Provider value={{ openBooking, openLoyalty }}>
    <div className="perto public-site">
      <a className="site-skip" href="#site-content">Pular para o conteúdo</a>
      <header className="pt-nav" data-menu-open={menuOpen || undefined}>
        <Link to="/" className="pt-logo" aria-label="Studio Modesto, início"><span>Studio</span><b>Modesto</b></Link>
        <nav id="site-navigation" data-open={menuOpen || undefined} aria-label="Navegação principal">
          {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
          <NavLink to="/fidelidade">Fidelidade</NavLink>
          <div className="site-menu-bottom"><p>Um tempo para você.<br />Um cuidado em cada detalhe.</p><button className="site-button" onClick={() => openBooking()}>Agendar meu momento <ArrowRight /></button><span>Bonfim · Salvador, Bahia</span></div>
        </nav>
        <button type="button" className="pt-book" onClick={() => openBooking()}><CalendarDays /> Agendar horário</button>
        <button ref={menuRef} type="button" className="pt-menu" aria-controls="site-navigation" aria-expanded={menuOpen} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen(!menuOpen)}><span className="site-menu-icon" aria-hidden="true"><i /><i /><i /></span></button>
      </header>
      <div className="site-menu-scrim" data-open={menuOpen || undefined} onClick={() => { setMenuOpen(false); menuRef.current?.focus(); }} aria-hidden="true" />
      <main id="site-content" ref={mainRef} tabIndex={-1} className="site-main"><div key={location.pathname} className="site-route"><Outlet /></div></main>
      <section className="site-invitation"><div><h2>Reserve um tempo<br /><em>para você.</em></h2><p>Escolha seu cuidado. A gente cuida dos detalhes.</p></div><button className="site-button" onClick={() => openBooking()}>Encontrar meu horário <ArrowRight /></button></section>
      <footer className="site-footer"><div><Link className="pt-logo" to="/"><span>Studio</span><b>Modesto</b></Link><p>Perto de você.<br />Acima das expectativas.</p></div><nav aria-label="Explore o site">{links.slice(1).map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}<Link to="/fidelidade">Fidelidade</Link></nav><div><a href="tel:+5571992106043">(71) 99210-6043</a><a href="https://www.instagram.com/_studiomodesto/" target="_blank" rel="noreferrer">@_studiomodesto</a><p>R. Duarte da Costa, 69 — Bonfim<br />Salvador — BA</p></div><div className="site-footer-bottom"><span>Studio Modesto · Salvador, Bahia</span><a href="https://www.apertef1.com.br" target="_blank" rel="noreferrer">Desenvolvido por Aperte F1</a></div></footer>
      <FloatingWhatsApp />
      <Suspense fallback={<div className="pt-opening" role="status">Abrindo atendimento…</div>}>
        {booking && <BookingFlow isOpen initialServiceId={booking.serviceId} onClose={() => setBooking(null)} />}
        {loyalty && <LoyaltyModal isOpen onClose={() => setLoyalty(false)} />}
      </Suspense>
    </div>
  </PublicActions.Provider>;
}
