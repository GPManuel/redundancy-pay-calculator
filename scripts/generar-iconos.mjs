// Genera public/apple-touch-icon.png (180×180) a partir del diseño del favicon.
// Uso: npm run iconos
//
// iOS no admite SVG para el icono de la pantalla de inicio y recorta las esquinas
// por su cuenta, así que esta versión va a sangre (sin esquinas redondeadas).
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#0F6E6E"/>
  <rect x="7" y="4" width="18" height="24" rx="3.5" fill="#fff"/>
  <rect x="10" y="7" width="12" height="5.5" rx="1.5" fill="#10292B"/>
  <rect x="15.5" y="8.9" width="5" height="1.7" rx=".85" fill="#FFB38A"/>
  <path d="M19.6 17A4.6 4.6 0 1 0 19.6 24" fill="none" stroke="#0F6E6E" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M10.6 19.4h6M10.6 21.6h6" fill="none" stroke="#0F6E6E" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const destino = fileURLToPath(new URL('../public/apple-touch-icon.png', import.meta.url));

await sharp(Buffer.from(svg), { density: 1200 }).resize(180, 180).png({ compressionLevel: 9 }).toFile(destino);
console.log(`Generado ${destino}`);
