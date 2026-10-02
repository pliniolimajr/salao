import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, CalendarDays, Clock, Heart, MapPin, Menu, MessageCircle, Scissors, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { FloatingWhatsApp } from '../components/FloatingWhatsApp';
import { getActiveServices } from '../services/api/services';
import { Service } from '../types';
import './LandingPage.css';

const BookingFlow = lazy(() => import('./BookingFlow').then(({ BookingFlow }) => ({ default: BookingFlow })));
const LoyaltyModal = lazy(() => import('../components/LoyaltyModal').then(({ LoyaltyModal }) => ({ default: LoyaltyModal })));

interface LandingPageProps { onEnterPortal: () => void; }
const services = [
  { number: '01', title: 'Cabelo', text: 'Corte, escova, cor e tratamentos pensados para a rotina dos seus fios.', icon: Scissors },
  { number: '02', title: 'Mãos & pés', text: 'Cuidado completo, acabamento caprichado e aquele momento de pausa.', icon: Heart },
  { number: '03', title: 'Pele', text: 'Limpeza e protocolos faciais feitos com atenção ao que sua pele precisa.', icon: Sparkles },
];

export function LandingPage({ onEnterPortal }: LandingPageProps) {
  const [siteReady, setSiteReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [catalogServices, setCatalogServices] = useState<Service[]>([]);
  const openBooking = () => setBookingOpen(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => setSiteReady(true), reduceMotion ? 150 : 1150);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (siteReady) document.body.style.overflow = '';
  }, [siteReady]);

  useEffect(() => {
    void getActiveServices()
      .then(setCatalogServices)
      .catch(error => console.error('Não foi possível carregar o catálogo:', error));
  }, []);

  const serviceGroups = catalogServices.reduce<Record<string, Service[]>>((groups, service) => {
    (groups[service.category] ||= []).push(service);
    return groups;
  }, {});

  const servicePrice = (service: Service) => {
    if (service.price_type === 'assessment') return 'Sob avaliação';
    const value = `R$ ${Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    return service.price_type === 'from' ? `A partir de ${value}` : value;
  };

  return (
    <div className="perto" data-loading={!siteReady || undefined}>
      <div className={`pt-preloader${siteReady ? ' is-ready' : ''}`} role="status" aria-live="polite" aria-label="Carregando o site do Studio Modesto">
        <div className="pt-preloader-mark" aria-hidden="true">
          <Sparkles />
        </div>
        <p>Seu momento começa nos detalhes.</p>
        <i aria-hidden="true"><span /></i>
      </div>
      <header className="pt-nav">
        <a href="#pt-top" className="pt-logo" aria-label="Studio Modesto, início"><span>Studio</span><b>Modesto</b></a>
        <nav data-open={menuOpen || undefined} aria-label="Navegação principal">
          <a href="#pt-services" onClick={() => setMenuOpen(false)}>Serviços</a><a href="#pt-difference" onClick={() => setMenuOpen(false)}>Nosso cuidado</a><a href="#pt-contact" onClick={() => setMenuOpen(false)}>Onde estamos</a>
          <button type="button" onClick={() => { setMenuOpen(false); setLoyaltyOpen(true); }}>Fidelidade</button><button type="button" onClick={onEnterPortal}>Portal</button>
        </nav>
        <button type="button" className="pt-book" onClick={openBooking}><CalendarDays /> Agendar horário</button>
        <button type="button" className="pt-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>
      <main>
        <section id="pt-top" className="pt-hero">
          <div className="pt-copy"><h1 className="pt-rise pt-d1">Perto de você.<br /><em>Acima das expectativas.</em></h1><p className="pt-lead pt-rise pt-d2">Um studio feito para você se sentir à vontade: atendimento próximo, profissionais que escutam e um trabalho que faz você querer voltar.</p><div className="pt-actions pt-rise pt-d3"><button type="button" onClick={openBooking}>Escolher meu horário <ArrowRight /></button><a href="https://wa.me/5571992106043" target="_blank" rel="noreferrer"><MessageCircle /> Tirar uma dúvida</a></div><div className="pt-trust pt-rise pt-d3"><span><Star /> Trabalho feito com capricho</span><span><MapPin /> Salvador, Bahia</span></div></div>
          <div className="pt-visual pt-rise pt-d2"><div className="pt-main-photo"><img src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=90&w=1200" alt="Profissional cuidando dos cabelos de uma cliente" /></div><div className="pt-detail-photo"><img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=90&w=600" alt="Unhas bem cuidadas" /></div><div className="pt-note"><b>Desde 2012</b><span>cuidando de pessoas,<br />não de padrões.</span></div></div>
          <a className="pt-scroll" href="#pt-services"><ArrowDown /> Conheça nosso trabalho</a>
        </section>
        <section className="pt-message"><p>O espaço é nosso.<br /><b>O momento é todo seu.</b></p><span>Aqui você não precisa entender de técnica nem chegar com uma referência perfeita. A gente conversa, entende e cuida.</span></section>
        <section id="pt-services" className="pt-services"><header><p>O QUE FAZEMOS</p><h2>Seu cuidado,<br /><em>do seu jeito.</em></h2><span>Escolha um serviço ou conte o que deseja. A gente ajuda você a encontrar a melhor opção.</span></header><div className="pt-service-grid">{services.map((service) => { const Icon = service.icon; return <button type="button" onClick={openBooking} className="pt-service" key={service.number}><div><span>{service.number}</span><Icon /></div><h3>{service.title}</h3><p>{service.text}</p><strong>Ver horários <ArrowRight /></strong></button>; })}</div>
          {catalogServices.length > 0 && <div className="pt-catalog"><div className="pt-catalog-heading"><div><p>CATÁLOGO DE SERVIÇOS</p><h3>Valores claros.<br /><em>Escolhas tranquilas.</em></h3></div><span>Alguns serviços podem variar conforme comprimento, volume e técnica. Confirmamos tudo com você antes de começar.</span></div><div className="pt-catalog-groups">{(Object.entries(serviceGroups) as [string, Service[]][]).map(([category, items]) => <article key={category}><h4>{category}</h4><div>{items.map(service => <button type="button" onClick={openBooking} key={service.id}><span><b>{service.name}</b><small><Clock /> {service.duration_minutes} min</small></span><strong>{servicePrice(service)}</strong></button>)}</div></article>)}</div></div>}
        </section>
        <section id="pt-difference" className="pt-difference"><div className="pt-care-photo"><img src="/treatment.png" alt="Atendimento cuidadoso de estética facial" /><span>ATENÇÃO EM CADA DETALHE</span></div><div className="pt-care-copy"><p>O QUE FAZ A DIFERENÇA</p><h2>Não é sobre parecer caro.<br /><em>É sobre ser bem-feito.</em></h2><div><article><ShieldCheck /><h3>Higiene e segurança</h3><p>Materiais, ferramentas e espaços tratados com o cuidado que você merece.</p></article><article><Heart /><h3>Escuta de verdade</h3><p>Antes de começar, entendemos sua rotina, sua preferência e o resultado esperado.</p></article><article><Sparkles /><h3>Técnica e acabamento</h3><p>Experiência aplicada nos detalhes que fazem o resultado durar e ficar bonito.</p></article></div></div></section>
        <section className="pt-proof"><div><span>CLIENTES QUE VOLTAM</span><blockquote>“O atendimento é acolhedor e o resultado sempre fica melhor do que imaginei.”</blockquote><p>— Cliente Studio Modesto</p></div><aside><img src="/facial.png" alt="Momento de cuidado no Studio Modesto" /></aside></section>
        <section id="pt-contact" className="pt-neighborhood">
          <div className="pt-location-copy"><p>VENHA NOS VISITAR</p><h2>Seu momento de cuidado<br />começa aqui.</h2><span>R. Duarte da Costa, 69 — Bonfim<br />Salvador — BA</span><div className="pt-location-hours"><b>Horários</b><p>Segunda a sábado<br />09h às 18h</p></div><div className="pt-location-actions"><button type="button" onClick={openBooking}>Agendar horário <ArrowRight /></button><a href="https://www.google.com/maps/dir/?api=1&destination=R.%20Duarte%20da%20Costa%2C%2069%20-%20Bonfim%2C%20Salvador%20-%20BA" target="_blank" rel="noreferrer"><MapPin /> Traçar rota</a></div></div>
          <div className="pt-map-card"><iframe title="Mapa do Studio Modesto" src="https://www.google.com/maps?q=R.%20Duarte%20da%20Costa%2C%2069%20-%20Bonfim%2C%20Salvador%20-%20BA&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /><div><span><MapPin /> Studio Modesto</span><p>R. Duarte da Costa, 69 — Bonfim</p></div></div>
        </section>
      </main>
      <footer className="pt-footer pt-footer-compact"><div><span>Studio Modesto</span><p>Perto de você. Acima das expectativas.</p><a className="pt-credit" href="https://www.apertef1.com.br" target="_blank" rel="noopener noreferrer">Desenvolvido por Aperte F1</a></div><nav aria-label="Links do rodapé"><a href="tel:+5571992106043">(71) 99210-6043</a><a href="https://www.instagram.com/_studiomodesto/" target="_blank" rel="noopener noreferrer">@_studiomodesto</a><button type="button" onClick={() => setLoyaltyOpen(true)}>Fidelidade</button><button type="button" onClick={onEnterPortal}>Portal</button></nav></footer>
      <FloatingWhatsApp />
      <Suspense fallback={null}>
        {bookingOpen && <BookingFlow isOpen onClose={() => setBookingOpen(false)} />}
        {loyaltyOpen && <LoyaltyModal isOpen onClose={() => setLoyaltyOpen(false)} />}
      </Suspense>
    </div>
  );
}
