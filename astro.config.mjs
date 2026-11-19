// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://gpmanuel.github.io/redundancy-pay-calculator/
// Con dominio propio: cambia `site` por 'https://tudominio.es' y borra `base`.
export default defineConfig({
  site: 'https://gpmanuel.github.io',
  base: '/redundancy-pay-calculator',
  integrations: [sitemap()],
});
