import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import routes from '../config/public-routes.json';

export function SiteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';
    const route = routes.find(item => item.path === normalizedPath);
    const privatePage = /^\/(login|admin)(\/|$)/.test(normalizedPath);
    const title = `${route?.title || (privatePage ? 'Portal' : 'Página não encontrada')} | Studio Modesto`;
    const description = route?.description || (privatePage ? 'Acesso ao portal do Studio Modesto.' : 'Encontre serviços, contato e informações sobre o Studio Modesto.');
    const configuredUrl = import.meta.env.VITE_SITE_URL?.trim();
    const origin = configuredUrl ? new URL(configuredUrl).origin : null;
    const meta = (key: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) { element = document.createElement('meta'); element.setAttribute(attribute, key); document.head.append(element); }
      element.content = content;
    };
    document.title = title;
    meta('description', description);
    meta('robots', route ? 'index, follow' : privatePage ? 'noindex, nofollow' : 'noindex, follow');
    for (const [key, value] of Object.entries({ 'og:title': title, 'og:description': description, 'og:type': 'website', 'og:locale': 'pt_BR', 'og:site_name': 'Studio Modesto' })) meta(key, value, true);
    meta('twitter:card', 'summary_large_image'); meta('twitter:title', title); meta('twitter:description', description);
    document.querySelectorAll('link[rel="canonical"], script[type="application/ld+json"]').forEach(element => element.remove());
    if (origin && route) {
      const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = origin + normalizedPath; document.head.append(canonical);
      meta('og:url', origin + normalizedPath, true); meta('og:image', origin + '/share-card.png', true); meta('twitter:image', origin + '/share-card.png');
      const schema = document.createElement('script'); schema.type = 'application/ld+json';
      schema.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BeautySalon', name: 'Studio Modesto', url: origin, telephone: '+5571992106043', address: { '@type': 'PostalAddress', streetAddress: 'R. Duarte da Costa, 69 — Bonfim', addressLocality: 'Salvador', addressRegion: 'BA', addressCountry: 'BR' }, openingHours: 'Mo-Sa 09:00-18:00', sameAs: ['https://www.instagram.com/_studiomodesto/'] });
      document.head.append(schema);
    } else document.querySelectorAll('meta[property="og:url"],meta[property="og:image"],meta[name="twitter:image"]').forEach(element => element.remove());
  }, [pathname]);
  return null;
}
