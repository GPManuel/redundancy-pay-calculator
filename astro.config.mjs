// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Alojada en Cloudflare Pages: https://calculadora-despido.pages.dev/
// Con dominio propio: cambia `site` por 'https://tudominio.es'. Nada más.
export default defineConfig({
  site: 'https://calculadora-despido.pages.dev',
  integrations: [sitemap()],
});
