import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { loadEnv } from 'vite';
import { render } from '../.prerender/entry-server.js';

const root = resolve(import.meta.dirname, '..');
const routes = JSON.parse(await readFile(join(root, 'src/config/public-routes.json'), 'utf8'));
const env = { ...loadEnv('production', root, ''), ...process.env };
const configuredUrl = env.VITE_SITE_URL?.trim();
const siteUrl = configuredUrl ? new URL(configuredUrl).origin : null;
if (siteUrl && !siteUrl.startsWith('https://')) throw new Error('VITE_SITE_URL must use HTTPS.');
const template = await readFile(join(root, 'dist/index.html'), 'utf8');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function pageHead(route, noindex = false) {
  const title = `${route.title} | Studio Modesto`;
  const tags = [`<title>${escape(title)}</title>`, `<meta name="description" content="${escape(route.description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow'}" />`,
    '<meta property="og:type" content="website" />', '<meta property="og:locale" content="pt_BR" />',
    '<meta property="og:site_name" content="Studio Modesto" />',
    `<meta property="og:title" content="${escape(title)}" />`, `<meta property="og:description" content="${escape(route.description)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />', `<meta name="twitter:title" content="${escape(title)}" />`,
    `<meta name="twitter:description" content="${escape(route.description)}" />`];
  if (siteUrl) {
    tags.push(`<link rel="canonical" href="${escape(siteUrl + route.path)}" />`, `<meta property="og:url" content="${escape(siteUrl + route.path)}" />`,
      `<meta property="og:image" content="${siteUrl}/share-card.png" />`, '<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />',
      `<meta name="twitter:image" content="${siteUrl}/share-card.png" />`);
    if (!noindex) tags.push(`<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'BeautySalon', name: 'Studio Modesto', url: siteUrl, image: siteUrl + '/share-card.png', telephone: '+5571992106043', address: { '@type': 'PostalAddress', streetAddress: 'R. Duarte da Costa, 69 — Bonfim', addressLocality: 'Salvador', addressRegion: 'BA', addressCountry: 'BR' }, openingHours: 'Mo-Sa 09:00-18:00', sameAs: ['https://www.instagram.com/_studiomodesto/'] }).replaceAll('<', '\\u003c')}</script>`);
  }
  return tags.join('\n    ');
}

for (const route of [...routes, { path: '/404', title: 'Página não encontrada', description: 'Encontre serviços, contato e informações sobre o Studio Modesto.' }]) {
  const noindex = route.path === '/404';
  const html = template.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `${pageHead(route, noindex)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${render(route.path)}</div>`);
  const destination = noindex ? join(root, 'dist/404.html') : join(root, 'dist', route.path.slice(1), 'index.html');
  await mkdir(resolve(destination, '..'), { recursive: true });
  await writeFile(destination, html);
}
// Keep private routes on the application shell, without public-page HTML.
const shell = template.replace('</head>', '<meta name="robots" content="noindex, nofollow" /></head>');
await writeFile(join(root, 'dist/app.html'), shell);
await writeFile(join(root, 'dist/robots.txt'), `User-agent: *\nDisallow: /admin\nDisallow: /login\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`);
if (siteUrl) await writeFile(join(root, 'dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${escape(siteUrl + route.path)}</loc></url>`).join('')}</urlset>`);
else await unlink(join(root, 'dist/sitemap.xml')).catch(error => { if (error.code !== 'ENOENT') throw error; });
console.log(`Pre-rendered ${routes.length} public pages + 404. ${siteUrl ? 'Canonical URLs and sitemap enabled.' : 'Set VITE_SITE_URL to enable canonical URLs and sitemap.'}`);
