/**
 * Cálculo de la indemnización por despido (España, Estatuto de los Trabajadores).
 *
 * - Objetivo / procedente: 20 días por año, tope de 12 mensualidades.
 * - Improcedente: 33 días por año, tope de 24 mensualidades.
 * - Improcedente con contrato anterior al 12/02/2012 (reforma laboral, Ley 3/2012):
 *     · 45 días por año por el tiempo trabajado hasta el 11/02/2012.
 *     · 33 días por año por el tiempo trabajado desde el 12/02/2012.
 *     · Tope de 24 mensualidades, salvo que el tramo anterior a 2012 ya lo supere;
 *       en ese caso se aplica el importe de ese tramo, con un máximo de 42 mensualidades.
 *
 * - Despido colectivo (ERE): las condiciones se negocian. El mínimo legal es el del despido
 *   objetivo (20 días por año, tope de 12 mensualidades); el acuerdo puede mejorarlo
 *   o eliminar el tope.
 *
 * Los periodos de tiempo inferiores a un mes se prorratean como mes completo.
 * Salario diario = salario bruto anual / 365. Salario mensual = salario bruto anual / 12.
 */

export type TipoDespido = 'objetivo' | 'improcedente' | 'colectivo';

/** Condiciones pactadas en un ERE. `topeMensualidades: null` significa sin tope. */
export interface CondicionesPactadas {
  diasPorAnio: number;
  topeMensualidades: number | null;
}

export const DIAS_MINIMOS_ERE = 20;
export const TOPE_MINIMO_ERE = 12;

/** Fecha de calendario sin hora ni zona horaria. `mes` va de 1 a 12. */
export interface Fecha {
  anio: number;
  mes: number;
  dia: number;
}

export interface Tramo {
  etiqueta: string;
  meses: number;
  diasPorAnio: number;
  importe: number;
}

export interface ResultadoIndemnizacion {
  indemnizacion: number;
  importeSinTope: number;
  tope: number;
  topeAplicado: boolean;
  topeMensualidades: number;
  mesesTotales: number;
  salarioDiario: number;
  salarioMensual: number;
  tramos: Tramo[];
}

/** Último día del régimen anterior: 11/02/2012. */
const FIN_REGIMEN_ANTERIOR: Fecha = { anio: 2012, mes: 2, dia: 11 };
/** Primer día del régimen actual: 12/02/2012. */
const INICIO_REGIMEN_ACTUAL: Fecha = { anio: 2012, mes: 2, dia: 12 };

/** Convierte "AAAA-MM-DD" (valor de un <input type="date">) en Fecha. */
export function parsearFecha(valor: string): Fecha | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (!m) return null;
  const fecha = { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) };
  // Validar que la fecha existe (p. ej. rechaza 2023-02-30)
  const d = new Date(Date.UTC(fecha.anio, fecha.mes - 1, fecha.dia));
  if (d.getUTCFullYear() !== fecha.anio || d.getUTCMonth() !== fecha.mes - 1 || d.getUTCDate() !== fecha.dia) {
    return null;
  }
  return fecha;
}

export function compararFechas(a: Fecha, b: Fecha): number {
  return a.anio - b.anio || a.mes - b.mes || a.dia - b.dia;
}

/**
 * Meses trabajados entre dos fechas, ambas incluidas.
 * El mes incompleto computa como mes entero.
 */
export function mesesTrabajados(inicio: Fecha, fin: Fecha): number {
  if (compararFechas(fin, inicio) < 0) return 0;
  let meses = (fin.anio - inicio.anio) * 12 + (fin.mes - inicio.mes);
  if (fin.dia >= inicio.dia) meses += 1;
  return meses;
}

export interface DatosCalculo {
  salarioAnual: number;
  inicio: Fecha;
  fin: Fecha;
  tipo: TipoDespido;
  /** Solo para `tipo: 'colectivo'`. Si se omite, se usa el mínimo legal. */
  pactado?: CondicionesPactadas;
}

export function calcularIndemnizacion({ salarioAnual, inicio, fin, tipo, pactado }: DatosCalculo): ResultadoIndemnizacion {
  if (!(salarioAnual > 0) || !Number.isFinite(salarioAnual)) {
    throw new RangeError('El salario debe ser un número positivo.');
  }
  if (compararFechas(fin, inicio) < 0) {
    throw new RangeError('La fecha de fin no puede ser anterior a la de inicio.');
  }

  const salarioDiario = salarioAnual / 365;
  const salarioMensual = salarioAnual / 12;
  const importeTramo = (meses: number, diasPorAnio: number) => salarioDiario * (diasPorAnio / 12) * meses;

  const tramos: Tramo[] = [];
  let tope: number;
  let topeMensualidades: number;

  const empiezaAntesDe2012 = compararFechas(inicio, FIN_REGIMEN_ANTERIOR) <= 0;

  if (tipo === 'colectivo') {
    const { diasPorAnio, topeMensualidades: topePactado } = pactado ?? {
      diasPorAnio: DIAS_MINIMOS_ERE,
      topeMensualidades: TOPE_MINIMO_ERE,
    };
    if (!Number.isFinite(diasPorAnio) || diasPorAnio < DIAS_MINIMOS_ERE) {
      throw new RangeError(`Los días por año no pueden ser inferiores al mínimo legal (${DIAS_MINIMOS_ERE}).`);
    }
    if (topePactado !== null && (!Number.isFinite(topePactado) || topePactado < TOPE_MINIMO_ERE)) {
      throw new RangeError(`El tope no puede ser inferior al mínimo legal (${TOPE_MINIMO_ERE} mensualidades).`);
    }
    const meses = mesesTrabajados(inicio, fin);
    tramos.push({ etiqueta: 'Todo el periodo', meses, diasPorAnio, importe: importeTramo(meses, diasPorAnio) });
    topeMensualidades = topePactado ?? Infinity;
    tope = topePactado === null ? Infinity : salarioMensual * topePactado;
  } else if (tipo === 'objetivo') {
    const meses = mesesTrabajados(inicio, fin);
    tramos.push({ etiqueta: 'Todo el periodo', meses, diasPorAnio: 20, importe: importeTramo(meses, 20) });
    topeMensualidades = 12;
    tope = salarioMensual * 12;
  } else if (!empiezaAntesDe2012) {
    const meses = mesesTrabajados(inicio, fin);
    tramos.push({ etiqueta: 'Todo el periodo', meses, diasPorAnio: 33, importe: importeTramo(meses, 33) });
    topeMensualidades = 24;
    tope = salarioMensual * 24;
  } else {
    const finTramo1 = compararFechas(fin, FIN_REGIMEN_ANTERIOR) < 0 ? fin : FIN_REGIMEN_ANTERIOR;
    const meses1 = mesesTrabajados(inicio, finTramo1);
    const importe1 = importeTramo(meses1, 45);
    tramos.push({ etiqueta: 'Hasta el 11/02/2012', meses: meses1, diasPorAnio: 45, importe: importe1 });

    if (compararFechas(fin, INICIO_REGIMEN_ACTUAL) >= 0) {
      const meses2 = mesesTrabajados(INICIO_REGIMEN_ACTUAL, fin);
      tramos.push({ etiqueta: 'Desde el 12/02/2012', meses: meses2, diasPorAnio: 33, importe: importeTramo(meses2, 33) });
    }

    const tope24 = salarioMensual * 24;
    const tope42 = salarioMensual * 42;
    if (importe1 > tope24) {
      tope = Math.min(importe1, tope42);
      topeMensualidades = tope === tope42 ? 42 : tope / salarioMensual;
    } else {
      tope = tope24;
      topeMensualidades = 24;
    }
  }

  const importeSinTope = tramos.reduce((suma, t) => suma + t.importe, 0);
  const topeAplicado = importeSinTope > tope;

  return {
    indemnizacion: topeAplicado ? tope : importeSinTope,
    importeSinTope,
    tope,
    topeAplicado,
    topeMensualidades,
    mesesTotales: tramos.reduce((suma, t) => suma + t.meses, 0),
    salarioDiario,
    salarioMensual,
    tramos,
  };
}
