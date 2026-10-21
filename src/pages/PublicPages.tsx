import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, MessageCircle } from 'lucide-react';
import { usePublicActions } from '../components/layout/PublicLayout';
import { getActiveServices } from '../services/api/services';
import { Service } from '../types';
import { LOYALTY_POINTS_PER_APPOINTMENT, LOYALTY_REWARD_POINTS } from '../config/loyalty';

export const whatsapp = 'https://wa.me/5571992106043';
const hairPhoto = 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=85&w=1200';
export const categories = [
  { slug: 'cabelo', name: 'Cabelo', description: 'Corte, escova, cor e tratamentos que acompanham sua rotina e valorizam o seu jeito.', image: hairPhoto, alt: 'Cuidado profissional com os cabelos', detail: 'Uma conversa sobre seus fios, sua rotina e o resultado que você procura. A partir daí, encontramos juntos o cuidado adequado.', care: 'Conte sobre procedimentos anteriores e sobre os produtos que costuma usar. Isso ajuda a orientar a escolha do serviço.' },
  { slug: 'maos-e-pes', name: 'Mãos & pés', description: 'Um momento de pausa, cuidado e atenção ao acabamento.', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=85&w=900', alt: 'Detalhe de unhas com esmaltação', detail: 'Cuidado para mãos e pés com atenção às suas preferências, da escolha da cor aos detalhes do acabamento.', care: 'Se tiver sensibilidade ou alguma necessidade específica, converse com a equipe antes do atendimento.' },
  { slug: 'pele', name: 'Pele', description: 'Cuidados faciais com atenção ao que sua pele precisa.', image: '/treatment.png', alt: 'Aplicação de cuidado facial', detail: 'Um atendimento que começa pela escuta. Conversamos sobre suas necessidades para orientar os cuidados faciais disponíveis.', care: 'Informe produtos em uso, sensibilidades e procedimentos recentes. A indicação do cuidado depende dessa conversa.' },
];

function PageIntro({ title, accent, text }: { title: string; accent: string; text: string }) {
  return <header className="site-page-intro"><h1>{title}<br /><em>{accent}</em></h1><p>{text}</p></header>;
}

export function StudioPage() {
  return <><PageIntro title="Um espaço de cuidado." accent="Um encontro com você." text="Acreditamos no atendimento próximo: ouvir primeiro, entender sua rotina e cuidar de cada detalhe." />
    <section className="site-story"><figure><img src="/facial.png" alt="Cena ilustrativa de atendimento facial" /><figcaption>Escuta, atenção e tempo para cuidar.</figcaption></figure><div><h2>O espaço é nosso.<br /><em>O momento é todo seu.</em></h2><p>Você não precisa chegar com uma referência perfeita ou conhecer todas as técnicas. Aqui, a conversa faz parte do atendimento.</p><p>No Bonfim, em Salvador, o Studio Modesto reúne cuidados com cabelo, mãos, pés e pele. Cada escolha começa pelo que faz sentido para você.</p><Link className="site-text-link" to="/servicos">Conheça nossos serviços <ArrowRight /></Link></div></section>
    <section className="site-principles" id="pt-difference"><h2>Nosso jeito<br /><em>de cuidar.</em></h2><div><article><h3>Escutar antes de começar</h3><p>Entender sua preferência, sua rotina e o resultado esperado faz parte do trabalho.</p></article><article><h3>Atenção ao acabamento</h3><p>Técnica e experiência aplicadas aos detalhes de cada atendimento.</p></article><article><h3>Cuidar do ambiente</h3><p>Materiais, ferramentas e espaços tratados com atenção à higiene e à segurança.</p></article></div></section></>;
}

function Catalog({ category }: { category?: string }) {
  const { openBooking } = usePublicActions();
  const [items, setItems] = useState<Service[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    setState('loading');
    getActiveServices(controller.signal).then(data => { if (!disposed) { setItems(data); setState('ready'); } }).catch(() => { if (!disposed) setState('error'); }).finally(() => clearTimeout(timer));
    return () => { disposed = true; controller.abort(); clearTimeout(timer); };
  }, [attempt]);
  const matching = items.filter(item => !category || (category === 'cabelo' ? /cabelo|tratamento|capilar/i : category === 'maos-e-pes' ? /unha|mão|mãos|pé|pés|manicure|pedicure/i : /pele|facial|estética/i).test(item.category));
  return <section className="site-catalog"><div className="site-section-heading"><h2>Seu próximo<br /><em>momento de cuidado.</em></h2><p>Confira os serviços disponíveis. Valores podem variar conforme comprimento, volume e técnica; confirmamos tudo antes de começar.</p></div>
    {state === 'loading' && <p role="status" className="pt-catalog-status">Carregando serviços e valores…</p>}
    {state === 'error' && <div role="status" className="pt-catalog-status"><p>Não foi possível consultar os valores agora.</p><button className="site-text-link" onClick={() => setAttempt(n => n + 1)}>Tentar novamente <ArrowRight /></button><a href={whatsapp} target="_blank" rel="noreferrer">Consultar pelo WhatsApp</a></div>}
    {state === 'ready' && !matching.length && <p className="pt-catalog-status">Converse com a equipe para consultar as opções disponíveis. <a href={whatsapp} target="_blank" rel="noreferrer">Falar pelo WhatsApp</a></p>}
    {state === 'ready' && matching.map(service => <button key={service.id} className="site-catalog-row" onClick={() => openBooking(service.id)}><span><b>{service.name}</b><small><Clock /> {service.duration_minutes} min · {service.category}</small></span><strong>{service.price_type === 'assessment' ? 'Sob avaliação' : `${service.price_type === 'from' ? 'A partir de ' : ''}${Number(service.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</strong><ArrowRight /></button>)}
  </section>;
}

export function ServicesPage() {
  return <><PageIntro title="Seu cuidado," accent="do seu jeito." text="Conheça as possibilidades, descubra o que combina com sua rotina e reserve seu momento." />
    <div className="site-service-features">{categories.map(item => <Link to={`/servicos/${item.slug}`} className="site-service-feature" key={item.slug}><div><img src={item.image} alt={item.alt} loading="lazy" /></div><h2>{item.name}<ArrowRight /></h2><p>{item.description}</p></Link>)}</div><Catalog /></>;
}

export function ServiceDetailPage() {
  const { slug } = useParams();
  const item = categories.find(category => category.slug === slug);
  const { openBooking } = usePublicActions();
  if (!item) return <NotFoundPage />;
  return <><nav className="site-breadcrumb" aria-label="Caminho da página"><Link to="/servicos">Serviços</Link><span>/</span><span aria-current="page">{item.name}</span></nav><section className="site-detail-hero"><div><h1>{item.name}</h1><p>{item.detail}</p><button className="site-button" onClick={() => openBooking()}>Ver horários <ArrowRight /></button></div><img src={item.image} alt={item.alt} /></section><section className="site-detail-note"><h2>Antes do seu<br /><em>momento.</em></h2><p>{item.care}</p></section><Catalog category={item.slug} /></>;
}

export function ContactPage() {
  const { openBooking } = usePublicActions();
  return <><PageIntro title="Vamos cuidar" accent="de você?" text="Estamos no Bonfim, em Salvador. Escolha um horário ou converse com a equipe antes de vir." />
    <section className="site-contact"><div><h2>Studio Modesto</h2><address>R. Duarte da Costa, 69 — Bonfim<br />Salvador — BA</address><dl><dt>Horários</dt><dd>Segunda a sábado, das 09h às 18h</dd><dt>Telefone e WhatsApp</dt><dd><a href="tel:+5571992106043">(71) 99210-6043</a></dd></dl><div className="site-contact-actions"><button className="site-button" onClick={() => openBooking()}>Agendar horário <ArrowRight /></button><a className="site-text-link" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle /> Conversar com a equipe</a></div><a className="site-text-link" href="https://www.google.com/maps/dir/?api=1&destination=R.%20Duarte%20da%20Costa%2C%2069%20Bonfim%20Salvador%20BA" target="_blank" rel="noreferrer"><MapPin /> Traçar rota</a></div><iframe title="Localização do Studio Modesto" src="https://www.google.com/maps?q=R.%20Duarte%20da%20Costa%2C%2069%20Bonfim%20Salvador%20BA&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></section>
    <section className="site-faq"><h2>Antes de chegar.</h2>{[['Como faço para agendar?', 'Use o botão de agendamento para escolher serviço, profissional e horário. Se preferir conversar antes, fale com a equipe pelo WhatsApp.'], ['Preciso saber qual serviço escolher?', 'Não. Conte o que deseja e como é sua rotina. A equipe ajuda você a entender as opções disponíveis.'], ['Como posso alterar meu horário?', 'Entre em contato pelo WhatsApp e informe o nome e o horário do agendamento para verificar as possibilidades com a equipe.']].map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section></>;
}

export function LoyaltyPage() {
  const { openLoyalty } = usePublicActions();
  return <><PageIntro title="Cada visita," accent="mais um cuidado." text="O nosso clube de fidelidade acompanha seus momentos no Studio." /><section className="site-loyalty"><img src="/facial.png" alt="Cena ilustrativa de cuidado facial" /><div><h2>Seu cuidado<br /><em>também acumula.</em></h2><p>A cada atendimento concluído, você acumula {LOYALTY_POINTS_PER_APPOINTMENT} pontos. Ao completar {LOYALTY_REWARD_POINTS} pontos, pode consultar seu benefício com a equipe.</p><p>Use o número de celular informado no atendimento para consultar sua pontuação.</p><button className="site-button" onClick={openLoyalty}>Consultar meus pontos <ArrowRight /></button></div></section></>;
}

export function NotFoundPage() {
  return <section className="site-not-found"><h1>Esse caminho<br /><em>não está por aqui.</em></h1><p>A página pode ter mudado de endereço. Continue pela nossa página inicial ou conheça os serviços.</p><Link className="site-button" to="/">Voltar ao início <ArrowRight /></Link><Link className="site-text-link" to="/servicos">Conhecer os serviços</Link></section>;
}
