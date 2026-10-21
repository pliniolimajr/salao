import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, MapPin, MessageCircle, Star } from 'lucide-react';
import { usePublicActions } from '../components/layout/PublicLayout';
import { categories } from './PublicPages';

export function LandingPage() {
  const { openBooking: book } = usePublicActions();
  const openBooking = () => book();
  const photoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const photo = photoRef.current?.querySelector<HTMLImageElement>('.pt-main-photo img');
    if (!photo) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = photo.parentElement!.getBoundingClientRect();
      if (rect.bottom < 0 && !media.matches) return;
      photo.style.transform = media.matches ? 'none' : `translateY(${Math.min(24, window.scrollY * 0.035)}px) scale(1.08)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', schedule, { passive: true });
    media.addEventListener('change', schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', schedule); media.removeEventListener('change', schedule); };
  }, []);
  return <div ref={photoRef}>
        <section id="pt-top" className="pt-hero">
          <div className="pt-copy"><h1 className="pt-rise pt-d1">Perto de você.<br /><em>Acima das expectativas.</em></h1><p className="pt-lead pt-rise pt-d2">Um studio feito para você se sentir à vontade: atendimento próximo, profissionais que escutam e um trabalho que faz você querer voltar.</p><div className="pt-actions pt-rise pt-d3"><button type="button" onClick={openBooking}>Escolher meu horário <ArrowRight /></button><a href="https://wa.me/5571992106043" target="_blank" rel="noreferrer"><MessageCircle /> Tirar uma dúvida</a></div><div className="pt-trust pt-rise pt-d3"><span><Star /> Trabalho feito com capricho</span><span><MapPin /> Salvador, Bahia</span></div></div>
          <div className="pt-visual pt-rise pt-d2"><div className="pt-main-photo"><img fetchPriority="high" decoding="async" width="1200" height="1500" src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=85&w=1200" alt="Profissional cuidando dos cabelos de uma cliente" /></div><div className="pt-detail-photo"><img src="https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=90&w=600" alt="Unhas bem cuidadas" /></div><div className="pt-note"><b>Desde 2012</b><span>cuidando de pessoas,<br />não de padrões.</span></div></div>
          <a className="pt-scroll" href="#home-services"><ArrowDown /> Conheça nosso trabalho</a>
        </section>
    <section className="site-home-story"><h2>Beleza com cuidado.<br /><em>Atendimento com presença.</em></h2><div><p>Um espaço para conversar, descobrir possibilidades e se sentir à vontade. Conheça o jeito de cuidar do Studio Modesto.</p><Link className="site-text-link" to="/o-studio">Entre no nosso Studio <ArrowRight /></Link></div></section>
    <section id="home-services" className="site-home-services"><div className="site-section-heading"><h2>Encontre seu<br /><em>momento.</em></h2><Link className="site-text-link" to="/servicos">Todos os serviços <ArrowRight /></Link></div><div className="site-service-features">{categories.map(item => <Link className="site-service-feature" to={`/servicos/${item.slug}`} key={item.slug}><div><img src={item.image} alt={item.alt} loading="lazy" /></div><h3>{item.name}<ArrowRight /></h3><p>{item.description}</p></Link>)}</div></section>
    <section className="site-home-care" id="pt-difference"><img src="/facial.png" alt="Cena ilustrativa de atendimento facial" loading="lazy" /><div><h2>O momento<br /><em>é todo seu.</em></h2><p>Antes de começar, a gente escuta. Entende sua rotina, suas preferências e o resultado que você procura.</p><Link className="site-text-link" to="/o-studio">Conheça nosso cuidado <ArrowRight /></Link></div></section>
  </div>;
}
