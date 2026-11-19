// Genera los recursos gráficos de public/ a partir del diseño del icono.
// Uso: npm run iconos
//   - apple-touch-icon.png (180×180): icono de pantalla de inicio. iOS no admite SVG y recorta
//     las esquinas por su cuenta, así que va a sangre.
//   - og-image.png (1200×630): tarjeta que se ve al compartir la web en WhatsApp, redes, etc.
//
// El dibujo del icono también está en public/favicon.svg y en src/layouts/Base.astro:
// si lo cambias, cámbialo en los tres sitios.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const publico = (nombre) => fileURLToPath(new URL(`../public/${nombre}`, import.meta.url));

// Contenido del icono en un lienzo de 32×32 (sin el fondo, que cambia según el uso)
const calculadora = `
  <rect x="7" y="4" width="18" height="24" rx="3.5" fill="#fff"/>
  <rect x="10" y="7" width="12" height="5.5" rx="1.5" fill="#10292B"/>
  <rect x="15.5" y="8.9" width="5" height="1.7" rx=".85" fill="#FFB38A"/>
  <path d="M19.6 17A4.6 4.6 0 1 0 19.6 24" fill="none" stroke="#0F6E6E" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M10.6 19.4h6M10.6 21.6h6" fill="none" stroke="#0F6E6E" stroke-width="1.8" stroke-linecap="round"/>`;

// ---- Icono de pantalla de inicio ----
const iconoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0F6E6E"/>${calculadora}
</svg>`;

await sharp(Buffer.from(iconoSvg), { density: 1200 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(publico('apple-touch-icon.png'));

// ---- Imagen para compartir (1200×630) ----
const fuente = "'Segoe UI', Arial, Helvetica, sans-serif";
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#10292B"/>
  <rect x="0" y="606" width="1200" height="24" fill="#0F6E6E"/>
  <rect x="0" y="606" width="260" height="24" fill="#FFB38A"/>
  <g transform="translate(84 150) scale(10.5)">
    <rect width="32" height="32" rx="7" fill="#0F6E6E"/>${calculadora}
  </g>
  <g font-family="${fuente}" fill="#F3F6F5">
    <text x="470" y="236" font-size="64" font-weight="700">Calculadora de</text>
    <text x="470" y="316" font-size="64" font-weight="700">indemnización</text>
    <text x="470" y="396" font-size="64" font-weight="700">por despido</text>
    <text x="470" y="466" font-size="30" fill="#B3C6C4">Objetivo, improcedente y ERE · Gratis y sin registro</text>
  </g>
</svg>`;

await sharp(Buffer.from(ogSvg), { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toFile(publico('og-image.png'));

console.log('Generados apple-touch-icon.png y og-image.png en public/');
