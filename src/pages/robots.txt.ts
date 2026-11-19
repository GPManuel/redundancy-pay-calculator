import type { APIRoute } from 'astro';

// Se genera a partir de `site` y `base` (astro.config.mjs), así que cambia solo con el dominio.
// Nota: los rastreadores solo leen /robots.txt en la raíz del dominio. En GitHub Pages de proyecto
// esa raíz no es nuestra; este archivo empezará a surtir efecto cuando haya un dominio propio.
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const sitemap = new URL(`${base}/sitemap-index.xml`, site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
