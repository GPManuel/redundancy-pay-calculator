/** Datos del sitio compartidos entre páginas. */

export const NOMBRE_SITIO = 'Calculadora de indemnización por despido';

/**
 * Fecha de la última revisión del contenido legal (cifras, topes, normativa).
 * Es una fecha editorial: actualízala a mano cuando revises la normativa, no en cada build.
 */
export const REVISION = { iso: '2026-11', texto: 'noviembre de 2026' };

/** Fuentes oficiales (BOE, versión consolidada). */
export const FUENTES = [
  {
    nombre: 'Estatuto de los Trabajadores',
    detalle: 'Arts. 51 (despido colectivo), 53 (despido objetivo) y 56 (despido improcedente). Real Decreto Legislativo 2/2015.',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-11430',
  },
  {
    nombre: 'Ley 3/2012, de medidas urgentes para la reforma del mercado laboral',
    detalle: 'Origen de los 33 días por año y del régimen especial para contratos anteriores al 12/02/2012.',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2012-9110',
  },
] as const;
